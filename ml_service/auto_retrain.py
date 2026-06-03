"""
AUTO-RETRAIN — Réentraînement automatique sécurisé du modèle ML
===============================================================
Lance ce script manuellement ou via un planificateur.
Il réentraîne le modèle UNIQUEMENT si les nouvelles données
produisent un meilleur F1-Score que le modèle en production.
"""

import json
import shutil
import logging
import sys
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(message)s')
logger = logging.getLogger('AutoRetrain')

# Quality Gate : suivi de la qualité géographique ERP
try:
    from data_quality import measure_geo_quality, log_quality_history, get_quality_summary
    _HAS_QUALITY_MODULE = True
except ImportError:
    _HAS_QUALITY_MODULE = False

MODEL_DIR   = Path(__file__).parent / 'model'
BACKUP_DIR  = Path(__file__).parent / 'model_backup'
META_FILE   = MODEL_DIR / 'metadata_v1.4.json'
MODEL_FILE  = MODEL_DIR / 'predict_ventes_regions_v1.4.pkl'

def get_current_f1() -> float:
    """Lit le F1-Score du modèle actuellement en production."""
    try:
        with open(META_FILE, encoding='utf-8') as f:
            meta = json.load(f)
        return float(meta.get('f1_score', 0))
    except Exception:
        return 0.0

def backup_current_model():
    """Sauvegarde le modèle actuel avant tout remplacement."""
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    for f in MODEL_DIR.glob('*.pkl'):
        shutil.copy2(f, BACKUP_DIR / f'{f.stem}_{ts}{f.suffix}')
    for f in MODEL_DIR.glob('*.json'):
        shutil.copy2(f, BACKUP_DIR / f'{f.stem}_{ts}{f.suffix}')
    logger.info(f'Backup sauvegardé dans model_backup/ (timestamp: {ts})')

def restore_backup():
    """Restaure le dernier backup si le nouveau modèle est moins bon."""
    backups = sorted(BACKUP_DIR.glob('predict_ventes_regions_v1.4_*.pkl'))
    if not backups:
        logger.error('Aucun backup trouvé — impossible de restaurer')
        return
    # Le timestamp occupe les deux derniers segments : <stem>_YYYYMMDD_HHMMSS.pkl
    stem_parts = backups[-1].stem.split('_')
    latest_ts = stem_parts[-2] + '_' + stem_parts[-1]   # ex: 20260531_020002
    for bf in BACKUP_DIR.glob(f'*_{latest_ts}.*'):
        # Reconstruit le nom original en supprimant les deux derniers segments
        orig_parts = bf.stem.split('_')[:-2]
        original_name = '_'.join(orig_parts) + bf.suffix
        shutil.copy2(bf, MODEL_DIR / original_name)
        logger.info(f'  Restauré: {bf.name} → {original_name}')
    logger.info('Ancien modèle restauré depuis le backup')

def run_notebook_training() -> float:
    """
    Lance le notebook de réentraînement et retourne le nouveau F1-Score.
    Utilise nbconvert pour exécuter le notebook Jupyter.
    """
    import subprocess
    notebook = Path(__file__).resolve().parent.parent / 'ML_VENTES_PREDICTION_REGIONS_PRO_V1.4.ipynb'

    if not notebook.exists():
        logger.error(f'Notebook introuvable : {notebook}')
        return 0.0

    logger.info('Lancement du réentraînement ML...')
    result = subprocess.run(
        [sys.executable, '-m', 'nbconvert', '--to', 'notebook',
         '--execute', '--inplace', str(notebook),
         '--ExecutePreprocessor.timeout=600'],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        logger.error(f'Erreur notebook : {result.stderr[:500]}')
        return 0.0

    logger.info('Réentraînement terminé — lecture des nouvelles métriques...')
    try:
        with open(META_FILE, encoding='utf-8') as f:
            new_meta = json.load(f)
        return float(new_meta.get('f1_score', 0))
    except Exception as e:
        logger.error(f'Impossible de lire les nouvelles métriques: {e}')
        return 0.0

def auto_retrain():
    """Pipeline complet de réentraînement sécurisé avec Quality Gate."""
    logger.info('=' * 60)
    logger.info('DÉMARRAGE AUTO-RETRAIN')
    logger.info('=' * 60)

    # 0. Mesurer la qualité géographique ERP avant retraining
    if _HAS_QUALITY_MODULE:
        logger.info('--- Quality Gate ---')
        try:
            geo_quality = measure_geo_quality()
            score  = geo_quality['quality_score']
            augm   = geo_quality['apply_augmentation']
            source = geo_quality['coverage_source']
            logger.info(f'  Couverture géo ERP : {score:.1%} (source: {source})')
            logger.info(f'  Augmentation       : {"ACTIVE" if augm else "DESACTIVEE"}')
            if score >= 0.50:
                logger.info('  ✅ Données géographiques fiables — retraining sur données réelles')
            else:
                logger.info('  ⚠️  Données insuffisantes — augmentation pondérée activée')
            log_quality_history(geo_quality, model_version='v1.4')
        except Exception as e:
            logger.warning(f'Quality Gate non disponible: {e}')
    else:
        logger.warning('Module data_quality non disponible — Quality Gate ignoré')

    # 1. Lire les métriques actuelles
    current_f1 = get_current_f1()
    logger.info(f'Modèle actuel  — F1-Score : {current_f1:.4f}')

    # 2. Sauvegarder le modèle actuel
    backup_current_model()

    # 3. Réentraîner
    new_f1 = run_notebook_training()
    logger.info(f'Nouveau modèle — F1-Score : {new_f1:.4f}')

    # 4. Comparer et décider
    if new_f1 >= current_f1:
        logger.info(f'✅ Nouveau modèle adopté (+{new_f1 - current_f1:.4f})')
        logger.info('   Redémarrez Flask pour charger le nouveau modèle.')
    else:
        logger.warning(f'❌ Nouveau modèle MOINS bon ({new_f1:.4f} < {current_f1:.4f})')
        logger.warning('   Restauration de l\'ancien modèle...')
        restore_backup()
        logger.info('   Ancien modèle restauré — aucune perte.')

    # 5. Résumé qualité (si disponible)
    if _HAS_QUALITY_MODULE:
        try:
            logger.info(get_quality_summary())
        except Exception:
            pass

    logger.info('=' * 60)
    logger.info('AUTO-RETRAIN TERMINÉ')
    logger.info('=' * 60)

if __name__ == '__main__':
    auto_retrain()
