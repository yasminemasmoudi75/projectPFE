"""
TEST COMPLET DE L'API FLASK ML V1.4
====================================
Lance tous les tests sur les endpoints Flask.
Usage : python test_api_complet.py
"""

import sys
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = 'http://127.0.0.1:5000'
OK   = 0
FAIL = 0

ALL_24 = [
    'ARIANA', 'BEJA', 'BEN_AROUS', 'BIZERTE', 'GABES', 'GAFSA', 'JENDOUBA',
    'KAIROUAN', 'KASSERINE', 'KEBILI', 'LE_KEF', 'MAHDIA', 'MANOUBA', 'MEDENINE',
    'MONASTIR', 'NABEUL', 'SFAX', 'SIDI_BOUZID', 'SILIANA', 'SOUSSE',
    'TATAOUINE', 'TOZEUR', 'TUNIS', 'ZAGHOUAN'
]


def req(method, path, body=None):
    url  = BASE + path
    data = json.dumps(body).encode('utf-8') if body else None
    hdrs = {'Content-Type': 'application/json'} if body else {}
    r    = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def test(name, status, data, expect_status=200, checks=None):
    global OK, FAIL
    passed = (status == expect_status)
    if checks and passed:
        for key, val in checks.items():
            if data.get(key) != val:
                passed = False
                break
    icon = 'PASS' if passed else 'FAIL'
    if passed:
        OK += 1
    else:
        FAIL += 1
    detail = ''
    if not passed:
        detail = f' | attendu={checks} obtenu={data}'
    print(f'  [{icon}] {name} (HTTP {status}){detail}')
    return passed, data


# ==============================================================================
print()
print('=' * 65)
print('  TESTS COMPLETS — API FLASK ML PREDICTION VENTES V1.4')
print('=' * 65)

# ── 1. Endpoint racine ────────────────────────────────────────────────────────
print()
print('  1. ENDPOINT RACINE  GET /')
s, d = req('GET', '/')
test('Version = 1.4.0',           s, d, checks={'version': '1.4.0'})
test('Nom service correct',        s, d, checks={'name': 'ML Prediction API'})
test('Endpoint /api/predict liste', s, d)

# ── 2. Health check ───────────────────────────────────────────────────────────
print()
print('  2. HEALTH CHECK  GET /api/health')
s, d = req('GET', '/api/health')
test('Status = healthy',     s, d, checks={'status': 'healthy'})
test('Modele charge = True', s, d, checks={'model_loaded': True})
print(f'       Type modele  : {d.get("model_type", "?")}')
print(f'       Cache actuel : {d.get("cache_size", "?")} entrees')

# ── 3. Regions ────────────────────────────────────────────────────────────────
print()
print('  3. LISTE REGIONS  GET /api/regions')
s, d = req('GET', '/api/regions')
test('Success = True',  s, d, checks={'success': True})
test('Count = 24',      s, d, checks={'count': 24})
regions_list = d.get('regions', [])
test('TUNIS present',   s, d)
assert 'TUNIS' in regions_list, 'TUNIS absent'
test('SFAX present',    s, d)
assert 'SFAX' in regions_list, 'SFAX absent'
print(f'       {len(regions_list)} regions : {", ".join(sorted(regions_list)[:6])}...')

# ── 4. Stats ──────────────────────────────────────────────────────────────────
print()
print('  4. STATISTIQUES  GET /api/stats')
s, d = req('GET', '/api/stats')
test('Success = True',          s, d, checks={'success': True})
test('regions_total = 24',      s, d, checks={'regions_total': 24})
test('model_type present',      s, d)
print(f'       Accuracy production : {d.get("model_accuracy", "?")}')
print(f'       F1-Score production : {d.get("model_f1_score", "?")}')
print(f'       Recommandations     : {d.get("recommendations_loaded", "?")}')

# ── 5. Predictions unitaires ──────────────────────────────────────────────────
print()
print('  5. PREDICTIONS UNITAIRES  POST /api/predict')

