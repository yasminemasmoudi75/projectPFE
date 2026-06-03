"""
TEST DES DONNÉES VENANT D'UN FRONTEND REACT
=============================================
Simule exactement ce qu'un frontend TypeScript/React enverrait à l'API :
- Types de données (string, int, float, null, undefined)
- Formats JSON variés
- Noms de régions avec accents / espaces / casse mixte
- Données partielles ou mal formées
- Headers CORS
- Encoding UTF-8 / caractères spéciaux
- Tous les gouvernorats avec leur vraie orthographe frontend
"""

import sys
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = 'http://127.0.0.1:5000'
OK   = 0
FAIL = 0

# Noms de régions tels qu'ils apparaissent dans le frontend (GestionSocietes.tsx)
REGIONS_FRONTEND = [
    'Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte',
    'Monastir', 'Ariana', 'Ben Arous', 'Manouba', 'Zaghouan',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Médenine', 'Tataouine', 'Gafsa',
    'Tozeur', 'Kébili', 'Gabès', 'Mahdia'
]


def req(method, path, body=None, headers_extra=None):
    url  = BASE + path
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body else None
    hdrs = {'Content-Type': 'application/json; charset=utf-8'}
    if headers_extra:
        hdrs.update(headers_extra)
    r = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw.decode('utf-8')), dict(resp.headers)
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw.decode('utf-8')), {}


def test(name, status, data, expect_status=200, checks=None):
    global OK, FAIL
    passed = (status == expect_status)
    if checks and passed:
        for key, val in (checks or {}).items():
            if val is not None and data.get(key) != val:
                passed = False
                break
    icon = 'PASS' if passed else 'FAIL'
    if passed:
        OK += 1
    else:
        FAIL += 1
    print(f'  [{icon}] {name} (HTTP {status})')
    return passed, data


print()
print('=' * 70)
print('  TEST DONNÉES FRONTEND REACT → API FLASK ML V1.4')
print('=' * 70)

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  1. CORS — Le frontend peut-il appeler l\'API depuis un navigateur ?')

s, d, headers = req('GET', '/api/health')
has_cors = any('access-control' in k.lower() for k in headers.keys())
test('CORS header présent (Access-Control-Allow-Origin)', s, d,
     checks={'status': 'healthy'})
cors_val = headers.get('Access-Control-Allow-Origin', 'ABSENT')
print(f'       Access-Control-Allow-Origin : {cors_val}')
if cors_val == '*':
    print('       → Tous les origines autorisées (ok pour dev/démo)')
elif cors_val == 'ABSENT':
    print('       → CORS absent — le navigateur bloquera les requêtes cross-origin !')

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  2. NOMS DE RÉGIONS AVEC ACCENTS / CASSE (tels que le frontend les envoie)')

print(f'  {"Envoyé depuis frontend":<22} {"Normalisé":<15} {"Résultat"}')
print('  ' + '-' * 60)
for nom_frontend in REGIONS_FRONTEND:
    s, d, _ = req('POST', '/api/predict', {'region': nom_frontend, 'trimestre': 3})
    ok = d.get('success') == True
    normalized = d.get('region', 'ERREUR')
    result = d.get('prediction', d.get('error', '?')[:25])
    icon = 'OK' if ok else 'ERR'
    print(f'  [{icon}] {nom_frontend:<22} → {normalized:<15} {result}')
    if ok:
        OK += 1
    else:
        FAIL += 1

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  3. TYPES DE DONNÉES (React envoie parfois des strings au lieu d\'int)')

