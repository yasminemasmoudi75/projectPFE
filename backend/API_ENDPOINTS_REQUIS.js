/**
 * ================================================================
 * API ENDPOINTS REQUISES - FLUX COMPLET SAV
 * ================================================================
 */

const API_ENDPOINTS = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                         ENDPOINTS REQUIS - SAV WORKFLOW                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

████████████████████████████████████████████████████████████████████████████

PHASE 1: ADMIN - CRÉER RÉCLAMATION

Endpoint: POST /api/reclamations
Auth: Bearer {adminToken}
Body:
{
  "CodTiers": "CLIENT001",
  "LibTiers": "Entreprise Alpha SARL",
  "Objet": "Imprimante en panne",
  "Description": "Imprimante HP LaserJet M605 ne fonctionne plus",
  "TypeReclamation": "Technique",
  "Priorite": "Haute",
  "CUser": "admin@pfe.com"
}

Response: 
{
  "id": 1,
  "NumTicket": "TK-2024001",
  "Statut": "Ouvert",
  "TechnicienID": null,
  "DateOuverture": "2024-02-24T14:00:00.000Z"
}

CURL:
curl -X POST http://localhost:3066/api/reclamations \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "CodTiers": "CLIENT001",
    "LibTiers": "Entreprise Alpha",
    "Objet": "Imprimante en panne",
    "Description": "HP LaserJet M605 ne fonctionne plus",
    "TypeReclamation": "Technique",
    "Priorite": "Haute"
  }'

████████████████████████████████████████████████████████████████████████████

PHASE 2: ADMIN - ASSIGNER TECHNICIEN

Endpoint: PATCH /api/reclamations/:id/assign-technician
Auth: Bearer {adminToken}
Body:
{
  "TechnicienID": 5  // UserID du technicien
}

Response:
{
  "id": 1,
  "NumTicket": "TK-2024001",
  "TechnicienID": 5,
  "NomTechnicien": "Mohamed Hassen",
  "Statut": "En cours",  // ← AUTO-CHANGÉ
  "DateOuverture": "2024-02-24T14:00:00.000Z"
}

CURL:
curl -X PATCH http://localhost:3066/api/reclamations/1/assign-technician \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"TechnicienID": 5}'

████████████████████████████████████████████████████████████████████████████

PHASE 3: SYSTÈME - CRÉER DEMANDE D'INTERVENTION (DI)

Note: Cette étape serait idéalement automatisée via un trigger de base de données
ou via une API called automatiquement après l'assignation.

Endpoint: POST /api/di (À CRÉER)
Auth: Bearer {adminToken}
Body:
{
  "ReclamationID": 1,
  "DescPanne": "Imprimante HP LaserJet M605 ne fonctionne plus",
  "CodSymp": "PANNE_MAT",
  "IDEquip": null,
  "DatDI": "2024-02-24T14:05:00.000Z"
}

Response:
{
  "IDDI": "uuid-xxx",
  "NumDI": 1,
  "DatDI": "2024-02-24T14:05:00.000Z",
  "DescPanne": "Imprimante HP LaserJet M605 ne fonctionne plus",
  "CodSymp": "PANNE_MAT"
}

CURL:
curl -X POST http://localhost:3066/api/di \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ReclamationID": 1,
    "DescPanne": "Imprimante en panne",
    "CodSymp": "PANNE_MAT"
  }'

████████████████████████████████████████████████████████████████████████████

PHASE 4: SYSTÈME - CRÉER ASSIGNATION DIequipement (EquipDi)

Note: Automatiquement créée après DI, ou via:

Endpoint: POST /api/di/:id/assign-technician (À CRÉER)
Auth: Bearer {adminToken}
Body:
{
  "IDInterv": 5,  // TechnicienID
  "DatDI": "2024-02-24T14:30:00.000Z"  // Date prévue intervention
}

Response:
{
  "IDDI": "uuid-xxx",
  "NumDI": 1,
  "IDInterv": 5,
  "NomInterv": "Mohamed Hassen",
  "DatDI": "2024-02-24T14:30:00.000Z"
}

CURL:
curl -X POST http://localhost:3066/api/di/1/assign-technician \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "IDInterv": 5,
    "DatDI": "2024-02-24T14:30:00.000Z"
  }'

████████████████████████████████████████████████████████████████████████████

PHASE 5: SYSTÈME - CRÉER BON DE TRAVAIL (BT)

Endpoint: POST /api/bt (À CRÉER)
Auth: Bearer {adminToken}
Body:
{
  "DIID": "uuid-xxx",
  "NumDI": 1,
  "IDInterv": 5,
  "DescPanne": "Imprimante HP LaserJet M605 ne fonctionne plus",
  "DatBT": "2024-02-24T14:30:00.000Z"
}

Response:
{
  "IDBT": "uuid-yyy",
  "NumBT": 1,
  "IDDI": "uuid-xxx",
  "NumDI": 1,
  "IDInterv": 5,
  "DatBT": "2024-02-24T14:30:00.000Z",
  "BTEncours": 1,
  "BTClotured": 0
}

CURL:
curl -X POST http://localhost:3066/api/bt \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "DIID": "uuid-xxx",
    "NumDI": 1,
    "IDInterv": 5,
    "DatBT": "2024-02-24T14:30:00Z"
  }'

████████████████████████████████████████████████████████████████████████████

PHASE 6: TECHNICIEN - VOIR LEURS BTs ASSIGNÉS

Endpoint: GET /api/bt/technician/:technicienId
Auth: Bearer {technicianToken}

