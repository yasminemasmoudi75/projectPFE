"""
EXPÉRIENCE : Impact de la redistribution géographique aléatoire (40 %)
=======================================================================
Compare les métriques ML dans deux scénarios :
  A) Pipeline ACTUEL  — avec redistribution aléatoire pondérée 40 %
  B) Pipeline PROPRE  — sans redistribution (inférence prix seule)

Mesures : Accuracy, F1-Score (weighted), Precision, Recall, AUC-ROC
"""

import sys
import warnings
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import pyodbc
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, VotingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
)
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    roc_auc_score, classification_report
)
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ─── Paramètres ──────────────────────────────────────────────────────────────
RANDOM_STATE = 42
TEST_SIZE    = 0.30
REDIST_RATIO = 0.40   # ratio actuel à tester

REGION_DATA = {
    'Region': [
        'ARIANA','BEJA','BEN_AROUS','BIZERTE','GABES','GAFSA','JENDOUBA',
        'KAIROUAN','KASSERINE','KEBILI','LE_KEF','MAHDIA','MANOUBA','MEDENINE',
        'MONASTIR','NABEUL','SFAX','SIDI_BOUZID','SILIANA','SOUSSE',
        'TATAOUINE','TOZEUR','TUNIS','ZAGHOUAN'
    ],
    'Population': [
        1200000,310000,910000,705000,390000,345000,410000,590000,
        470000,170000,260000,420000,420000,500000,560000,880000,
        960000,430000,230000,720000,150000,140000,1100000,175000
    ],
    'Indice_Achat': [
        118.0,92.0,126.0,108.0,95.0,97.0,90.0,86.0,
        84.0,88.0,91.0,104.0,122.0,98.0,121.0,129.0,
        127.0,85.0,89.0,124.0,83.0,87.0,135.0,94.0
    ],
    'Nb_Hopitaux': [8,4,9,7,5,4,5,6,4,3,4,6,8,6,8,10,11,4,3,9,2,2,12,3],
    'Nb_Laboratoires': [34,16,28,22,18,15,17,20,14,10,13,19,26,21,25,31,36,12,11,29,8,7,40,9]
}

FEATURES = ['Population','Indice_Achat','Nb_Hopitaux','Nb_Laboratoires',
            'Mois','Année','Trimestre','Prix']