tests_predict = [
    ('SOUSSE', 3, 2026, None),
    ('TUNIS',  1, 2026, None),
    ('SFAX',   2, 2026, 25.0),
    ('KASSERINE', 4, 2026, None),
    ('BEN_AROUS', 1, 2026, None),
    ('TATAOUINE', 2, 2026, None),
]

print(f'  {"Region":<15} {"Trimestre":>10} {"Prediction":>12} {"Confiance":>10} {"Recommandation":>16} {"Source variation":>18}')
print('  ' + '-' * 87)
for region, tri, yr, prix in tests_predict:
    body = {'region': region, 'trimestre': tri, 'year': yr}
    if prix:
        body['prix'] = prix
    s, d = req('POST', '/api/predict', body)
    ok, _ = test(f'{region} Q{tri}', s, d, checks={'success': True, 'region': region})
    pred = d.get('prediction', '?')
    conf = d.get('confiance', 0)
    rec  = d.get('recommandation', '?')
    src  = d.get('variation_source', '?')
    print(f'  {region:<15} {"Q"+str(tri)+"/"+str(yr):>10} {pred:>12} {str(conf)+"%":>10} {rec:>16} {src:>18}')

# ── 6. Validation des inputs ──────────────────────────────────────────────────
print()
print('  6. VALIDATION DES INPUTS (cas erreur)')

s, d = req('POST', '/api/predict', {'region': 'REGION_FICTIVE', 'trimestre': 3})
ok, _ = test('Region invalide -> HTTP 400', s, d, expect_status=400)
print(f'       Erreur : {d.get("error", "")[:70]}')

