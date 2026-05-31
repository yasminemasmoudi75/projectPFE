"""
BUILD HISTORICAL STATS - VARIATIONS RÉELLES PAR RÉGION/TRIMESTRE
================================================================
Calcule les variations % historiques réelles depuis la base SQL
et les sauvegarde en JSON pour enrichir les prédictions ML.
"""

import sys
import json
import pyodbc
import numpy as np
import pandas as pd
import warnings
from pathlib import Path
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

VILLE_TO_GOUV = {
    "TUNIS": "TUNIS", "TUNIS , SIDI THABET": "TUNIS",
    "SFAX": "SFAX", "BIZERTE": "BIZERTE", "MONASTIR": "MONASTIR",
    "SOUSSE": "SOUSSE", "NABEUL": "NABEUL", "ARIANA": "ARIANA",
    "BORJ CEDRIA": "BEN_AROUS", "BEN AROUS": "BEN_AROUS",
    "GABES": "GABES", "GAFSA": "GAFSA", "ZAGHOUAN": "ZAGHOUAN",
    "BÉJA": "BEJA", "BEJA": "BEJA",
    "MANNOUBA": "MANOUBA", "MANOUUBA": "MANOUBA",
    "MÉDENINE": "MEDENINE", "MEDENINE": "MEDENINE",
    "JENDOUBA": "JENDOUBA", "KAIROUAN": "KAIROUAN",
    "TATAOUINE": "TATAOUINE", "KEF": "LE_KEF",
}

EXCLUSIONS = {"ACHRAF", "INES", "OUMAIMA", "BOUTHAINA MAAZOUN",
              "LYBIA", "+216 71 182 250", "71 400852"}


def connect_db():
    return pyodbc.connect(
        "DRIVER={SQL Server};SERVER=127.0.0.1,1433;"
        "DATABASE=AA;UID=sa;PWD=123456789;"
        "TrustServerCertificate=yes;Encrypt=no;",
        timeout=10,
    )


def main():
    print("[1/4] Connexion SQL Server...")
    conn = connect_db()

    query = """
        SELECT YEAR(b.MDate) AS Annee, DATEPART(QUARTER, b.MDate) AS Trimestre,
               UPPER(LTRIM(RTRIM(ISNULL(t.Ville,'')))) AS Ville,
               SUM(b.TotHT) AS CA_HT
        FROM TabBlvm b
        LEFT JOIN TabTiers t ON b.CodTiers = t.CodTiers
        WHERE b.Valid = 1
          AND t.Ville IS NOT NULL
          AND LEN(LTRIM(RTRIM(ISNULL(t.Ville,'')))) > 3
        GROUP BY YEAR(b.MDate), DATEPART(QUARTER, b.MDate),
                 UPPER(LTRIM(RTRIM(ISNULL(t.Ville,''))))
        ORDER BY Annee, Trimestre
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df = pd.read_sql(query, conn)
    conn.close()
    print(f"[2/4] {len(df)} lignes extraites")

    # Nettoyage
    df = df[~df["Ville"].isin(EXCLUSIONS)].copy()
    df["Gouvernorat"] = df["Ville"].map(VILLE_TO_GOUV)
    df = df.dropna(subset=["Gouvernorat"])
    df = (
        df.groupby(["Annee", "Trimestre", "Gouvernorat"], as_index=False)
        .agg(CA_HT=("CA_HT", "sum"))
    )

    print("[3/4] Calcul des variations historiques...")

    # Variation % entre trimestres consécutifs par région
    df = df.sort_values(["Gouvernorat", "Annee", "Trimestre"]).reset_index(drop=True)
    variations = []
    for gouv, grp in df.groupby("Gouvernorat"):
        grp = grp.reset_index(drop=True)
        for i in range(1, len(grp)):
            ca_prev = grp.loc[i - 1, "CA_HT"]
            ca_curr = grp.loc[i,     "CA_HT"]
            if ca_prev > 0:
                var = (ca_curr - ca_prev) / ca_prev * 100
                if abs(var) <= 300:  # exclure les sauts impossibles (0 → commande géante)
                    variations.append({
                        "Gouvernorat": gouv,
                        "Trimestre":   int(grp.loc[i, "Trimestre"]),
                        "Annee":       int(grp.loc[i, "Annee"]),
                        "variation":   round(var, 1),
                    })

    df_var = pd.DataFrame(variations)

    # Stats par région × trimestre (médiane = plus robuste que moyenne pour données B2B)
    stats = {}
    for (gouv, trim), grp in df_var.groupby(["Gouvernorat", "Trimestre"]):
        vals = grp["variation"].values
        stats.setdefault(gouv, {})[str(trim)] = {
            "median_variation": round(float(np.median(vals)), 1),
            "mean_variation":   round(float(np.mean(vals)), 1),
            "std_variation":    round(float(np.std(vals)), 1),
            "nb_periodes":      int(len(vals)),
            "min":              round(float(np.min(vals)), 1),
            "max":              round(float(np.max(vals)), 1),
        }

    # Stats globales par région (tous trimestres confondus)
    global_stats = {}
    for gouv, grp in df_var.groupby("Gouvernorat"):
        vals = grp["variation"].values
        global_stats[gouv] = {
            "median_variation": round(float(np.median(vals)), 1),
            "mean_variation":   round(float(np.mean(vals)), 1),
            "nb_periodes":      int(len(vals)),
        }

    output = {
        "generated_at": datetime.now().isoformat(),
        "description": "Variations % CA réelles depuis BDD AA (médiane par région/trimestre)",
        "by_region_trimestre": stats,
        "by_region_global": global_stats,
    }

    out_path = MODEL_DIR / "historical_variations.json"
    MODEL_DIR.mkdir(exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"[4/4] ✅ Sauvegardé → {out_path}")
    print(f"      {len(stats)} régions | {len(df_var)} variations calculées\n")

    # Aperçu
    print("Aperçu des variations médianes par région (tous trimestres):")
    for gouv, s in sorted(global_stats.items()):
        sign = "+" if s["median_variation"] >= 0 else ""
        print(f"  {gouv:<15} {sign}{s['median_variation']}%  ({s['nb_periodes']} périodes)")


if __name__ == "__main__":
    main()