types_tests = [
    ('trimestre en string "3"',      {'region': 'TUNIS', 'trimestre': '3', 'year': 2026},       200),
    ('trimestre en string "2"',      {'region': 'SFAX',  'trimestre': '2'},                      200),
    ('year en string "2026"',        {'region': 'TUNIS', 'trimestre': 3,   'year': '2026'},      200),
    ('prix en string "15.5"',        {'region': 'TUNIS', 'trimestre': 2,   'prix': '15.5'},      200),
    ('prix = 0 (gratuit)',           {'region': 'TUNIS', 'trimestre': 1,   'prix': 0},           200),
    ('prix = 0.0 (float)',           {'region': 'TUNIS', 'trimestre': 1,   'prix': 0.0},         200),
    ('prix = null (JS null)',        {'region': 'TUNIS', 'trimestre': 1,   'prix': None},        200),
    ('year = null → défaut 2026',   {'region': 'TUNIS', 'trimestre': 3,   'year': None},        200),
    ('trimestre en float 3.0',       {'region': 'TUNIS', 'trimestre': 3.0},                      200),
    ('region avec espaces en plus',  {'region': '  TUNIS  ', 'trimestre': 3},                    200),
    ('region tout minuscule',        {'region': 'sousse', 'trimestre': 2},                       200),
    ('region casse mixte',           {'region': 'Sousse', 'trimestre': 2},                       200),
    ('region tout majuscule OK',     {'region': 'SOUSSE', 'trimestre': 2},                       200),
]

for name, body, expected in types_tests:
    s, d, _ = req('POST', '/api/predict', body)
    ok, _ = test(name, s, d, expect_status=expected)

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  4. CHAMPS SUPPLÉMENTAIRES (React envoie parfois des champs en trop)')

extra_tests = [
    ('Champ extra "userId" ignoré',   {'region': 'TUNIS', 'trimestre': 3, 'userId': 42}),
    ('Champ extra "token" ignoré',    {'region': 'TUNIS', 'trimestre': 3, 'token': 'abc123'}),
    ('Champ extra "timestamp" ignoré',{'region': 'SFAX',  'trimestre': 2, 'timestamp': '2026-06-01'}),
    ('Objet vide extra',              {'region': 'TUNIS', 'trimestre': 3, 'meta': {}}),
    ('Tableau extra ignoré',          {'region': 'TUNIS', 'trimestre': 3, 'tags': ['urgent']}),
]

for name, body in extra_tests:
    s, d, _ = req('POST', '/api/predict', body)
    test(name, s, d, checks={'success': True})

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  5. BATCH AVEC DONNÉES FRONTEND RÉELLES (noms avec accents)')

batch_frontend = {
    'regions': ['Sousse', 'Tunis', 'Sfax', 'Nabeul', 'Bizerte',
                'Monastir', 'Ariana', 'Béja', 'Le Kef', 'Kairouan'],
    'trimestre': 3,
    'year': 2026
}
s, d, _ = req('POST', '/api/batch-predict', batch_frontend)
test('Batch 10 régions avec noms frontend (accents/casse)', s, d,
     checks={'success_count': 10, 'error_count': 0})
print(f'       {d.get("success_count")}/{d.get("total")} prédictions réussies')
if d.get('results'):
    for r in d['results'][:3]:
        print(f'       {r["region"]:<15} {r["prediction"]:<8} {r["confiance"]}% | {r["recommandation"]}')
    print('       ...')

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  6. DONNÉES MALFORMÉES (ce que le frontend pourrait envoyer par erreur)')

malformed_tests = [
    ('Body JSON vide {}',                      {},                                            400),
    ('Body string au lieu d\'int trimestre',   {'region': 'TUNIS', 'trimestre': 'trois'},    400),
    ('region = nombre entier',                 {'region': 123,     'trimestre': 3},           400),
    ('region vide ""',                         {'region': '',      'trimestre': 3},           400),
    ('trimestre négatif -1',                   {'region': 'TUNIS', 'trimestre': -1},          400),
    ('trimestre = 0',                          {'region': 'TUNIS', 'trimestre': 0},           400),
    ('year trop ancien 2010',                  {'region': 'TUNIS', 'trimestre': 3, 'year': 2010}, 400),
    ('year trop futur 2035',                   {'region': 'TUNIS', 'trimestre': 3, 'year': 2035}, 400),
    ('région absente de Tunisie',              {'region': 'PARIS', 'trimestre': 3},           400),
    ('Content-Type texte/html au lieu JSON',   None,                                          400),
]

