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

MODEL_DIR   = Path(__file__).parent / 'model'
BACKUP_DIR  = Path(__file__).parent / 'model_backup'
META_FILE   = MODEL_DIR / 'metadata_v1.3.json'
MODEL_FILE  = MODEL_DIR / 'predict_ventes_regions_v1.3.pkl'

def get_current_f1() -> float:
    """Lit le F1-Score du modèle actuellement en production."""
    try:
        meta = json.load(open(META_FILE, encoding='utf-8'))
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
    backups = sorted(BACKUP_DIR.glob('predict_ventes_regions_v1.3_*.pkl'))
    if not backups:
        logger.error('Aucun backup trouvé — impossible de restaurer')
        return
    latest_ts = backups[-1].stem.split('_')[-1]
    for bf in BACKUP_DIR.glob(f'*_{latest_ts}.*'):
        original_name = '_'.join(bf.stem.split('_')[:-1]) + bf.suffix
        shutil.copy2(bf, MODEL_DIR / original_name)
    logger.info('Ancien modèle restauré depuis le backup')

def run_notebook_training() -> float:
    """
    Lance le notebook de réentraînement et retourne le nouveau F1-Score.
    Utilise nbconvert pour exécuter le notebook Jupyter.
    """
    import subprocess
    notebook = Path(__file__).parent.parent / 'ML_VENTES_PREDICTION_REGIONS_PRO_V1.4.ipynb'

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
        new_meta = json.load(open(META_FILE, encoding='utf-8'))
        return float(new_meta.get('f1_score', 0))
    except Exception as e:
        logger.error(f'Impossible de lire les nouvelles métriques: {e}')
        return 0.0

def auto_retrain():
    """Pipeline complet de réentraînement sécurisé."""
    logger.info('=' * 60)
    logger.info('DÉMARRAGE AUTO-RETRAIN')
    logger.info('=' * 60)

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

    logger.info('=' * 60)
    logger.info('AUTO-RETRAIN TERMINÉ')
    logger.info('=' * 60)

if __name__ == '__main__':
    auto_retrain()