Response:
[
  {
    "IDBT": "uuid-yyy",
    "NumBT": 1,
    "DescPanne": "Imprimante HP LaserJet M605 ne fonctionne plus",
    "DatBT": "2024-02-24T14:30:00.000Z",
    "IDEquip": null,
    "DesEquip": "Imprimante HP",
    "CodSymp": "PANNE_MAT",
    "BTEncours": 1,
    "BTClotured": 0
  }
]

CURL:
curl -X GET http://localhost:3066/api/bt/technician/5 \\
  -H "Authorization: Bearer YOUR_TECH_TOKEN"

████████████████████████████████████████████████████████████████████████████

PHASE 7: TECHNICIEN - COMMENCER INTERVENTION (Mettre à jour DatDebutRep)

Endpoint: PATCH /api/bt/:id/start
Auth: Bearer {technicianToken}
Body:
{
  "DatDebutRep": "2024-02-24T14:30:00.000Z"
}

Response:
{
  "IDBT": "uuid-yyy",
  "NumBT": 1,
  "DatDebutRep": "2024-02-24T14:30:00.000Z",
  "BTEncours": 1
}

CURL:
curl -X PATCH http://localhost:3066/api/bt/uuid-yyy/start \\
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"DatDebutRep": "2024-02-24T14:30:00Z"}'

████████████████████████████████████████████████████████████████████████████

PHASE 8: TECHNICIEN - REMPLIR RÉSULTATS (Fin intervention)

Endpoint: PATCH /api/bt/:id/finish
Auth: Bearer {technicianToken}
Body:
{
  "DatFinRep": "2024-02-24T15:45:00.000Z",
  "CodRemed": "CART_REMPLAC",
  "DesRemed": "Remplacement cartouche d'encre XYZ-123",
  "Resultat": "Imprimante réparée. Cartouche défectueuse remplacée. Test impression OK.",
  "CodPanne": "PANNE_MAT"  // Panne confirmée
}

Response:
{
  "IDBT": "uuid-yyy",
  "NumBT": 1,
  "DatDebutRep": "2024-02-24T14:30:00.000Z",
  "DatFinRep": "2024-02-24T15:45:00.000Z",
  "CodRemed": "CART_REMPLAC",
  "DesRemed": "Remplacement cartouche d'encre XYZ-123",
  "Resultat": "Imprimante réparée...",
  "BTClotured": 0  // Pas encore clôturé, attente validation
}

CURL:
curl -X PATCH http://localhost:3066/api/bt/uuid-yyy/finish \\
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "DatFinRep": "2024-02-24T15:45:00Z",
    "CodRemed": "CART_REMPLAC",
    "DesRemed": "Remplacement cartouche",
    "Resultat": "Réparation complète"
  }'

████████████████████████████████████████████████████████████████████████████

PHASE 9: ADMIN - VALIDER & CLÔTURER BT

Endpoint: PATCH /api/bt/:id/close
Auth: Bearer {adminToken}
Body:
{
  "BTClotured": 1
}

Response:
{
  "IDBT": "uuid-yyy",
  "NumBT": 1,
  "BTClotured": 1,
  "message": "BT clôturé. Réclamation parentale mise à jour..."
}

CURL:
curl -X PATCH http://localhost:3066/api/bt/uuid-yyy/close \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"BTClotured": 1}'

████████████████████████████████████████████████████████████████████████████

PHASE 10: VÉRIFIER RÉCLAMATION CLÔTURÉE

Endpoint: GET /api/reclamations/:id
Auth: Bearer {anyToken}

Response:
{
  "id": 1,
  "NumTicket": "TK-2024001",
  "Statut": "Résolu",  // ← AUTO-CHANGÉ
  "TechnicienID": 5,
  "NomTechnicien": "Mohamed Hassen",
  "DateOuverture": "2024-02-24T14:00:00.000Z",
  "DateResolution": "2024-02-24T15:45:00.000Z",  // ← AUTO-REMPLI
  "Solution": "Remplacement cartouche d'encre XYZ-123",
  "relatedBT": {
    "NumBT": 1,
    "Resultat": "Imprimante réparée. Cartouche défectueuse remplacée..."
  }
}

CURL:
curl -X GET http://localhost:3066/api/reclamations/1 \\
  -H "Authorization: Bearer YOUR_TOKEN"

════════════════════════════════════════════════════════════════════════════════

RÉSUMÉ DES ENDPOINTS REQUIS:

✅ EXISTANTS:
  • POST /api/reclamations (Créer réclamation)
  • PATCH /api/reclamations/:id/assign-technician (Assigner technicien)
  • GET /api/reclamations/:id (Voir détails)
  • GET /api/reclamations/technician/:id (Voir réclamations du tech)

❌ À CRÉER:
  • POST /api/di (Créer DI)
  • POST /api/di/:id/assign-technician (Assigner technicien à DI)
  • POST /api/bt (Créer BT)
  • GET /api/bt/technician/:id (BT du technicien)
  • PATCH /api/bt/:id/start (Commencer intervention)
  • PATCH /api/bt/:id/finish (Fin intervention, remplir résultats)
  • PATCH /api/bt/:id/close (Clôturer BT)
  • GET /api/bt/:id (Voir détails BT)

TOTAL: 7 ENDPOINTS EXISTANTS + 8 NOUVEAUX = 15 endpoints pour le flux complet

════════════════════════════════════════════════════════════════════════════════
`;

console.log(API_ENDPOINTS);

module.exports = { API_ENDPOINTS };
