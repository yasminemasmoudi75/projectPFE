#!/bin/bash

# 🧪 SCRIPT TEST CURL - API PROJETS
# Utilisation: bash test-curl.sh
# ⚠️  Remplacez les valeurs en gras par vos valeurs réelles

BASE_URL="http://localhost:3000/api"
TOKEN="YOUR_JWT_TOKEN_HERE"  # ⚠️ REMPLACEZ PAR VOTRE TOKEN
TIERS_ID="550e8400-e29b-41d4-a716-446655440000"  # ⚠️ REMPLACEZ PAR UN ID RÉEL

# Déclaration des couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}🧪 TESTS CURL - API PROJETS${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}\n"

# ============================================
# Vérification du token
# ============================================
if [ "$TOKEN" == "YOUR_JWT_TOKEN_HERE" ]; then
  echo -e "${RED}⚠️  ERREUR: Token non configuré!${NC}"
  echo "Remplacez 'YOUR_JWT_TOKEN_HERE' par votre token JWT authentique"
  echo -e "\nÉtapes:"
  echo "  1. POST /api/auth/login avec vos identifiants"
  echo "  2. Copiez le token reçu"
  echo "  3. Remplacez TOKEN dans ce script"
  exit 1
fi

# ============================================
# TEST 0: Vérifier la santé du serveur
# ============================================
echo -e "${GREEN}0️⃣  Test de connexion au serveur${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/../health" | jq '.'
echo ""

# ============================================
# TEST 1: CRÉER UN PROJET
# ============================================
echo -e "${GREEN}1️⃣  Créer un nouveau projet (POST)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJET_RESPONSE=$(curl -s -X POST "$BASE_URL/projets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Code_Pro": "PROJ-'$(date +%s)'",
    "Nom_Projet": "Projet Test - '$(date)' ",
    "IDTiers": "'$TIERS_ID'",
    "CA_Estime": 100000,
    "Budget_Alloue": 80000,
    "Avancement": 15,
    "Phase": "Planning",
    "Priorite": "Haute",
    "Date_Echeance": "2026-08-31",
    "Note_Privee": "Test via cURL"
  }')

echo "$PROJET_RESPONSE" | jq '.'

# Extraire l'ID du projet créé
PROJET_ID=$(echo "$PROJET_RESPONSE" | jq -r '.data.ID_Projet // empty')

if [ -z "$PROJET_ID" ] || [ "$PROJET_ID" == "null" ]; then
  echo -e "${RED}❌ Erreur: Impossible de créer le projet${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Projet créé avec ID: $PROJET_ID${NC}\n"

# ============================================
# TEST 2: RÉCUPÉRER TOUS LES PROJETS
# ============================================
echo -e "${GREEN}2️⃣  Récupérer tous les projets (GET)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# ============================================
# TEST 3: RÉCUPÉRER UN PROJET PAR ID
# ============================================
echo -e "${GREEN}3️⃣  Récupérer le projet créé (GET by ID)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets/$PROJET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# ============================================
# TEST 4: FILTRER LES PROJETS
# ============================================
echo -e "${GREEN}4️⃣  Filtrer par phase et priorité (GET filtered)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets?phase=Planning&priority=Haute" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# ============================================
# TEST 5: METTRE À JOUR UN PROJET
# ============================================
echo -e "${GREEN}5️⃣  Mettre à jour le projet (PUT)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PUT "$BASE_URL/projets/$PROJET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Avancement": 50,
    "Phase": "Développement",
    "Priorite": "Très haute",
    "Alerte_IA_Risque": true,
    "Note_Privee": "Mise à jour réussie via cURL"
  }' | jq '.'
echo ""

# ============================================
# TEST 6: VÉRIFIER LA MISE À JOUR
# ============================================
echo -e "${GREEN}6️⃣  Vérifier la mise à jour${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets/$PROJET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {Nom_Projet, Avancement, Phase, Priorite}'
echo ""

# ============================================
# TEST 7: SUPPRIMER UN PROJET
# ============================================
echo -e "${YELLOW}7️⃣  Supprimer le projet (DELETE)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Cette action nécessite les droits Admin"
echo "En commentaire (décommenter si Admin):"
echo ""
echo "# curl -s -X DELETE \"$BASE_URL/projets/$PROJET_ID\" \\"
echo "#   -H \"Authorization: Bearer $TOKEN\" | jq '.'"
echo ""

# ============================================
# ERREURS COMMUNES
# ============================================
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TESTS D'ERREURS COMMUNES${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}\n"

# TEST: Créer sans nom
echo -e "${GREEN}❌ Test: Créer sans Nom_Projet${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$BASE_URL/projets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Code_Pro": "TEST",
    "IDTiers": "'$TIERS_ID'"
  }' | jq '.'
echo ""

# TEST: Avancement invalide
echo -e "${GREEN}❌ Test: Avancement > 100${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$BASE_URL/projets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Nom_Projet": "Test Avancement",
    "Avancement": 150
  }' | jq '.'
echo ""

# TEST: Token invalide
echo -e "${GREEN}❌ Test: Token invalide${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets" \
  -H "Authorization: Bearer INVALID_TOKEN" | jq '.'
echo ""

# TEST: ID inexistant
echo -e "${GREEN}❌ Test: ID projet inexistant${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$BASE_URL/projets/99999" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Tests terminés!${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}\n"

# ============================================
# ASTUCES
# ============================================
cat << 'EOF'

💡 ASTUCES CURL:

1. Sauvegarder le token dans une variable:
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password123"}' \
     | jq -r '.token')

2. Formatter la réponse JSON nicely:
   curl ... | jq '.'

3. Vérifier les headers de réponse:
   curl -i ... (ajoute les headers)

4. Voir les headers de requête:
   curl -v ... (verbose mode)

5. Passer des paramètres URL:
   curl "http://...?param1=value1&param2=value2"

EOF
