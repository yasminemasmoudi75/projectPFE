# Rapport d'Analyse Logique et Structurelle

Ce rapport détaille les anomalies et les optimisations possibles pour les formulaires Clients, Devis, Bons de Commande et Factures, suite à l'analyse du code source backend.

## 1. Module CLIENT (Tiers)
**Fichiers :** `src/controllers/tiersController.js`, `src/models/Tiers.js`

### Attributs Non Nécessaires
*   **Champs Maps redondants :** `MapsVille`, `MapsPays`, `MapsDistrict`, `MapsRegion`, `MapsSubRegion`. Ces colonnes font doublon avec les champs standards `Ville`, `Pays` et `Gouvernorat`.
*   **Indicateurs inutilisés :** `Fictif` et `Pub`. Présents dans le modèle mais absents de toute logique métier.
*   **Double Clé Primaire :** `IDTiers` (UUID) et `CodTiers` sont tous deux marqués comme clés primaires.

### Anomalies Logiques
*   **Création de compte forcée :** L'ajout d'un tiers crée automatiquement un `User`. Cela bloque la création si l'email existe déjà et rend l'accès portail obligatoire au lieu d'optionnel.
*   **Gestion des contacts :** La méthode de mise à jour supprime et recrée tous les contacts, ce qui peut briser l'intégrité référentielle si d'autres tables pointent vers ces IDs.

---

## 2. Module DEVIS
**Fichiers :** `src/controllers/devisController.js`, `src/models/DevisMaster.js`

### Attributs Non Nécessaires
*   **`MntDebit` / `MntCredit` :** Champs comptables inutiles dans un devis commercial.
*   **`NetHT` :** Redondance directe avec `TotHT`.
*   **`Sufx` :** Stockage inutile d'un suffixe qui peut être calculé dynamiquement.

### Anomalies Logiques
*   **FAILLE DE SÉCURITÉ :** Le serveur ne recalcule pas les montants (HT, TVA, TTC). Il enregistre les totaux fournis par le frontend. Un utilisateur peut donc falsifier le prix total avant la validation.
*   **Gestion des dates :** Utilisation de 4 colonnes de dates (`DatUser`, `DatCreateUser`, `MDate`, `DatLiv`), créant une confusion sur la date de référence.

---

## 3. Module BON DE COMMANDE (BCV)
**Fichiers :** `src/controllers/bcvController.js`, `src/models/BcvMaster.js`

### Attributs Non Nécessaires
*   **`avanceforf` :** Champ non exploité dans le cycle de facturation actuel.
*   **`ID` dans les détails :** Doublon du champ `NF` ou stockage du type de document, alourdissant inutilement la table `TabBcvd`.

### Anomalies Logiques
*   **Livraison manuelle :** Le statut `bLivr` est un bit géré manuellement sans lien dynamique avec l'existence réelle d'un Bon de Livraison.
*   **Types de données :** Usage de `FLOAT` au lieu de `DECIMAL(18,3)` pour les montants, risquant des erreurs d'arrondi financier.

---

## 4. Module FACTURE (FAV)
**Fichiers :** `src/controllers/favController.js`, `src/models/FavMaster.js`

### Attributs Non Nécessaires
*   **`bTransf` et `bLivr` :** Présents par héritage (copier-coller) des modèles de commande. Une facture ne se transfère plus et la livraison est déjà effectuée.

### Anomalies Logiques
*   **Duplication de Code :** 95% de la logique est identique entre BCV et FAV. Cela rend la maintenance difficile et les erreurs d'oubli fréquentes lors des mises à jour.
*   **Traçabilité :** Absence d'une colonne `SourceGuid` pour lier de manière fiable la facture au document qui l'a générée.

---

## Synthèse des Recommandations
1.  **Centraliser les calculs** dans un service unique pour garantir l'intégrité des montants (TTC = HT + TVA).
2.  **Harmoniser les modèles** en supprimant les colonnes redondantes et les restes de copier-coller.
3.  **Découpler Tiers et Utilisateurs** pour permettre la création de clients sans accès portail automatique.
4.  **Recalculer systématiquement les totaux** côté serveur à partir des lignes de détails.