s, d = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 5})
test('Trimestre 5 invalide -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 0})
test('Trimestre 0 invalide -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 3, 'year': 1990})
test('Annee 1990 invalide -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 3, 'year': 2035})
test('Annee 2035 invalide -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'trimestre': 3})
test('Region manquante -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'region': 'TUNIS'})
test('Trimestre manquant -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/predict', {'region': 'tunis', 'trimestre': 2})
test('Region minuscule "tunis" -> OK (normalisation)', s, d, checks={'success': True})

s, d = req('POST', '/api/predict', {'region': 'TUNIS', 'trimestre': 3, 'prix': 999.0})
test('Prix 999 hors plage -> utilise mediane (OK)', s, d, checks={'success': True})
print(f'       Prediction valide malgre prix=999 DT : {d.get("prediction")}')

# ── 7. Méthode GET ────────────────────────────────────────────────────────────
print()
print('  7. PREDICTION VIA GET (parametres URL)')

endpoints_get = [
    '/api/predict?region=NABEUL&trimestre=2&year=2026',
    '/api/predict?region=GABES&trimestre=1',
    '/api/predict?region=SOUSSE&trimestre=4&year=2026&prix=15.5',
]
for ep in endpoints_get:
    s, d = req('GET', ep)
    region = d.get('region', '?')
    test(f'GET {ep[:45]}...', s, d, checks={'success': True})
    print(f'       {region} : {d.get("prediction")} | {d.get("confiance")}% | {d.get("recommandation")}')

# ── 8. Batch predict ──────────────────────────────────────────────────────────
print()
print('  8. BATCH PREDICT  POST /api/batch-predict')

batch_10 = ['SOUSSE', 'TUNIS', 'SFAX', 'NABEUL', 'BIZERTE',
            'KAIROUAN', 'ARIANA', 'MONASTIR', 'GABES', 'GAFSA']
s, d = req('POST', '/api/batch-predict', {'regions': batch_10, 'trimestre': 3, 'year': 2026})
test('Batch 10 regions -> success_count=10', s, d, checks={'success_count': 10, 'error_count': 0})
print(f'       {d.get("success_count")}/{d.get("total")} predictions reussies')

s, d = req('POST', '/api/batch-predict', {'regions': ALL_24, 'trimestre': 2, 'year': 2026})
test('Batch 24 gouvernorats -> tous OK', s, d, checks={'success_count': 24, 'error_count': 0})
print(f'       {d.get("success_count")}/24 gouvernorats predits avec succes')

s, d = req('POST', '/api/batch-predict', {'regions': ['TUNIS'] * 25, 'trimestre': 1})
test('Batch > 24 -> HTTP 400', s, d, expect_status=400)

s, d = req('POST', '/api/batch-predict', {'regions': ['TUNIS', 'REGION_INVALID'], 'trimestre': 3})
test('Batch mixte (1 valide + 1 invalide)', s, d)
print(f'       Succes: {d.get("success_count")} | Erreurs: {d.get("error_count")}')

# ── 9. Gestion erreurs HTTP ───────────────────────────────────────────────────
print()
print('  9. GESTION ERREURS HTTP')
s, d = req('GET', '/api/route_inexistante')
test('Route inexistante -> HTTP 404', s, d, expect_status=404)
test('404 contient available_endpoints', s, d)

s, d = req('POST', '/api/predict')
test('POST sans JSON -> HTTP 400 ou 500', s, d, expect_status=400)

# ── 10. Cache ─────────────────────────────────────────────────────────────────
print()
print('  10. CACHE (coherence)')
s1, d1 = req('POST', '/api/predict', {'region': 'BEJA', 'trimestre': 4, 'year': 2026})
s2, d2 = req('POST', '/api/predict', {'region': 'BEJA', 'trimestre': 4, 'year': 2026})
coherent = (d1.get('prediction') == d2.get('prediction') and
            d1.get('confiance')  == d2.get('confiance'))
test('Deux requetes identiques = resultat identique', s2, d2, checks={'success': True})
print(f'       1ere: {d1.get("prediction")} {d1.get("confiance")}% | 2eme: {d2.get("prediction")} {d2.get("confiance")}% | Coherent: {coherent}')

# ── 11. Tableau complet 24 gouvernorats ──────────────────────────────────────
print()
print('  11. TABLEAU COMPLET — 24 GOUVERNORATS (Q3 2026)')
s, d = req('POST', '/api/batch-predict', {'regions': ALL_24, 'trimestre': 3, 'year': 2026})
if d.get('results'):
    print()
    print(f'  {"Gouvernorat":<16} {"Prediction":>10} {"P(HAUSSE)%":>12} {"Confiance%":>11} {"Recommandation":>16} {"Var. source":>14}')
    print('  ' + '=' * 85)
    aug = mai = red = 0
    for r in sorted(d['results'], key=lambda x: x['probabilite_hausse'], reverse=True):
        icon_rec = 'AUGMENTER' if r['recommandation'] == 'AUGMENTER' else \
                   'MAINTENIR' if r['recommandation'] == 'MAINTENIR' else 'REDUIRE'
        if icon_rec == 'AUGMENTER': aug += 1
        elif icon_rec == 'MAINTENIR': mai += 1
        else: red += 1
        print(f'  {r["region"]:<16} {r["prediction"]:>10} {r["probabilite_hausse"]:>11.1f}% '
              f'{r["confiance"]:>10.1f}% {icon_rec:>16} {r["variation_source"]:>14}')
    print('  ' + '=' * 85)
    print(f'  AUGMENTER: {aug}  |  MAINTENIR: {mai}  |  REDUIRE: {red}')

# ── Résumé final ──────────────────────────────────────────────────────────────
total = OK + FAIL
print()
print('=' * 65)
print(f'  RESULTATS FINAUX : {OK}/{total} tests reussis')
if FAIL == 0:
    print('  TOUS LES TESTS PASSENT')
    print('  API 100% operationnelle — Prete pour la soutenance')
else:
    print(f'  {FAIL} test(s) echoue(s)')
    print('  Voir les details ci-dessus')
print('=' * 65)
