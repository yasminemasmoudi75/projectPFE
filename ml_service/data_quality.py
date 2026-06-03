"""
DATA QUALITY MODULE — Mesure de la qualité géographique des données ERP
=======================================================================
Évalue la couverture géographique réelle des transactions en base de données.
Utilisé comme "quality gate" pour décider si l'augmentation géographique
est nécessaire avant chaque cycle d'entraînement.

Logique industrielle :
  - Si coverage réelle >= THRESHOLD → données fiables, pas d'augmentation
  - Si coverage réelle <  THRESHOLD → proxy prix + augmentation pondérée
"""

import json
import logging
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict

logger = logging.getLogger(__name__)

# Seuil de qualité : % minimum de transactions avec géo ERP fiable
# En dessous → augmentation activée. Au-dessus → augmentation désactivée.
# Valeur recommandée industrielle : 0.50 (50% de couverture réelle suffisante)
GEO_QUALITY_THRESHOLD = 0.50

# Fichier de log d'historique de qualité (traçabilité MLOps)
QUALITY_LOG_PATH = Path(__file__).parent / 'model' / 'data_quality_history.json'


def measure_geo_quality(conn=None, conn_str: str = None) -> Dict:
    """
    Mesure la qualité géographique réelle des transactions ERP.

    Stratégie multi-source (ordre de priorité) :
      1. TabBcvd → TabBcvm → TabTiers.Ville   (transactions directes)
      2. TabBlvm → TabTiers.Ville              (factures — meilleure couverture)
      3. TabTiers.gouvernorat discriminant     (code ERP non-défaut)

    Args:
        conn:      Connexion pyodbc existante (réutilisée si fournie)
        conn_str:  Chaîne de connexion SQL Server (utilisée si conn=None)

    Returns:
        dict avec les clés :
          - quality_score      : float [0.0, 1.0] — couverture géo réelle
          - coverage_source    : str — source ayant donné la meilleure couverture
          - apply_augmentation : bool — True si augmentation nécessaire
          - details            : dict — métriques détaillées par source
          - timestamp          : str ISO
    """
    import pandas as pd

    result = {
        'quality_score':      0.0,
        'coverage_source':    'none',
        'apply_augmentation': True,
        'details':            {},
        'timestamp':          datetime.now().isoformat(),
        'threshold_used':     GEO_QUALITY_THRESHOLD,
    }

    _own_conn = False
    try:
        if conn is None:
            if conn_str is None:
                conn_str = (
                    'DRIVER={SQL Server};SERVER=127.0.0.1,1433;'
                    'DATABASE=AA;UID=sa;PWD=123456789;'
                    'TrustServerCertificate=yes;Encrypt=no;'
                )
            import pyodbc
            conn = pyodbc.connect(conn_str, timeout=10)
            _own_conn = True

        # ── Source 1 : TabBcvd → TabBcvm → TabTiers.Ville ───────────────────
        q1 = """
            SELECT COUNT(*) AS Total,
                   SUM(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(T.Ville,'')))) > 2 THEN 1 ELSE 0 END) AS WithVille
            FROM TabBcvd D
            LEFT JOIN TabBcvm M ON D.NF = M.Nf
            LEFT JOIN TabTiers T ON M.CodTiers = T.CodTiers
            WHERE D.Qt > 0 AND D.DateBL IS NOT NULL AND YEAR(D.DateBL) >= 2022
        """
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            df1 = pd.read_sql(q1, conn)
        total_bcvd   = int(df1['Total'].iloc[0])
        with_v_bcvd  = int(df1['WithVille'].iloc[0])
        cov_bcvd     = with_v_bcvd / max(total_bcvd, 1)
        result['details']['tabBcvd_ville'] = {
            'total': total_bcvd, 'with_geo': with_v_bcvd, 'coverage': round(cov_bcvd, 4)
        }

        # ── Source 2 : TabBlvm → TabTiers.Ville ─────────────────────────────
        q2 = """
            SELECT COUNT(*) AS Total,
                   SUM(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(T.Ville,'')))) > 2 THEN 1 ELSE 0 END) AS WithVille
            FROM TabBlvm B
            LEFT JOIN TabTiers T ON B.CodTiers = T.CodTiers
            WHERE B.Valid = 1 AND YEAR(B.MDate) >= 2022
        """
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            df2 = pd.read_sql(q2, conn)
        total_blvm  = int(df2['Total'].iloc[0])
        with_v_blvm = int(df2['WithVille'].iloc[0])
        cov_blvm    = with_v_blvm / max(total_blvm, 1)
        result['details']['tabBlvm_ville'] = {
            'total': total_blvm, 'with_geo': with_v_blvm, 'coverage': round(cov_blvm, 4)
        }

        # ── Source 3 : TabTiers.gouvernorat discriminant (non-défaut) ────────
        # Le code 17 est le code par défaut ERP (non informatif)
        DEFAULT_GOV_CODES = {17, 0, 23}
        q3 = """
            SELECT COUNT(*) AS Total,
                   SUM(CASE WHEN T.gouvernorat IS NOT NULL
                                 AND T.gouvernorat NOT IN (0, 17, 23) THEN 1 ELSE 0 END) AS WithGov
            FROM TabBcvd D
            LEFT JOIN TabBcvm M ON D.NF = M.Nf
            LEFT JOIN TabTiers T ON M.CodTiers = T.CodTiers
            WHERE D.Qt > 0 AND D.DateBL IS NOT NULL AND YEAR(D.DateBL) >= 2022
        """
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            df3 = pd.read_sql(q3, conn)
        total_gov  = int(df3['Total'].iloc[0])
        with_gov   = int(df3['WithGov'].iloc[0])
        cov_gov    = with_gov / max(total_gov, 1)
        result['details']['gouvernorat_field'] = {
            'total': total_gov, 'with_geo': with_gov, 'coverage': round(cov_gov, 4),
            'note': 'Codes exclus comme non-discriminants: 0, 17, 23'
        }

        # ── Score final : meilleure couverture disponible ────────────────────
        scores = {
            'tabBcvd_ville':    cov_bcvd,
            'tabBlvm_ville':    cov_blvm,
            'gouvernorat_field': cov_gov,
        }
        best_source = max(scores, key=scores.get)
        best_score  = scores[best_source]

        result['quality_score']      = round(best_score, 4)
        result['coverage_source']    = best_source
        result['apply_augmentation'] = best_score < GEO_QUALITY_THRESHOLD

        logger.info(
            f"[GEO_QUALITY] Score={best_score:.1%} (source={best_source}) "
            f"| Augmentation={'ON' if result['apply_augmentation'] else 'OFF'} "
            f"(seuil={GEO_QUALITY_THRESHOLD:.0%})"
        )

    except Exception as e:
        logger.warning(f"[GEO_QUALITY] Erreur mesure — augmentation activée par défaut: {e}")
        result['error'] = str(e)
        result['apply_augmentation'] = True  # fail-safe : augmenter si mesure impossible

    finally:
        if _own_conn and conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return result


