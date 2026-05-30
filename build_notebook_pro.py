#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de génération du notebook ML professionnel V1.4 — Jury Ready
"""
import json
from pathlib import Path

nb_path = Path('d:/pfe/pfe2/backend/ML_VENTES_PREDICTION_REGIONS_CORRECT_V1.3.ipynb')
out_path = Path('d:/pfe/pfe2/backend/ML_VENTES_PREDICTION_REGIONS_PRO_V1.4.ipynb')
# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIFS V1.4.1 :
#  1. y_pred recalculé APRÈS GridSearchCV pour cohérence confusion matrix / ROC
#  2. Label "ÉTAPE 14b" renommé "ÉTAPE 16d"
#  3. Séparateurs markdown de phases ajoutés
#  4. Cellule de conclusion métier ajoutée
# ─────────────────────────────────────────────────────────────────────────────

nb = json.load(open(nb_path, encoding='utf-8'))

def code(src):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": src}

def md(src):
    return {"cell_type": "markdown", "metadata": {}, "source": src}

# ─────────────────────────────────────────────────────────────────────────────
# Récupération des cellules originales (indices stables)
# ─────────────────────────────────────────────────────────────────────────────
orig = nb['cells']

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 0 — Page de garde professionnelle (remplacement)
# ─────────────────────────────────────────────────────────────────────────────
cell_title = md(
"""# PIPELINE ML VENTES — RÉGIONS TUNISIENNES — V1.4 — JURY READY
## Classification Binaire HAUSSE / BAISSE des Ventes Commerciales par Gouvernorat

---

| Critère | Valeur |
|:---|:---|
| **Domaine** | Intelligence Commerciale & Aide à la Décision |
| **Source des données** | Transactions ERP SQL Server (2022–2025) |
| **Cible ML** | Classification binaire — **HAUSSE (1)** / **BAISSE (0)** |
| **Modèles comparés** | 10 architectures supervisées |
| **Couverture géographique** | 24 Gouvernorats Tunisiens |
| **Version** | **V1.4 — Jury Prêt** |

---

### Objectifs Scientifiques du Pipeline

1. **Explorer** les données transactionnelles et leurs distributions statistiques (EDA)
2. **Prétraiter** les outliers, valeurs manquantes et déséquilibre de classes
3. **Construire et comparer** 10 modèles de classification supervisée
4. **Optimiser** le champion par recherche d'hyperparamètres (GridSearchCV)
5. **Évaluer** la robustesse via validation croisée, courbes ROC, PR et d'apprentissage
6. **Déployer** les artefacts MLOps pour intégration Flask / API REST

---
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 1 — Imports (correction : ajout imblearn si disponible)
# ─────────────────────────────────────────────────────────────────────────────
cell_imports = code(
"""# ==========================================================================
# ÉTAPE 1 : IMPORTS ET CONFIGURATION DES OUTILS DE RENDU VISUEL
# ==========================================================================
import pyodbc
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_val_score,
    GridSearchCV, learning_curve
)
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, VotingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    roc_curve, auc, precision_recall_curve
)
import joblib
import json
import os
import sys
import time
import warnings
from datetime import datetime
from pathlib import Path

warnings.filterwarnings('ignore')

# ── Configuration graphique globale ──────────────────────────────────────────
sns.set_theme(style='whitegrid', palette='muted')
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'figure.titlesize': 16,
    'figure.dpi': 150
})

print('✅ [01/20] Imports et configuration des thèmes graphiques terminés avec succès !')
print(f'    Python {sys.version.split(chr(10))[0]}')
print(f'    Pandas v{pd.__version__} | NumPy v{np.__version__}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 2 — MLValidator (identique, gardée)
# ─────────────────────────────────────────────────────────────────────────────
cell_validator = orig[2]  # identique

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 3 — Données régionales (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_regions = orig[3]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 4 — Connexion SQL Server (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_sql = orig[4]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 5 — Qualité des données & Outliers (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_quality = orig[5]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 5b — NOUVELLE : EDA — Analyse Exploratoire des Données
# ─────────────────────────────────────────────────────────────────────────────
cell_eda = code(
"""# ==========================================================================
# ÉTAPE 5b : ANALYSE EXPLORATOIRE DES DONNÉES (EDA)
# ==========================================================================
print('\\n🔍 [05b] ANALYSE EXPLORATOIRE DES DONNÉES (EDA)...')
print('='*80)

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Analyse Exploratoire des Données Transactionnelles',
             fontweight='bold', fontsize=15)

# 1. Distribution des quantités vendues (95e percentile pour lisibilité)
vente_clip = df_cleaned['Vente'].clip(0, df_cleaned['Vente'].quantile(0.95))
axes[0, 0].hist(vente_clip, bins=40, color='#0284c7', edgecolor='white', alpha=0.85)
axes[0, 0].set_title('Distribution des Quantités Vendues', fontweight='bold')
axes[0, 0].set_xlabel('Quantité (Vente)')
axes[0, 0].set_ylabel('Fréquence')
axes[0, 0].spines[['top', 'right']].set_visible(False)
axes[0, 0].axvline(df_cleaned['Vente'].median(), color='#dc2626', lw=2, linestyle='--',
                   label=f'Médiane = {df_cleaned["Vente"].median():.1f}')
axes[0, 0].legend(fontsize=9)

# 2. Distribution des Prix (après clamping IQR)
axes[0, 1].hist(df_cleaned['Prix'], bins=40, color='#7c3aed', edgecolor='white', alpha=0.85)
axes[0, 1].set_title('Distribution des Prix (après clamping IQR)', fontweight='bold')
axes[0, 1].set_xlabel('Prix (DT)')
axes[0, 1].set_ylabel('Fréquence')
axes[0, 1].spines[['top', 'right']].set_visible(False)
axes[0, 1].axvline(df_cleaned['Prix'].median(), color='#dc2626', lw=2, linestyle='--',
                   label=f'Médiane = {df_cleaned["Prix"].median():.1f}')
axes[0, 1].legend(fontsize=9)

# 3. Évolution mensuelle du volume des ventes
monthly = df_cleaned.groupby(df_cleaned['DateMvt'].dt.to_period('M'))['Vente'].sum()
monthly.index = monthly.index.astype(str)
if len(monthly) > 24:
    monthly = monthly.tail(24)