# ─── 1. Connexion SQL et extraction ──────────────────────────────────────────
def load_raw_data() -> pd.DataFrame:
    print("[1/5] Connexion SQL Server et extraction des transactions...")
    conn = pyodbc.connect(
        'DRIVER={SQL Server};SERVER=127.0.0.1,1433;DATABASE=AA;UID=sa;PWD=123456789;'
        'TrustServerCertificate=yes;Encrypt=no;',
        timeout=10
    )
    query = """
    SELECT D.CodArt, S.LibArt as Designation, D.Qt as Vente,
           D.DateBL as DateMvt,
           COALESCE(T.gouvernorat, 23) as IdGouvernorat,
           COALESCE(S.PrixVente, 0) as Prix
    FROM TabBcvd D
    LEFT JOIN TabStock S ON D.CodArt = S.CodArt
    LEFT JOIN TabBcvm M ON D.NF = M.Nf
    LEFT JOIN TabTiers T ON M.CodTiers = T.CodTiers
    WHERE D.Qt > 0 AND D.DateBL IS NOT NULL AND YEAR(D.DateBL) >= 2022
    ORDER BY D.DateBL DESC
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df = pd.read_sql(query, conn)
    conn.close()
    df['DateMvt'] = pd.to_datetime(df['DateMvt'], errors='coerce')
    df['Vente']   = pd.to_numeric(df['Vente'], errors='coerce')
    df['Prix']    = pd.to_numeric(df['Prix'],  errors='coerce')
    df = df.dropna(subset=['Vente','Prix','DateMvt'])
    df = df.drop_duplicates().reset_index(drop=True)
    # Clampage IQR sur Prix
    Q1, Q3 = df['Prix'].quantile(0.25), df['Prix'].quantile(0.75)
    IQR = Q3 - Q1
    upper = Q3 + 1.5 * IQR
    df.loc[df['Prix'] > upper, 'Prix'] = upper
    print(f"   → {len(df)} transactions après nettoyage (IQR prix ≤ {upper:.1f} DT)")
    return df


# ─── 2. Inférence géographique ────────────────────────────────────────────────
def infer_geography(df_raw: pd.DataFrame, df_regions: pd.DataFrame,
                    with_redistribution: bool) -> pd.DataFrame:
    df = df_raw.copy().reset_index(drop=True)
    all_regions = df_regions['Region'].values
    all_indices = df_regions['Indice_Achat'].values

    prix_min, prix_max = df['Prix'].min(), df['Prix'].max()
    indice_min, indice_max = all_indices.min(), all_indices.max()

    if prix_max > prix_min:
        df['Indice_Inferred'] = (
            (df['Prix'] - prix_min) / (prix_max - prix_min)
        ) * (indice_max - indice_min) + indice_min
    else:
        df['Indice_Inferred'] = (indice_min + indice_max) / 2

    def assign(val):
        return all_regions[np.argmin(np.abs(all_indices - val))]

    df['Region_Inferred'] = df['Indice_Inferred'].apply(assign)

    if with_redistribution:
        np.random.seed(RANDOM_STATE)
        populations = df_regions.set_index('Region')['Population'].to_dict()
        pop_total   = sum(populations.values())
        weights     = [populations.get(r, 250000) / pop_total for r in all_regions]
        n_redist    = max(1, int(len(df) * REDIST_RATIO))
        redist_idx  = np.random.choice(len(df), n_redist, replace=False)
        col_idx     = df.columns.get_loc('Region_Inferred')
        df.iloc[redist_idx, col_idx] = np.random.choice(
            all_regions, n_redist, replace=True, p=weights
        )

    # Garantir 24 régions couvertes
    covered = set(df['Region_Inferred'].unique())
    for region in all_regions:
        if region not in covered:
            row = df.sample(1, random_state=RANDOM_STATE).copy()
            row['Region_Inferred'] = region
            df = pd.concat([df, row], ignore_index=True)

    return df


# ─── 3. Enrichissement démographique + cible ──────────────────────────────────
def enrich_and_label(df: pd.DataFrame, df_regions: pd.DataFrame) -> pd.DataFrame:
    df['Mois']     = df['DateMvt'].dt.month
    df['Année']    = df['DateMvt'].dt.year
    df['Trimestre'] = df['DateMvt'].dt.quarter

    df_en = pd.merge(
        df,
        df_regions[['Region','Population','Indice_Achat','Nb_Hopitaux','Nb_Laboratoires']],
        left_on='Region_Inferred', right_on='Region', how='left'
    )
    for col in ['Population','Indice_Achat','Nb_Hopitaux','Nb_Laboratoires']:
        df_en[col] = df_en[col].fillna(df_en[col].median())

    # Variable cible Q75 intra-régionale
    df_en['Q75_Region'] = df_en.groupby('Region_Inferred')['Vente'].transform(
        lambda x: x.quantile(0.75)
    )
    df_en['Statut'] = (df_en['Vente'] >= df_en['Q75_Region']).map(
        {True: 'HAUSSE', False: 'BAISSE'}
    )
    return df_en


# ─── 4. Entraînement du modèle (même pipeline que le notebook) ───────────────
def train_and_evaluate(df_en: pd.DataFrame, label: str) -> dict:
    X = df_en[FEATURES]
    y = df_en['Statut']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    model = VotingClassifier(estimators=[
        ('rf', RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE,
                                      n_jobs=-1, class_weight='balanced')),
        ('gb', GradientBoostingClassifier(n_estimators=100, random_state=RANDOM_STATE,
                                          learning_rate=0.1)),
        ('lr', LogisticRegression(max_iter=500, random_state=RANDOM_STATE,
                                  class_weight='balanced')),
    ], voting='soft')

    sw = compute_sample_weight('balanced', y_train)
    model.fit(X_train, y_train)

    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    le = LabelEncoder().fit(y)
    y_test_enc  = le.transform(y_test)
    hausse_idx  = list(le.classes_).index('HAUSSE')
    y_proba_pos = y_proba[:, hausse_idx]

    acc       = accuracy_score(y_test, y_pred)
    f1        = f1_score(y_test, y_pred, average='weighted')
    prec      = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec       = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    auc       = roc_auc_score(y_test_enc, y_proba_pos)
    prec_h    = precision_score(y_test, y_pred, pos_label='HAUSSE', zero_division=0)
    rec_h     = recall_score(y_test, y_pred, pos_label='HAUSSE', zero_division=0)
    f1_h      = f1_score(y_test, y_pred, pos_label='HAUSSE', zero_division=0)

    # CV 5-folds
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)

    hausse_pct = (y == 'HAUSSE').mean() * 100
    n_unique   = df_en['Region_Inferred'].nunique()

    return {
        'label':           label,
        'n_samples':       len(df_en),
        'n_regions':       n_unique,
        'hausse_pct':      round(hausse_pct, 2),
        'accuracy':        round(acc, 4),
        'f1_weighted':     round(f1, 4),
        'precision_w':     round(prec, 4),
        'recall_w':        round(rec, 4),
        'auc_roc':         round(auc, 4),
        'prec_HAUSSE':     round(prec_h, 4),
        'recall_HAUSSE':   round(rec_h, 4),
        'f1_HAUSSE':       round(f1_h, 4),
        'cv_mean':         round(cv_scores.mean(), 4),
        'cv_std':          round(cv_scores.std(), 4),
    }


# ─── 5. Rapport ───────────────────────────────────────────────────────────────
def print_report(r_avec: dict, r_sans: dict):
    sep = '=' * 72
    print(f'\n{sep}')
    print('  RÉSULTATS — IMPACT REDISTRIBUTION GÉOGRAPHIQUE ALÉATOIRE 40 %')
    print(sep)
    fmt = '{:<28} {:>12} {:>12} {:>10}'
    print(fmt.format('Métrique', 'AVEC redist.', 'SANS redist.', 'Δ'))
    print('-' * 72)

    metrics = [
        ('Accuracy',          'accuracy'),
        ('F1-Score (weighted)','f1_weighted'),
        ('Precision (weighted)','precision_w'),
        ('Recall (weighted)',  'recall_w'),
        ('AUC-ROC',           'auc_roc'),
        ('Precision HAUSSE',  'prec_HAUSSE'),
        ('Recall HAUSSE',     'recall_HAUSSE'),
        ('F1 HAUSSE',         'f1_HAUSSE'),
        ('CV Accuracy (mean)', 'cv_mean'),
        ('CV Accuracy (std)', 'cv_std'),
    ]

    for name, key in metrics:
        va = r_avec[key]
        vs = r_sans[key]
        delta = vs - va
        sign  = '+' if delta > 0 else ''
        print(fmt.format(name, f'{va:.4f}', f'{vs:.4f}', f'{sign}{delta:.4f}'))

    print(sep)
    print(f"  Échantillons AVEC: {r_avec['n_samples']}  |  SANS: {r_sans['n_samples']}")
    print(f"  HAUSSE AVEC: {r_avec['hausse_pct']}%  |  SANS: {r_sans['hausse_pct']}%")
    print(sep)

    # Recommandation
    delta_f1  = r_sans['f1_weighted'] - r_avec['f1_weighted']
    delta_auc = r_sans['auc_roc']     - r_avec['auc_roc']
    delta_rec = r_sans['recall_HAUSSE'] - r_avec['recall_HAUSSE']

    print('\n  ANALYSE ET RECOMMANDATION')
    print('-' * 72)
    if delta_f1 > 0.01:
        print(f'  ✅ Supprimer la redistribution AMÉLIORE le F1 de +{delta_f1:.4f}')
        print('     → Recommandation : SUPPRIMER définitivement la redistribution 40%')
        print('     → Appliquer la Modification 1 dans le notebook.')
    elif delta_f1 < -0.01:
        print(f'  ⚠️  Supprimer la redistribution DÉGRADE le F1 de {delta_f1:.4f}')
        print('     → La redistribution augmente artificiellement la diversité')
        print('        géographique et aide le modèle à généraliser sur 24 régions.')
        print('     → Recommandation : CONSERVER mais documenter explicitement')
        print('        comme technique d\'augmentation de données.')
    else:
        print(f'  ≈  Impact neutre sur le F1 (Δ={delta_f1:.4f})')
        print('     → Recommandation : SUPPRIMER pour plus de rigueur scientifique,')
        print('        les métriques sont équivalentes.')

    if delta_rec > 0.02:
        print(f'  ✅ Recall HAUSSE améliore de +{delta_rec:.4f} sans redistribution')
    elif delta_rec < -0.02:
        print(f'  ⚠️  Recall HAUSSE baisse de {delta_rec:.4f} sans redistribution')


# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('=' * 72)
    print('  EXPÉRIENCE : REDISTRIBUTION GÉOGRAPHIQUE — AVEC vs SANS')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 72)

    df_regions = pd.DataFrame(REGION_DATA)
    df_raw     = load_raw_data()

    print('\n[2/5] Pipeline A — AVEC redistribution aléatoire (40 %)...')
    df_avec = infer_geography(df_raw, df_regions, with_redistribution=True)
    df_avec = enrich_and_label(df_avec, df_regions)
    print(f'   Distribution régions: {df_avec["Region_Inferred"].value_counts().head(5).to_dict()}...')

    print('\n[3/5] Pipeline B — SANS redistribution...')
    df_sans = infer_geography(df_raw, df_regions, with_redistribution=False)
    df_sans = enrich_and_label(df_sans, df_regions)
    print(f'   Distribution régions: {df_sans["Region_Inferred"].value_counts().head(5).to_dict()}...')

    print('\n[4/5] Entraînement et évaluation Pipeline A (avec redistribution)...')
    r_avec = train_and_evaluate(df_avec, 'AVEC redistribution 40%')

    print('\n[5/5] Entraînement et évaluation Pipeline B (sans redistribution)...')
    r_sans = train_and_evaluate(df_sans, 'SANS redistribution')

    print_report(r_avec, r_sans)

    # Sauvegarder les résultats
    out = {
        'generated_at': datetime.now().isoformat(),
        'avec_redistribution': r_avec,
        'sans_redistribution': r_sans,
        'delta': {k: round(r_sans[k] - r_avec[k], 4)
                  for k in ['accuracy','f1_weighted','precision_w','recall_w',
                             'auc_roc','prec_HAUSSE','recall_HAUSSE','f1_HAUSSE',
                             'cv_mean']}
    }
    out_path = Path(__file__).parent / 'experiment_geo_results.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f'\n  Résultats sauvegardés → {out_path}')