def log_quality_history(quality_result: Dict, model_version: str = 'unknown') -> None:
    """
    Enregistre le score de qualité dans l'historique MLOps.
    Permet de suivre l'évolution de la qualité des données ERP au fil du temps.
    """
    QUALITY_LOG_PATH.parent.mkdir(exist_ok=True)

    history = []
    if QUALITY_LOG_PATH.exists():
        try:
            with open(QUALITY_LOG_PATH, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception:
            history = []

    entry = {
        'timestamp':          quality_result.get('timestamp', datetime.now().isoformat()),
        'model_version':      model_version,
        'quality_score':      quality_result.get('quality_score', 0.0),
        'coverage_source':    quality_result.get('coverage_source', 'unknown'),
        'apply_augmentation': quality_result.get('apply_augmentation', True),
        'threshold':          quality_result.get('threshold_used', GEO_QUALITY_THRESHOLD),
    }
    history.append(entry)

    with open(QUALITY_LOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

    logger.info(f"[GEO_QUALITY] Historique mis à jour ({len(history)} entrées)")


def get_quality_summary() -> str:
    """
    Retourne un résumé lisible de l'historique de qualité.
    Utile pour les rapports de soutenance et la documentation MLOps.
    """
    if not QUALITY_LOG_PATH.exists():
        return "Aucun historique de qualité disponible."

    with open(QUALITY_LOG_PATH, 'r', encoding='utf-8') as f:
        history = json.load(f)

    if not history:
        return "Historique vide."

    last = history[-1]
    scores = [h['quality_score'] for h in history]
    augm_count = sum(1 for h in history if h['apply_augmentation'])

    lines = [
        f"Historique qualité géographique ERP ({len(history)} mesures)",
        f"  Dernière mesure : {last['timestamp'][:10]}",
        f"  Score actuel    : {last['quality_score']:.1%}",
        f"  Augmentation    : {'ACTIVE' if last['apply_augmentation'] else 'DESACTIVEE'}",
        f"  Tendance        : min={min(scores):.1%} → max={max(scores):.1%}",
        f"  Cycles avec augmentation : {augm_count}/{len(history)}",
    ]
    return '\n'.join(lines)


# ─── Usage autonome ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(message)s')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

    print("Mesure de la qualité géographique ERP...")
    result = measure_geo_quality()

    print(f"\nScore de qualité  : {result['quality_score']:.1%}")
    print(f"Source principale : {result['coverage_source']}")
    print(f"Augmentation      : {'NÉCESSAIRE' if result['apply_augmentation'] else 'NON NÉCESSAIRE'}")
    print(f"Seuil configuré   : {result['threshold_used']:.0%}")
    print("\nDétail par source :")
    for src, d in result.get('details', {}).items():
        print(f"  {src:30s} : {d.get('coverage', 0):.1%} ({d.get('with_geo', 0)}/{d.get('total', 0)})")

    log_quality_history(result, model_version='v1.4')
    print(f"\n{get_quality_summary()}")