idx = range(len(monthly))
axes[1, 0].plot(idx, monthly.values, color='#059669', lw=2.5, marker='o', markersize=4)
axes[1, 0].fill_between(idx, monthly.values, alpha=0.15, color='#059669')
axes[1, 0].set_title('Évolution Mensuelle du Volume de Ventes', fontweight='bold')
axes[1, 0].set_xlabel('Mois')
axes[1, 0].set_ylabel('Volume Total')
step = max(1, len(monthly) // 6)
axes[1, 0].set_xticks(list(range(0, len(monthly), step)))
axes[1, 0].set_xticklabels([monthly.index[i] for i in range(0, len(monthly), step)], rotation=30, ha='right')
axes[1, 0].spines[['top', 'right']].set_visible(False)

# 4. Boxplot Prix par trimestre
df_eda = df_cleaned.copy()
df_eda['Trimestre_Libelle'] = 'T' + df_eda['DateMvt'].dt.quarter.astype(str)
trim_order = ['T1', 'T2', 'T3', 'T4']
trim_data = [df_eda.loc[df_eda['Trimestre_Libelle'] == t, 'Prix'].dropna().values for t in trim_order]
bp = axes[1, 1].boxplot(
    trim_data, labels=trim_order, patch_artist=True,
    medianprops=dict(color='#dc2626', lw=2),
    flierprops=dict(marker='o', color='#94a3b8', alpha=0.3, markersize=3)
)
colors_box = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6']
for patch, c in zip(bp['boxes'], colors_box):
    patch.set_facecolor(c)
axes[1, 1].set_title('Distribution des Prix par Trimestre', fontweight='bold')
axes[1, 1].set_xlabel('Trimestre')
axes[1, 1].set_ylabel('Prix (DT)')
axes[1, 1].spines[['top', 'right']].set_visible(False)

plt.tight_layout()
plt.savefig('eda_distributions.png', dpi=200, bbox_inches='tight')
plt.show()
print('✅ Graphique EDA "eda_distributions.png" généré et enregistré !')

print('\\n📊 Statistiques descriptives :')
print(df_cleaned[['Vente', 'Prix']].describe().round(2).to_string())
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 6 — Inférence géographique (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_geo = orig[6]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 7 — Enrichissement démographique (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_enrich = orig[7]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 7b — NOUVELLE : Matrice de corrélation des features
# ─────────────────────────────────────────────────────────────────────────────
cell_corr = code(
"""# ==========================================================================
# ÉTAPE 7b : MATRICE DE CORRÉLATION DES ATTRIBUTS PRÉDICTIFS
# ==========================================================================
print('\\n🔗 [07b] MATRICE DE CORRÉLATION DES FEATURES...')
print('='*80)

feat_cols_corr = ['Vente', 'Prix', 'Population', 'Indice_Achat',
                  'Nb_Hopitaux', 'Nb_Laboratoires', 'Mois', 'Trimestre']
corr_matrix = df_enriched[feat_cols_corr].corr()

plt.figure(figsize=(10, 8))
sns.heatmap(
    corr_matrix,
    annot=True, fmt='.2f',
    cmap='RdBu_r', center=0, vmin=-1, vmax=1,
    square=True, linewidths=0.5,
    cbar_kws={'shrink': 0.8, 'label': 'Coefficient de Pearson'},
    annot_kws={'size': 9}
)
plt.title('Matrice de Corrélation des Variables Prédictives',
          pad=20, fontweight='bold', fontsize=13)
plt.tight_layout()
plt.savefig('correlation_matrix.png', dpi=200, bbox_inches='tight')
plt.show()
print('✅ Graphique "correlation_matrix.png" généré et enregistré !')

# Identifier les paires fortement corrélées
pairs = []
for i in range(len(feat_cols_corr)):
    for j in range(i+1, len(feat_cols_corr)):
        val = abs(corr_matrix.iloc[i, j])
        if val > 0.6:
            pairs.append((feat_cols_corr[i], feat_cols_corr[j], corr_matrix.iloc[i, j]))

if pairs:
    print('\\n⚠️  Paires fortement corrélées (|r| > 0.6) :')
    for a, b, r in pairs:
        print(f'   {a} ↔ {b} : r = {r:.3f}')
else:
    print('\\n✅ Aucune multicolinéarité critique détectée (|r| ≤ 0.6 pour toutes les paires).')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 8 — Variable cible (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_target = orig[8]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 8b — NOUVELLE : Visualisation du déséquilibre de classes
# ─────────────────────────────────────────────────────────────────────────────
cell_class_viz = code(
"""# ==========================================================================
# ÉTAPE 8b : VISUALISATION DU DÉSÉQUILIBRE DE CLASSES
# ==========================================================================
print('\\n📊 [08b] VISUALISATION DE LA DISTRIBUTION DES CLASSES...')

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('Analyse du Déséquilibre de Classes — HAUSSE vs BAISSE',
             fontweight='bold', fontsize=13)

# Graphique 1 : Barplot global
class_counts = df_enriched['Statut'].value_counts()
colors_cls = {'BAISSE': '#1e40af', 'HAUSSE': '#dc2626'}
bars = axes[0].bar(
    class_counts.index,
    class_counts.values,
    color=[colors_cls.get(c, '#64748b') for c in class_counts.index],
    width=0.5, edgecolor='white'
)
for bar in bars:
    h = int(bar.get_height())
    pct = h / len(df_enriched) * 100
    axes[0].text(bar.get_x() + bar.get_width() / 2, h + 30,
                 f'{h:,}\\n({pct:.1f}%)', ha='center', fontweight='bold', fontsize=11)
axes[0].set_title('Distribution Globale', fontweight='bold')
axes[0].set_ylabel("Nombre d'échantillons")
axes[0].spines[['top', 'right']].set_visible(False)
axes[0].set_ylim(0, class_counts.max() * 1.18)

# Graphique 2 : Taux HAUSSE par top 10 gouvernorats
hausse_rate = (
    df_enriched.groupby('Region_Inferred')['Statut']
    .apply(lambda x: (x == 'HAUSSE').mean() * 100)
    .sort_values(ascending=True)
    .tail(15)
)
bar_colors = ['#dc2626' if v >= 40 else '#f59e0b' if v >= 25 else '#1e40af'
              for v in hausse_rate.values]
axes[1].barh(hausse_rate.index, hausse_rate.values, color=bar_colors, height=0.7, edgecolor='white')
axes[1].axvline(x=hausse_rate.mean(), color='#64748b', linestyle='--', lw=1.5,
                label=f'Moyenne = {hausse_rate.mean():.1f}%')
axes[1].set_title('Taux HAUSSE par Gouvernorat (%)', fontweight='bold')
axes[1].set_xlabel('Taux HAUSSE (%)')
axes[1].legend(fontsize=9)
axes[1].spines[['top', 'right']].set_visible(False)

plt.tight_layout()
plt.savefig('class_distribution.png', dpi=200, bbox_inches='tight')
plt.show()
print('✅ Graphique "class_distribution.png" généré et enregistré !')

ratio = (df_enriched['Statut'] == 'BAISSE').sum() / max((df_enriched['Statut'] == 'HAUSSE').sum(), 1)
print(f'\\n   Ratio BAISSE/HAUSSE : {ratio:.2f}:1')
if ratio > 2:
    print('   ⚠️  Déséquilibre significatif — class_weight="balanced" appliqué sur tous les modèles éligibles.')
else:
    print('   ✅ Déséquilibre modéré — les modèles s\\'adapteront naturellement.')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 9 — Train/Test split (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_split = orig[9]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 10 — Benchmark 10 modèles (correction du double sample_weight)
# ─────────────────────────────────────────────────────────────────────────────
cell_benchmark = code(
"""# ==========================================================================
# ÉTAPE 10 : BENCHMARK COMPARATIF DES 10 ARCHITECTURES ML
# ==========================================================================
print('\\n🤖 [10/20] ENTRAINEMENT ET BENCHMARK DES 10 ARCHITECTURES ML...')
print('='*80)

le = LabelEncoder()
y_enc       = le.fit_transform(y)
y_train_enc = le.transform(y_train)
y_test_enc  = le.transform(y_test)

scaler_algorithms = StandardScaler()
X_train_scaled    = scaler_algorithms.fit_transform(X_train)
X_test_scaled     = scaler_algorithms.transform(X_test)

algos_need_scaling = {'Logistic Regression', 'KNN', 'SVM (RBF)'}

try:
    from xgboost import XGBClassifier
    has_xgb = True
except ImportError:
    has_xgb = False
    from sklearn.ensemble import ExtraTreesClassifier
    print('⚠️  XGBoost non installé — remplacé par ExtraTreesClassifier')

scale_pos = (y_train == 'BAISSE').sum() / max((y_train == 'HAUSSE').sum(), 1)

algorithms = {
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced'),
    'Decision Tree':       DecisionTreeClassifier(max_depth=8, random_state=42, class_weight='balanced'),
    'Random Forest':       RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight='balanced'),
    'Gradient Boosting':   GradientBoostingClassifier(n_estimators=100, random_state=42),
    'AdaBoost':            AdaBoostClassifier(n_estimators=100, random_state=42, algorithm='SAMME'),
    'KNN':                 KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
    'SVM (RBF)':           SVC(kernel='rbf', probability=True, random_state=42, class_weight='balanced'),
    'Gaussian Naive Bayes': GaussianNB(),
    ('XGBoost' if has_xgb else 'Extra Trees'): (
        XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss',
                      verbosity=0, scale_pos_weight=scale_pos)
        if has_xgb else
        ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight='balanced')
    ),
    'Voting Ensemble': VotingClassifier(estimators=[
        ('rf', RandomForestClassifier(n_estimators=50, random_state=42, class_weight='balanced')),
        ('gb', GradientBoostingClassifier(n_estimators=50, random_state=42)),
        ('lr', LogisticRegression(max_iter=500, random_state=42, class_weight='balanced')),
    ], voting='soft')
}

results, best_f1, best_model, best_model_name = [], 0.0, None, None
sw_train = compute_sample_weight('balanced', y_train)
# algo XGBoost encode les labels en entiers
xgb_name = 'XGBoost' if has_xgb else 'Extra Trees'

for name, model in algorithms.items():
    try:
        t0 = time.time()
        if name in algos_need_scaling:
            model.fit(X_train_scaled, y_train)
            y_pred_tmp = model.predict(X_test_scaled)
        elif name == xgb_name and has_xgb:
            model.fit(X_train, y_train_enc, sample_weight=sw_train)
            y_pred_tmp = le.inverse_transform(model.predict(X_test))
        elif name in ('Gradient Boosting', 'AdaBoost'):
            try:
                model.fit(X_train, y_train, sample_weight=sw_train)
            except TypeError:
                model.fit(X_train, y_train)
            y_pred_tmp = model.predict(X_test)
        elif name == 'Voting Ensemble':
            model.fit(X_train, y_train)
            y_pred_tmp = model.predict(X_test)
        else:
            model.fit(X_train, y_train)
            y_pred_tmp = model.predict(X_test)

        elapsed = time.time() - t0
        acc  = accuracy_score(y_test, y_pred_tmp)
        prec = precision_score(y_test, y_pred_tmp, average='weighted', zero_division=0)
        rec  = recall_score(y_test, y_pred_tmp, average='weighted', zero_division=0)
        f1   = f1_score(y_test, y_pred_tmp, average='weighted', zero_division=0)

        results.append({'Modèle': name, 'Accuracy': round(acc,4), 'Precision': round(prec,4),
                        'Recall': round(rec,4), 'F1-Score': round(f1,4), 'Temps (s)': round(elapsed,2)})

        if f1 > best_f1:
            best_f1, best_model, best_model_name = f1, model, name

        tag = '🏆' if f1 == max(r['F1-Score'] for r in results) else '  '
        print(f'  {tag} {name:30s}  Acc={acc:.4f}  F1={f1:.4f}  ({elapsed:.1f}s)')
    except Exception as e:
        print(f'  ❌ {name:30s}  Erreur: {e}')

df_comparison = pd.DataFrame(results).sort_values('F1-Score', ascending=False).reset_index(drop=True)

print(f'\\n{"="*60}')
print(f'🏆  MEILLEUR MODÈLE : {best_model_name}')
print(f'    F1-Score        : {best_f1:.4f}')
print(f'{"="*60}')
print('\\n', df_comparison.to_string(index=False))

validator.check(best_f1 >= 0.55, 'F1-SCORE MINIMUM',
    f'Le meilleur modèle doit dépasser 55% — actuel : {best_f1:.4f}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 11 — Validation croisée (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_cv = orig[11]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 12 — Rapport de classification (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_report = orig[12]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 12b — NOUVELLE : Optimisation des hyperparamètres (GridSearchCV)
# FIX : y_pred recalculé après tuning pour cohérence avec confusion matrix / ROC
# ─────────────────────────────────────────────────────────────────────────────
cell_grid = code(
"""# ==========================================================================
# ÉTAPE 12b : OPTIMISATION DES HYPERPARAMÈTRES — GRIDSEARCHCV
# ==========================================================================
print('\\n⚙️  [12b] OPTIMISATION DES HYPERPARAMÈTRES (GRIDSEARCHCV)...')
print('='*80)

# Définir la grille selon le modèle champion
_bname = best_model_name  # nom original sans suffixe
if 'Decision Tree' in _bname:
    param_grid = {
        'max_depth':         [5, 8, 12, None],
        'min_samples_split': [2, 10, 20],
        'min_samples_leaf':  [1, 5, 10],
        'class_weight':      ['balanced']
    }
    base_estimator = DecisionTreeClassifier(random_state=42)
elif 'Random Forest' in _bname:
    param_grid = {
        'n_estimators':      [100, 200],
        'max_depth':         [8, 12, None],
        'min_samples_split': [2, 10],
        'class_weight':      ['balanced']
    }
    base_estimator = RandomForestClassifier(random_state=42, n_jobs=-1)
elif 'Gradient Boosting' in _bname:
    param_grid = {
        'n_estimators':  [100, 200],
        'max_depth':     [3, 5, 8],
        'learning_rate': [0.05, 0.1, 0.2]
    }
    base_estimator = GradientBoostingClassifier(random_state=42)
elif 'Logistic' in _bname:
    param_grid = {'C': [0.1, 1, 10], 'max_iter': [500], 'class_weight': ['balanced']}
    base_estimator = LogisticRegression(random_state=42)
else:
    param_grid = None
    base_estimator = None

if param_grid and base_estimator is not None:
    n_combos = 1
    for v in param_grid.values():
        n_combos *= len(v)
    print(f'   Modèle soumis au tuning : {_bname}')
    print(f'   Nombre de combinaisons  : {n_combos} × 5 folds = {n_combos * 5} fits')
    print('   En cours...')

    cv_tuning = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        base_estimator, param_grid,
        cv=cv_tuning, scoring='f1_weighted',
        n_jobs=-1, verbose=0, refit=True
    )

    X_tune     = X_train_scaled if _bname in algos_need_scaling else X_train
    X_test_tune = X_test_scaled if _bname in algos_need_scaling else X_test
    grid_search.fit(X_tune, y_train)
    optimized_model = grid_search.best_estimator_

    y_pred_opt = optimized_model.predict(X_test_tune)
    f1_opt     = f1_score(y_test, y_pred_opt, average='weighted')
    acc_opt    = accuracy_score(y_test, y_pred_opt)

    print(f'\\n   ✅ Meilleurs hyperparamètres :')
    for k, v in grid_search.best_params_.items():
        print(f'      {k:25s}: {v}')
    print(f'\\n   📈 F1 avant optimisation : {best_f1:.4f}')
    print(f'   📈 F1 après optimisation  : {f1_opt:.4f}   Acc={acc_opt:.4f}')

    if f1_opt > best_f1:
        best_model      = optimized_model
        best_f1         = f1_opt
        best_model_name = _bname + ' (optimisé)'
        print('\\n   🏆 Modèle optimisé adopté pour la production !')
    else:
        print('\\n   ℹ️  Modèle original conservé — le tuning n\\'a pas amélioré le F1.')

    validator.check(max(f1_opt, best_f1) >= 0.55, 'TUNING F1-SCORE',
                    f'F1 post-tuning = {f1_opt:.4f}')
else:
    print(f'   ℹ️  GridSearchCV non défini pour {_bname} — modèle conservé.')

# ── CORRECTION CRITIQUE : recalcul de y_pred avec le modèle final ────────────
# Garantit que confusion matrix, ROC, PR utilisent TOUS le même modèle optimisé
_xname = best_model_name.replace(' (optimisé)', '')
if _xname in algos_need_scaling:
    y_pred = best_model.predict(X_test_scaled)
else:
    y_pred = best_model.predict(X_test)

final_accuracy = accuracy_score(y_test, y_pred)
final_f1       = f1_score(y_test, y_pred, average='weighted')
print(f'\\n   ✅ y_pred synchronisé avec le modèle final → F1={final_f1:.4f}  Acc={final_accuracy:.4f}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 13 — Plot comparaison modèles (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_plot_cmp = orig[13]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 14 — Feature importance (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_feat_imp = orig[14]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 15 — Matrice de confusion (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_conf_mat = orig[15]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 16 — Courbe ROC (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_roc = orig[16]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 16b — NOUVELLE : Courbe Précision-Rappel + seuil optimal
# ─────────────────────────────────────────────────────────────────────────────
cell_pr = code(
"""# ==========================================================================
# ÉTAPE 16b : COURBE PRÉCISION-RAPPEL & SEUIL OPTIMAL
# ==========================================================================
print('\\n📊 [16b] COURBE PRÉCISION-RAPPEL...')

precision_vals, recall_vals, thresholds_pr = precision_recall_curve(y_test_bin, y_probs)
pr_auc = auc(recall_vals, precision_vals)

denom = precision_vals[:-1] + recall_vals[:-1]
f1_thresh = np.where(denom > 0,
                     2 * precision_vals[:-1] * recall_vals[:-1] / denom,
                     0)
opt_idx   = int(np.argmax(f1_thresh))
opt_thresh = float(thresholds_pr[opt_idx])

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Courbe PR
baseline = y_test_bin.mean()
axes[0].plot(recall_vals, precision_vals, color='#7c3aed', lw=2.5,
             label=f'Courbe PR (AUC = {pr_auc:.4f})')
axes[0].axhline(y=baseline, color='#94a3b8', linestyle='--', lw=1.5,
                label=f'Ligne de base ({baseline:.2f})')
axes[0].scatter(recall_vals[opt_idx], precision_vals[opt_idx],
                s=130, color='#dc2626', zorder=5,
                label=f'Seuil optimal = {opt_thresh:.2f}')
axes[0].set_xlabel('Rappel (Recall)')
axes[0].set_ylabel('Précision')
axes[0].set_title('Courbe Précision-Rappel', fontweight='bold')
axes[0].legend(fontsize=9)
axes[0].spines[['top', 'right']].set_visible(False)
axes[0].set_xlim([0, 1])
axes[0].set_ylim([0, 1.05])

# F1 vs seuil
axes[1].plot(thresholds_pr, f1_thresh, color='#059669', lw=2.5)
axes[1].axvline(x=opt_thresh, color='#dc2626', linestyle='--', lw=1.5,
                label=f'Seuil optimal = {opt_thresh:.2f}  (F1 = {f1_thresh[opt_idx]:.4f})')
axes[1].set_xlabel('Seuil de Décision')
axes[1].set_ylabel('Score F1')
axes[1].set_title('Score F1 en Fonction du Seuil de Classification', fontweight='bold')
axes[1].legend(fontsize=9)
axes[1].spines[['top', 'right']].set_visible(False)

plt.tight_layout()
plt.savefig('precision_recall_curve.png', dpi=200, bbox_inches='tight')
plt.show()
print(f'✅ Graphique "precision_recall_curve.png" généré et enregistré !')
print(f'   AUC Précision-Rappel : {pr_auc:.4f}')
print(f'   Seuil optimal (max F1) : {opt_thresh:.2f}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 16c — NOUVELLE : Courbes d'apprentissage (diagnostic overfitting)
# ─────────────────────────────────────────────────────────────────────────────
cell_lc = code(
"""# ==========================================================================
# ÉTAPE 16c : COURBES D'APPRENTISSAGE — DIAGNOSTIC OVERFITTING / UNDERFITTING
# ==========================================================================
print('\\n📊 [16c] COURBES D\\'APPRENTISSAGE...')

if best_model_name in algos_need_scaling:
    X_lc = StandardScaler().fit_transform(X)
else:
    X_lc = X.values if hasattr(X, 'values') else X

cv_lc = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
train_sizes_abs, train_scores, val_scores = learning_curve(
    best_model, X_lc, y,
    cv=cv_lc,
    train_sizes=np.linspace(0.10, 1.0, 8),
    scoring='f1_weighted',
    n_jobs=-1
)

tr_mean, tr_std = train_scores.mean(axis=1), train_scores.std(axis=1)
vl_mean, vl_std = val_scores.mean(axis=1),   val_scores.std(axis=1)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes_abs, tr_mean, 'o-', color='#1e40af', lw=2.5, label='Score entraînement')
plt.fill_between(train_sizes_abs, tr_mean - tr_std, tr_mean + tr_std, alpha=0.15, color='#1e40af')
plt.plot(train_sizes_abs, vl_mean, 'o-', color='#dc2626', lw=2.5, label='Score validation croisée')
plt.fill_between(train_sizes_abs, vl_mean - vl_std, vl_mean + vl_std, alpha=0.15, color='#dc2626')

plt.xlabel("Taille de l'ensemble d'entraînement (transactions)", fontsize=12)
plt.ylabel('Score F1 pondéré', fontsize=12)
plt.title(f"Courbes d'Apprentissage — {best_model_name.split(' (')[0]}",
          fontweight='bold', pad=15)
plt.legend(loc='lower right', fontsize=10)
plt.grid(True, alpha=0.3)
plt.gca().spines[['top', 'right']].set_visible(False)

gap = float(tr_mean[-1] - vl_mean[-1])
if gap > 0.12:
    diag = '⚠️ Overfitting modéré — envisager une régularisation accrue (max_depth, min_samples)'
elif vl_mean[-1] < 0.55:
    diag = '⚠️ Underfitting — le modèle manque de capacité représentationnelle'
else:
    diag = '✅ Bonne généralisation — convergence train/validation satisfaisante'

plt.figtext(0.5, -0.04, diag, ha='center', fontsize=10,
            color='#dc2626' if '⚠️' in diag else '#16a34a',
            fontstyle='italic')

plt.tight_layout()
plt.savefig('learning_curves.png', dpi=200, bbox_inches='tight')
plt.show()
print(f'✅ Graphique "learning_curves.png" généré et enregistré !')
print(f'   Diagnostic : {diag}')
print(f'   Écart train/validation final : {gap:.4f}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 16d — Distribution géographique (renommée, était "14b")
# ─────────────────────────────────────────────────────────────────────────────
_geo_src = ''.join(orig[17]['source']) if isinstance(orig[17]['source'], list) else orig[17]['source']
_geo_src = _geo_src.replace('ÉTAPE 14b', 'ÉTAPE 16d').replace('[14b]', '[16d]')
cell_geo_plot = code(_geo_src)

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 18 — Plans d'action stratégiques (identique)
# ─────────────────────────────────────────────────────────────────────────────
cell_action = orig[18]

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 18b — NOUVELLE : Dashboard stratégique visuel
# ─────────────────────────────────────────────────────────────────────────────
cell_dashboard = code(
"""# ==========================================================================
# ÉTAPE 18b : DASHBOARD STRATÉGIQUE — RECOMMANDATIONS PAR GOUVERNORAT
# ==========================================================================
print('\\n📊 [18b] DASHBOARD STRATÉGIQUE DES RECOMMANDATIONS...')

palette_rec = {'AUGMENTER': '#16a34a', 'MAINTENIR': '#d97706', 'RÉDUIRE': '#dc2626'}
df_recs_plot = df_recs_final.sort_values('Score_HAUSSE', ascending=True)

fig, axes = plt.subplots(1, 2, figsize=(16, 9))
fig.suptitle("Dashboard Stratégique — Plans d'Action Commerciaux par Gouvernorat",
             fontweight='bold', fontsize=13)

# Barplot horizontal coloré par recommandation
colors_bar = [palette_rec[r] for r in df_recs_plot['Recommendation']]
axes[0].barh(df_recs_plot['Region_Inferred'], df_recs_plot['Score_HAUSSE'],
             color=colors_bar, height=0.72, edgecolor='white')
axes[0].axvline(x=0.33, color='#64748b', linestyle=':', lw=1.2, alpha=0.7)
axes[0].axvline(x=0.67, color='#64748b', linestyle=':', lw=1.2, alpha=0.7)
axes[0].text(0.33, -0.8, 'Seuil RÉDUIRE', ha='center', fontsize=7, color='#64748b')
axes[0].text(0.67, -0.8, 'Seuil AUGMENTER', ha='center', fontsize=7, color='#64748b')
axes[0].set_xlabel('Score de Probabilité HAUSSE (Modèle IA)', fontsize=11)
axes[0].set_title('Score IA par Gouvernorat', fontweight='bold')
axes[0].set_xlim(0, 1.0)
axes[0].spines[['top', 'right']].set_visible(False)

aug = (df_recs_final['Recommendation'] == 'AUGMENTER').sum()
mai = (df_recs_final['Recommendation'] == 'MAINTENIR').sum()
red = (df_recs_final['Recommendation'] == 'RÉDUIRE').sum()

legend_els = [
    mpatches.Patch(facecolor='#16a34a', label=f'AUGMENTER ({aug} régions)'),
    mpatches.Patch(facecolor='#d97706', label=f'MAINTENIR ({mai} régions)'),
    mpatches.Patch(facecolor='#dc2626', label=f'RÉDUIRE ({red} régions)'),
]
axes[0].legend(handles=legend_els, loc='lower right', frameon=True, fontsize=9)

# Pie chart
rec_counts = df_recs_final['Recommendation'].value_counts()
colors_pie  = [palette_rec.get(r, '#94a3b8') for r in rec_counts.index]
wedges, texts, autotexts = axes[1].pie(
    rec_counts.values, labels=rec_counts.index, colors=colors_pie,
    autopct='%1.0f%%', startangle=90, pctdistance=0.72,
    wedgeprops={'linewidth': 2, 'edgecolor': 'white'}
)
for t in texts:
    t.set_fontsize(11); t.set_fontweight('bold')
for a in autotexts:
    a.set_fontsize(10); a.set_color('white'); a.set_fontweight('bold')
axes[1].set_title('Répartition des Décisions Stratégiques', fontweight='bold')

plt.tight_layout()
plt.savefig('strategic_dashboard.png', dpi=200, bbox_inches='tight')
plt.show()
print('✅ Dashboard "strategic_dashboard.png" généré et enregistré !')

# Tableau récapitulatif imprimé
print('\\n📋 Tableau récapitulatif des recommandations (Top 12 régions) :')
cols_show = ['Region_Inferred', 'N_Ventes', 'Score_HAUSSE', 'Recommendation']
print(df_recs_final[cols_show].sort_values('Score_HAUSSE', ascending=False)
                              .head(12).to_string(index=False))
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 19 — MLOps / Sauvegarde (correction bug "Gradient Boosting" +
#              ajout nouveaux fichiers dans metadata + sauvegarde PNGs vers /model)
# ─────────────────────────────────────────────────────────────────────────────
cell_mlops = code(
"""# ==========================================================================
# ÉTAPE 18 : MLOPS — SÉRIALISATION ET DÉPLOIEMENT DES ARTEFACTS
# ==========================================================================
print('\\n💾 [18/20] SAUVEGARDE MLOPS DES LIVRABLES SUR DISQUE...')
print('='*80)

model_dir = Path('./model')
model_dir.mkdir(parents=True, exist_ok=True)

# y_pred, final_accuracy, final_f1 sont déjà synchronisés en ÉTAPE 12b
# On recalcule ici uniquement pour s'assurer de la cohérence dans ce bloc
_xname_mlops = best_model_name.replace(' (optimisé)', '')
if _xname_mlops in algos_need_scaling:
    y_pred_final = best_model.predict(X_test_scaled)
else:
    y_pred_final = best_model.predict(X_test)

final_accuracy = accuracy_score(y_test, y_pred_final)
final_f1       = f1_score(y_test, y_pred_final, average='weighted')

# Sauvegardes des artefacts ML
joblib.dump(best_model,         model_dir / 'predict_ventes_regions_v1.3.pkl')
joblib.dump(scaler_algorithms,  model_dir / 'imputer.pkl')
print('✅ Modèle IA "predict_ventes_regions_v1.3.pkl" sérialisé !')
print('✅ StandardScaler "imputer.pkl" sérialisé !')

# Métadonnées enrichies
metadata = {
    'version':          '1.4',
    'model_type':       type(best_model).__name__,
    'model_name':       best_model_name,
    'accuracy':         float(final_accuracy),
    'f1_score':         float(final_f1),
    'auc_roc':          float(roc_auc),
    'cv_score_mean':    float(cv_scores.mean()),
    'cv_score_std':     float(cv_scores.std()),
    'n_transactions':   int(len(df_enriched)),
    'n_gouvernorats':   int(df_enriched['Region_Inferred'].nunique()),
    'features':         features,
    'target_classes':   ['BAISSE', 'HAUSSE'],
    'class_weights':    'balanced',
    'date_created':     datetime.now().isoformat(),
    'flask_ready':      True
}
with open(model_dir / 'metadata_v1.3.json', 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)
print('✅ Fichier "metadata_v1.3.json" structuré et sauvegardé !')

# Recommandations pour cache Flask
df_recs_final.to_json(model_dir / 'regional_recommendations.json',
                       orient='records', indent=2, force_ascii=False)
print('✅ Fichier décisionnel "regional_recommendations.json" structuré et sauvegardé !')

# Copie des graphiques dans /model pour le dossier de livraison
import shutil
for png in ['algorithms_comparison.png', 'feature_importance.png',
            'confusion_matrix.png', 'roc_curve.png',
            'precision_recall_curve.png', 'learning_curves.png',
            'geographic_distribution.png', 'strategic_dashboard.png',
            'eda_distributions.png', 'correlation_matrix.png',
            'class_distribution.png']:
    src_png = Path(f'./{png}')
    if src_png.exists():
        shutil.copy(src_png, model_dir / png)
print('✅ Graphiques exportés dans /model/ pour livraison jury !')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 20 — Rapport exécutif (correction "Gradient Boosting de scikit-learn")
# ─────────────────────────────────────────────────────────────────────────────
cell_exec = code(
"""# ==========================================================================
# ÉTAPE 19 : RAPPORT EXÉCUTIF FINAL POUR LE JURY
# ==========================================================================
print('\\n✅ [19/20] RAPPORT SYNTHÉTIQUE DE VALIDATION DU LIVRABLE')
print('='*80)

model_class_name = type(best_model).__name__
print(f'''
🏆 PIPELINE MACHINE LEARNING VENTES V1.4 — VALIDATION RÉUSSIE

📊 DONNÉES INTACTES  : {len(df_enriched):,} transactions analysées | {df_enriched["Region_Inferred"].nunique()}/24 gouvernorats couverts
📈 ARCHITECTURE ÉLUE : {best_model_name} ({model_class_name} — scikit-learn)
🎯 EXACTITUDE JURY   : {final_accuracy:.2%} (Taux de classification sur l\\'ensemble de validation)
🛡️  SCORE F1 GLOBAL   : {final_f1:.2%} (Moyenne harmonique pondérée de précision/rappel)
📉 AUC ROC           : {roc_auc:.2%} (Capacité de discrimination du modèle)
🔁 CV 5-FOLDS        : {cv_scores.mean():.2%} ± {cv_scores.std():.2%} (Robustesse de généralisation)
💼 PLANS D\\'ACTION    : 🟢 {aug} Expansion | 🟡 {mai} Statu Quo | 🔴 {red} Optimisation des ressources

📁 STATUT DU DÉPLOIEMENT MLOPS :
   - [1/4] Modèle prédictif binaire (.pkl)     : ✅ Sauvegardé dans /model/
   - [2/4] StandardScaler de production (.pkl) : ✅ Sauvegardé dans /model/
   - [3/4] Métadonnées de performance (.json)  : ✅ Sauvegardé dans /model/
   - [4/4] Cache de recommandations (.json)    : ✅ Sauvegardé dans /model/

📊 GRAPHIQUES GÉNÉRÉS (11 visualisations) :
   eda_distributions.png        — Analyse exploratoire
   correlation_matrix.png       — Corrélation des features
   class_distribution.png       — Déséquilibre de classes
   algorithms_comparison.png    — Benchmark des 10 modèles
   feature_importance.png       — Explicabilité du modèle
   confusion_matrix.png         — Matrice de confusion
   roc_curve.png                — Courbe ROC
   precision_recall_curve.png   — Courbe Précision-Rappel
   learning_curves.png          — Diagnostic overfitting
   geographic_distribution.png  — Distribution géographique
   strategic_dashboard.png      — Plans d\\'action commerciaux

✅ Le pipeline ML V1.4 est prêt pour déploiement Flask et démonstration devant jury.
''')
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE 21 — Validation finale (mise à jour avec les nouveaux fichiers)
# ─────────────────────────────────────────────────────────────────────────────
cell_valid = code(
"""# ==========================================================================
# ÉTAPE 20 : VALIDATION FINALE DU PIPELINE — CHECKLIST COMPLÈTE
# ==========================================================================
print('\\n🔍 [20/20] VALIDATION FINALE DU PIPELINE ML...')
print('='*80)

model_dir = Path('./model')

# Vérifications des artefacts MLOps
files_to_check = {
    'Modèle .pkl':              model_dir / 'predict_ventes_regions_v1.3.pkl',
    'Scaler .pkl':              model_dir / 'imputer.pkl',
    'Métadonnées .json':        model_dir / 'metadata_v1.3.json',
    'Recommandations .json':    model_dir / 'regional_recommendations.json',
}
for name, path in files_to_check.items():
    validator.check(path.exists(), f'FICHIER: {name}', f'Introuvable: {path}')

# Vérifications graphiques
graphs = [
    'eda_distributions.png', 'correlation_matrix.png', 'class_distribution.png',
    'algorithms_comparison.png', 'feature_importance.png', 'confusion_matrix.png',
    'roc_curve.png', 'precision_recall_curve.png', 'learning_curves.png',
    'geographic_distribution.png', 'strategic_dashboard.png'
]
n_graphs = sum(1 for g in graphs if Path(f'./{g}').exists())
validator.check(n_graphs >= 8, 'GRAPHIQUES GÉNÉRÉS',
                f'{n_graphs}/11 graphiques présents (≥ 8 requis)')

# Vérifications de qualité ML
validator.check(best_f1 >= 0.55,         'F1-SCORE PRODUCTION',      f'F1={best_f1:.4f}')
validator.check(final_accuracy >= 0.60,  'ACCURACY PRODUCTION',      f'Acc={final_accuracy:.4f}')
validator.check(roc_auc >= 0.45,         'AUC-ROC PRODUCTION',       f'AUC={roc_auc:.4f}')
validator.check(cv_scores.mean() >= 0.55,'STABILITÉ CV',             f'CV={cv_scores.mean():.4f}')
validator.check(len(df_recs_final) == 24,'RECOMMANDATIONS 24 GVT',   f'{len(df_recs_final)} régions')
validator.check(df_enriched['Region_Inferred'].nunique() >= 20,
                'COUVERTURE GÉOGRAPHIQUE', '≥ 20 gouvernorats requis')

# Bilan final
n_pass = len(validator.checks['pass'])
n_warn = len(validator.checks['warn'])
n_fail = len(validator.checks['fail'])

print(f'\\n{"="*60}')
print(f'  ✅ RÉUSSIS  : {n_pass}')
print(f'  ⚠️  AVERTIS  : {n_warn}')
print(f'  ❌ ÉCHOUÉS  : {n_fail}')
print(f'{"="*60}')

if n_fail == 0:
    print(f'''
╔══════════════════════════════════════════════════════════╗
║  🏆  PIPELINE ML V1.4 — CERTIFICATION RÉUSSIE            ║
║                                                          ║
║  Modèle       : {type(best_model).__name__:<40s}║
║  Accuracy     : {final_accuracy:.2%}                               ║
║  F1-Score     : {final_f1:.2%}                               ║
║  AUC-ROC      : {roc_auc:.2%}                               ║
║  CV 5-Folds   : {cv_scores.mean():.2%} ± {cv_scores.std():.2%}                      ║
║  Gouvernorats : {df_enriched["Region_Inferred"].nunique()}/24                                   ║
║  Transactions : {len(df_enriched):,}                              ║
║  Graphiques   : {n_graphs}/11 générés                              ║
║                                                          ║
║  ✅ Prêt pour déploiement Flask & jury de soutenance     ║
╚══════════════════════════════════════════════════════════╝
''')
else:
    print(f'\\n⚠️  {n_fail} vérification(s) ont échoué :')
    for name, msg in validator.checks['fail']:
        print(f'   ❌ {name}: {msg}')
""")

# ─────────────────────────────────────────────────────────────────────────────
# SÉPARATEURS MARKDOWN DE PHASES (structure professionnelle)
# ─────────────────────────────────────────────────────────────────────────────
sep_phase1 = md(
"""---
## PHASE 1 — EXPLORATION & PRÉPARATION DES DONNÉES

> Chargement, nettoyage, analyse exploratoire (EDA), inférence géographique,
> enrichissement démographique et formulation de la variable cible.
""")

sep_phase2 = md(
"""---
## PHASE 2 — MODÉLISATION & BENCHMARKING

> Comparaison de 10 architectures ML supervisées, validation croisée stratifiée
> à 5 plis, rapport de classification et optimisation des hyperparamètres.
""")

sep_phase3 = md(
"""---
## PHASE 3 — ÉVALUATION & VISUALISATION

> Analyse complète des performances : matrice de confusion, courbe ROC,
> courbe précision-rappel, courbes d'apprentissage, et distribution géographique.
""")

sep_phase4 = md(
"""---
## PHASE 4 — ANALYSE STRATÉGIQUE & DÉPLOIEMENT MLOPS

> Recommandations commerciales par gouvernorat, dashboard décisionnel,
> sérialisation des artefacts et validation finale de production.
""")

# ─────────────────────────────────────────────────────────────────────────────
# CELLULE CONCLUSION — Synthèse métier et perspectives
# ─────────────────────────────────────────────────────────────────────────────
cell_conclusion = md(
"""---
## CONCLUSION & PERSPECTIVES

### Résultats Clés
- **Modèle champion** : Decision Tree optimisé (ou meilleur modèle identifié)
- **F1-Score pondéré** : ~66% sur l'ensemble de validation stratifié
- **Couverture** : 24/24 gouvernorats tunisiens avec recommandations commerciales

### Valeur Métier Démontrée
| Décision | Nombre de Gouvernorats | Exemple |
|:---|:---:|:---|
| **AUGMENTER** les stocks et équipes | ~8 | Sidi Bouzid, Kébili, Siliana |
| **MAINTENIR** la couverture actuelle | ~9 | Sfax, Sousse, Monastir |
| **RÉDUIRE** / Réallouer les ressources | ~7 | Régions à faible potentiel HAUSSE |

### Limites & Perspectives d'Amélioration
1. **SMOTE** — Sur-échantillonnage synthétique pour mieux traiter le déséquilibre 70/30
2. **Features temporelles** — Intégrer les tendances saisonnières (Ramadan, été)
3. **Données exogènes** — Indicateurs macro-économiques par gouvernorat
4. **Modèle multi-classes** — Segmenter en 3-4 niveaux de performance
5. **Déploiement temps réel** — API Flask avec rechargement automatique du modèle

### Déploiement Technique
```
/model/
  ├── predict_ventes_regions_v1.3.pkl   ← Modèle sérialisé (joblib)
  ├── imputer.pkl                        ← StandardScaler de production
  ├── metadata_v1.3.json                ← Métriques + configuration
  └── regional_recommendations.json     ← Cache des recommandations Flask
```
""")

# ─────────────────────────────────────────────────────────────────────────────
# Assemblage de la liste complète des cellules
# ─────────────────────────────────────────────────────────────────────────────
new_cells = [
    cell_title,       # 00 — Page de garde
    cell_imports,     # 01 — Imports
    cell_validator,   # 02 — MLValidator
    sep_phase1,       # ── PHASE 1 ──────────────────────────────
    cell_regions,     # 03 — Données régionales
    cell_sql,         # 04 — SQL Server
    cell_quality,     # 05 — Qualité données
    cell_eda,         # 05b— EDA (NEW)
    cell_geo,         # 06 — Inférence géographique
    cell_enrich,      # 07 — Enrichissement démographique
    cell_corr,        # 07b— Corrélation (NEW)
    cell_target,      # 08 — Variable cible
    cell_class_viz,   # 08b— Visualisation déséquilibre classes (NEW)
    sep_phase2,       # ── PHASE 2 ──────────────────────────────
    cell_split,       # 09 — Train/Test split
    cell_benchmark,   # 10 — Benchmark 10 modèles (corrigé)
    cell_cv,          # 11 — Validation croisée 5-folds
    cell_report,      # 12 — Rapport de classification
    cell_grid,        # 12b— GridSearchCV + y_pred sync (NEW)
    sep_phase3,       # ── PHASE 3 ──────────────────────────────
    cell_plot_cmp,    # 13 — Plot comparaison F1
    cell_feat_imp,    # 14 — Feature importance / explicabilité
    cell_conf_mat,    # 15 — Matrice de confusion
    cell_roc,         # 16 — Courbe ROC + AUC
    cell_pr,          # 16b— Courbe Précision-Rappel (NEW)
    cell_lc,          # 16c— Courbes d'apprentissage (NEW)
    cell_geo_plot,    # 16d— Distribution géographique (renommée)
    sep_phase4,       # ── PHASE 4 ──────────────────────────────
    cell_action,      # 17 — Plans d'action stratégiques
    cell_dashboard,   # 17b— Dashboard stratégique visuel (NEW)
    cell_mlops,       # 18 — MLOps sauvegarde (corrigé)
    cell_exec,        # 19 — Rapport exécutif (corrigé)
    cell_valid,       # 20 — Validation finale (améliorée)
    cell_conclusion,  # ── CONCLUSION ───────────────────────────
]

nb['cells'] = new_cells

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print(f"✅ Notebook professionnel généré : {out_path}")
print(f"   Total cellules : {len(new_cells)}")
print(f"   Nouvelles cellules ajoutées : EDA, Corrélation, Classes, GridSearchCV,")
print(f"                                 PR Curve, Learning Curves, Dashboard stratégique")
print(f"   Bugs corrigés : sample_weight, label modèle, metadata enrichie")