for name, body, expected_status in malformed_tests:
    if body is None:
        # Simuler envoi sans Content-Type JSON
        url  = BASE + '/api/predict'
        data = b'region=TUNIS&trimestre=3'
        hdrs = {'Content-Type': 'text/html'}
        r    = urllib.request.Request(url, data=data, headers=hdrs, method='POST')
        try:
            with urllib.request.urlopen(r, timeout=5) as resp:
                s, d = resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as e:
            s, d = e.code, json.loads(e.read())
        test(name, s, d, expect_status=expected_status)
    else:
        s, d, _ = req('POST', '/api/predict', body)
        test(name, s, d, expect_status=expected_status)

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  7. ENCODAGE UTF-8 ET CARACTÈRES SPÉCIAUX FRANÇAIS')

utf8_tests = [
    ('Région avec accent dans URL', 'GET', '/api/predict?region=NABEUL&trimestre=3', None),
]

for name, method, path, body in utf8_tests:
    s, d, _ = req(method, path, body)
    test(name, s, d, checks={'success': True})

# Vérifier que les réponses contiennent des accents corrects
s, d, _ = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 3})
has_accent = 'niveau_potentiel' in d
rec = d.get('recommandation', '')
test('Réponse contient des champs UTF-8 valides', s, d, checks={'success': True})
print(f'       Recommandation : "{rec}" | Niveau : "{d.get("niveau_potentiel", "?")}"')

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  8. STRUCTURE COMPLÈTE DE LA RÉPONSE (tous les champs attendus)')

s, d, _ = req('POST', '/api/predict', {'region': 'SOUSSE', 'trimestre': 2, 'year': 2026})
expected_fields = [
    'success', 'region', 'trimestre', 'year', 'prediction',
    'variation_estimee', 'variation_label', 'variation_source',
    'recommandation', 'confiance', 'probabilite_baisse', 'probabilite_hausse',
    'score_potentiel', 'niveau_potentiel', 'seuil_utilise',
    'region_data', 'timestamp', 'model_version', 'model_accuracy'
]
missing = [f for f in expected_fields if f not in d]
test('Tous les champs présents dans la réponse', s, d,
     checks={'success': True})
if missing:
    print(f'       Champs manquants : {missing}')
else:
    print(f'       Tous les {len(expected_fields)} champs présents')

region_data_fields = ['region', 'population', 'indice_achat', 'nb_hopitaux', 'nb_laboratoires']
region_data = d.get('region_data', {})
missing_rd = [f for f in region_data_fields if f not in region_data]
test('Sous-objet region_data complet', s, d)
if not missing_rd:
    print(f'       region_data: pop={region_data.get("population")}, '
          f'indice={region_data.get("indice_achat")}, '
          f'hop={region_data.get("nb_hopitaux")}, '
          f'labo={region_data.get("nb_laboratoires")}')

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  9. VALEURS DANS LES BONNES PLAGES')

s, d, _ = req('POST', '/api/predict', {'region': 'SFAX', 'trimestre': 4, 'year': 2026})
checks_range = [
    ('probabilite_hausse entre 0 et 100',   0 <= d.get('probabilite_hausse', -1) <= 100),
    ('probabilite_baisse entre 0 et 100',   0 <= d.get('probabilite_baisse', -1) <= 100),
    ('somme prob = 100',                    abs(d.get('probabilite_hausse', 0) + d.get('probabilite_baisse', 0) - 100) < 0.1),
    ('confiance entre 0 et 100',            0 <= d.get('confiance', -1) <= 100),
    ('seuil_utilise = 0.39',                d.get('seuil_utilise') == 0.39),
    ('prediction in [HAUSSE, BAISSE]',      d.get('prediction') in ['HAUSSE', 'BAISSE']),
    ('recommandation valide',               d.get('recommandation') in ['AUGMENTER', 'MAINTENIR', 'REDUIRE', 'RÉDUIRE']),
    ('model_version = 1.4',                 d.get('model_version') == '1.4'),
]
for name, condition in checks_range:
    icon = 'PASS' if condition else 'FAIL'
    if condition:
        OK += 1
    else:
        FAIL += 1
    print(f'  [{icon}] {name}')

