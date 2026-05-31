"""
TRAIN REGRESSION MODEL - VARIATION % DES VENTES PAR RÉGION
===========================================================
Entraîne un modèle de régression sur les vraies données SQL
pour prédire la variation % des ventes par région/trimestre.
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import pyodbc
from pathlib import Path
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

# ── Mapping ville → gouvernorat normalisé ─────────────────────────────────────
VILLE_TO_GOUV = {
    "TUNIS": "TUNIS",
    "TUNIS , SIDI THABET": "TUNIS",
    "SFAX": "SFAX",
    "BIZERTE": "BIZERTE",
    "MONASTIR": "MONASTIR",
    "SOUSSE": "SOUSSE",
    "NABEUL": "NABEUL",
    "ARIANA": "ARIANA",
    "BORJ CEDRIA": "BEN_AROUS",
    "BEN AROUS": "BEN_AROUS",
    "GABES": "GABES",
    "GAFSA": "GAFSA",
    "ZAGHOUAN": "ZAGHOUAN",
    "BÉJA": "BEJA",
    "BEJA": "BEJA",
    "MANNOUBA": "MANOUBA",
    "MANOUUBA": "MANOUBA",
    "MÉDENINE": "MEDENINE",
    "MEDENINE": "MEDENINE",
    "JENDOUBA": "JENDOUBA",
    "KAIROUAN": "KAIROUAN",
    "TATAOUINE": "TATAOUINE",
    "KEF": "LE_KEF",
}

# Noms à exclure (prénoms, numéros de téléphone, pays étrangers)
EXCLUSIONS = {"ACHRAF", "INES", "OUMAIMA", "BOUTHAINA MAAZOUN", "LYBIA",
              "+216 71 182 250", "71 400852"}

# Données démographiques des gouvernorats
REGIONAL_DATA = {
    "ARIANA":     (1200000, 118.0, 8,  34),
    "BEJA":       (310000,   92.0, 4,  16),
    "BEN_AROUS":  (910000,  126.0, 9,  28),
    "BIZERTE":    (705000,  108.0, 7,  22),
    "GABES":      (390000,   95.0, 5,  18),
    "GAFSA":      (345000,   97.0, 4,  15),
    "JENDOUBA":   (410000,   90.0, 5,  17),
    "KAIROUAN":   (590000,   86.0, 6,  20),
    "KASSERINE":  (470000,   84.0, 4,  14),
    "KEBILI":     (170000,   88.0, 3,  10),
    "LE_KEF":     (260000,   91.0, 4,  13),
    "MAHDIA":     (420000,  104.0, 6,  19),
    "MANOUBA":    (420000,  122.0, 8,  26),
    "MEDENINE":   (500000,   98.0, 6,  21),
    "MONASTIR":   (560000,  121.0, 8,  25),
    "NABEUL":     (880000,  129.0, 10, 31),
    "SFAX":       (960000,  127.0, 11, 36),
    "SIDI_BOUZID":(430000,   85.0, 4,  12),
    "SILIANA":    (230000,   89.0, 3,  11),
    "SOUSSE":     (720000,  124.0, 9,  29),
    "TATAOUINE":  (150000,   83.0, 2,   8),
    "TOZEUR":     (140000,   87.0, 2,   7),
    "TUNIS":     (1100000,  135.0, 12, 40),
    "ZAGHOUAN":   (175000,   94.0, 3,   9),
}


def connect_db():
    conn_str = (
        "DRIVER={SQL Server};SERVER=127.0.0.1,1433;"
        "DATABASE=AA;UID=sa;PWD=123456789;"
        "TrustServerCertificate=yes;Encrypt=no;"
    )
    return pyodbc.connect(conn_str, timeout=10)


def extract_ca_data(conn) -> pd.DataFrame:
    """Extrait le CA réel par trimestre et ville depuis la base SQL."""
    query = """
        SELECT
            YEAR(b.MDate)                             AS Annee,
            DATEPART(QUARTER, b.MDate)                AS Trimestre,
            UPPER(LTRIM(RTRIM(ISNULL(t.Ville, ''))))  AS Ville,
            COUNT(*)                                  AS NbBL,
            SUM(b.TotHT)                              AS CA_HT
        FROM TabBlvm b
        LEFT JOIN TabTiers t ON b.CodTiers = t.CodTiers
        WHERE b.Valid = 1
          AND t.Ville IS NOT NULL
          AND LEN(LTRIM(RTRIM(ISNULL(t.Ville,'')))) > 3
        GROUP BY
            YEAR(b.MDate),
            DATEPART(QUARTER, b.MDate),
            UPPER(LTRIM(RTRIM(ISNULL(t.Ville,''))))
        ORDER BY Annee, Trimestre
    """
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df = pd.read_sql(query, conn)
    return df


def clean_and_map(df: pd.DataFrame) -> pd.DataFrame:
    """Filtre les villes invalides et mappe vers les gouvernorats."""
    df = df[~df["Ville"].isin(EXCLUSIONS)].copy()
    df["Gouvernorat"] = df["Ville"].map(VILLE_TO_GOUV)
    df = df.dropna(subset=["Gouvernorat"])

    # Agréger si plusieurs villes → même gouvernorat dans le même trimestre
    df = (
        df.groupby(["Annee", "Trimestre", "Gouvernorat"], as_index=False)
        .agg(NbBL=("NbBL", "sum"), CA_HT=("CA_HT", "sum"))
    )
    return df


def compute_variations(df: pd.DataFrame) -> pd.DataFrame:
    """Calcule la variation % du CA entre trimestre N et N-1 par gouvernorat."""
    df = df.sort_values(["Gouvernorat", "Annee", "Trimestre"]).copy()

    rows = []
    for gouv, grp in df.groupby("Gouvernorat"):
        grp = grp.reset_index(drop=True)
        for i in range(1, len(grp)):
            ca_prev = grp.loc[i - 1, "CA_HT"]
            ca_curr = grp.loc[i,     "CA_HT"]
            if ca_prev > 0:
                variation = round((ca_curr - ca_prev) / ca_prev * 100, 2)
                rows.append({
                    "Gouvernorat":   gouv,
                    "Annee":         int(grp.loc[i, "Annee"]),
                    "Trimestre":     int(grp.loc[i, "Trimestre"]),
                    "CA_HT":         float(ca_curr),
                    "CA_HT_prev":    float(ca_prev),
                    "NbBL":          int(grp.loc[i, "NbBL"]),
                    "variation_pct": variation,
                })
    return pd.DataFrame(rows)


def build_features(df_var: pd.DataFrame) -> pd.DataFrame:
    """Ajoute les features démographiques et temporelles."""
    records = []
    for _, row in df_var.iterrows():
        gouv = row["Gouvernorat"]
        demo = REGIONAL_DATA.get(gouv)
        if demo is None:
            continue
        pop, indice, hopitaux, labos = demo
        records.append({
            "Gouvernorat":   gouv,
            "Annee":         row["Annee"],
            "Trimestre":     row["Trimestre"],
            "Population":    pop,
            "Indice_Achat":  indice,
            "Nb_Hopitaux":   hopitaux,
            "Nb_Laboratoires": labos,
            "CA_HT_prev":    row["CA_HT_prev"],
            "NbBL":          row["NbBL"],
            "variation_pct": row["variation_pct"],
        })
    return pd.DataFrame(records)


def train(df: pd.DataFrame):
    """Entraîne et évalue le modèle de régression."""
    FEATURES = [
        "Population", "Indice_Achat", "Nb_Hopitaux", "Nb_Laboratoires",
        "Trimestre", "Annee", "CA_HT_prev", "NbBL",
    ]
    TARGET = "variation_pct"

    X = df[FEATURES].values
    y = df[TARGET].values

    # Supprimer les outliers extrêmes (>±200%) pour éviter le biais
    mask = np.abs(y) <= 200
    X, y = X[mask], y[mask]
    df_clean = df[mask].copy()

    print(f"[DATA] {len(X)} exemples après filtrage outliers (±200%)")
    print(f"[DATA] Variation min={y.min():.1f}%  max={y.max():.1f}%  moy={y.mean():.1f}%")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    r2   = r2_score(y_test, y_pred)
    cv   = cross_val_score(model, X, y, cv=3, scoring="r2")

    print(f"[METRICS] MAE={mae:.2f}%  R²={r2:.3f}  CV-R²={cv.mean():.3f}±{cv.std():.3f}")

    return model, FEATURES, mae, r2, cv.mean(), df_clean


def determine_label(variation: float) -> str:
    """Convertit la variation % en label de décision."""
    if variation >= 5:
        return "AUGMENTER"
    elif variation <= -5:
        return "REDUIRE"
    else:
        return "MAINTENIR"


def save_model(model, features, mae, r2, cv_mean, df_clean):
    """Sauvegarde le modèle, les métadonnées et les stats régionales."""
    MODEL_DIR.mkdir(exist_ok=True)

    # Modèle
    model_path = MODEL_DIR / "regression_ventes_v1.0.pkl"
    joblib.dump(model, model_path)
    print(f"[SAVED] Modèle → {model_path}")

    # Métadonnées
    meta = {
        "version": "1.0",
        "model_type": "GradientBoostingRegressor",
        "task": "regression",
        "target": "variation_pct",
        "mae_pct": round(mae, 2),
        "r2_score": round(r2, 3),
        "cv_r2_mean": round(cv_mean, 3),
        "features": features,
        "n_samples": len(df_clean),
        "gouvernorats": sorted(df_clean["Gouvernorat"].unique().tolist()),
        "date_created": datetime.now().isoformat(),
    }
    meta_path = MODEL_DIR / "metadata_regression_v1.0.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] Métadonnées → {meta_path}")

    # Stats historiques par gouvernorat (dernier CA connu → référence pour prédiction)
    last_ca = (
        df_clean.sort_values(["Annee", "Trimestre"])
        .groupby("Gouvernorat")
        .last()[["CA_HT_prev", "NbBL"]]
        .reset_index()
        .rename(columns={"CA_HT_prev": "CA_HT_last", "NbBL": "NbBL_last"})
    )
    stats_path = MODEL_DIR / "regional_stats_v1.0.json"
    last_ca.to_json(stats_path, orient="records", force_ascii=False, indent=2)
    print(f"[SAVED] Stats régionales → {stats_path}")

    return model_path


def main():
    print("\n" + "=" * 60)
    print("  ENTRAÎNEMENT MODÈLE RÉGRESSION — VARIATION % VENTES")
    print("=" * 60 + "\n")

    print("[1/5] Connexion à la base SQL Server AA...")
    conn = connect_db()
    print("      ✅ Connecté")

    print("[2/5] Extraction des données CA réelles...")
    df_raw = extract_ca_data(conn)
    conn.close()
    print(f"      ✅ {len(df_raw)} lignes extraites")

    print("[3/5] Nettoyage et mapping gouvernorats...")
    df_mapped = clean_and_map(df_raw)
    print(f"      ✅ {len(df_mapped)} lignes après nettoyage")
    print(f"      Gouvernorats: {sorted(df_mapped['Gouvernorat'].unique())}")

    print("[4/5] Calcul des variations % trimestrielles...")
    df_var = compute_variations(df_mapped)
    df_feat = build_features(df_var)
    print(f"      ✅ {len(df_feat)} points d'entraînement")

    print("[5/5] Entraînement du modèle GradientBoosting...")
    model, features, mae, r2, cv_mean, df_clean = train(df_feat)

    save_model(model, features, mae, r2, cv_mean, df_clean)

    print("\n" + "=" * 60)
    print("  ✅ MODÈLE PRÊT — Redémarrez Flask pour l'utiliser")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