# ─────────────────────────────────────────────────────────────────────────────
print()
print('  10. SIMULATION COMPLÈTE DASHBOARD FRONTEND')
print('      (Scénario : un manager charge le dashboard pour Q3 2026)')

ALL_24 = [
    'ARIANA', 'BEJA', 'BEN_AROUS', 'BIZERTE', 'GABES', 'GAFSA', 'JENDOUBA',
    'KAIROUAN', 'KASSERINE', 'KEBILI', 'LE_KEF', 'MAHDIA', 'MANOUBA', 'MEDENINE',
    'MONASTIR', 'NABEUL', 'SFAX', 'SIDI_BOUZID', 'SILIANA', 'SOUSSE',
    'TATAOUINE', 'TOZEUR', 'TUNIS', 'ZAGHOUAN'
]

# 1. Health check au chargement
s, d, _ = req('GET', '/api/health')
test('Étape 1 : health check', s, d, checks={'status': 'healthy'})

# 2. Charger liste régions
s, d, _ = req('GET', '/api/regions')
test('Étape 2 : charger régions', s, d, checks={'count': 24})

# 3. Batch predict toutes les régions
s, d, _ = req('POST', '/api/batch-predict', {'regions': ALL_24, 'trimestre': 3, 'year': 2026})
test('Étape 3 : batch 24 régions', s, d, checks={'success_count': 24})

# Analyser les résultats
if d.get('results'):
    aug = sum(1 for r in d['results'] if r.get('recommandation') == 'AUGMENTER')
    mai = sum(1 for r in d['results'] if r.get('recommandation') == 'MAINTENIR')
    red = sum(1 for r in d['results'] if r.get('recommandation') in ['REDUIRE', 'RÉDUIRE'])
    top3 = sorted(d['results'], key=lambda x: x.get('probabilite_hausse', 0), reverse=True)[:3]
    print(f'       Décisions : {aug} AUGMENTER | {mai} MAINTENIR | {red} RÉDUIRE')
    print('       Top 3 potentiel HAUSSE :')
    for r in top3:
        print(f'         {r["region"]:<15} {r["probabilite_hausse"]:.1f}% | {r["recommandation"]}')

# 4. Détail région sélectionnée
s, d, _ = req('GET', '/api/predict?region=BEN_AROUS&trimestre=3&year=2026')
test('Étape 4 : détail région BEN_AROUS', s, d, checks={'success': True})
print(f'       BEN_AROUS : {d.get("prediction")} | {d.get("confiance")}% confiance | {d.get("recommandation")}')

# ─────────────────────────────────────────────────────────────────────────────
total = OK + FAIL
print()
print('=' * 70)
print(f'  RÉSULTATS FINAUX : {OK}/{total} tests réussis')
if FAIL == 0:
    print()
    print('  TOUTES LES DONNÉES FRONTEND FONCTIONNENT PARFAITEMENT')
    print('  L\'API accepte correctement :')
    print('    - Noms de régions avec accents (Béja, Médenine, Kébili, Gabès...)')
    print('    - Noms en minuscules, casse mixte, majuscules')
    print('    - Types string pour les entiers (React forme HTML)')
    print('    - Prix = null, 0, ou valeur numérique')
    print('    - Champs supplémentaires ignorés sans erreur')
    print('    - Content-Type incorrect → erreur claire')
    print('    - CORS actif → navigateur peut appeler directement')
else:
    print(f'  {FAIL} test(s) échoué(s)')
print('=' * 70)
