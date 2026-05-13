"""
QUICK START - GUIDE DE DÉMARRAGE RAPIDE
========================================

Démarrer le service de prédiction ML en 5 minutes
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text):
    """Affiche un header"""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")


def check_python_version():
    """Vérifie que Python 3.8+ est installé"""
    print_header("1️⃣  VÉRIFICATION PYTHON")
    
    if sys.version_info < (3, 8):
        print(f"❌ Python 3.8+ requis, vous avez {sys.version}")
        return False
    
    print(f"✅ Python {sys.version.split()[0]} OK")
    return True


def install_dependencies():
    """Installe les dépendances"""
    print_header("2️⃣  INSTALLATION DÉPENDANCES")
    
    req_file = Path('ml_service/requirements.txt')
    
    if not req_file.exists():
        print(f"❌ Fichier {req_file} non trouvé")
        return False
    
    print(f"📦 Installation depuis {req_file}...\n")
    
    try:
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', '-r', str(req_file)],
            cwd=str(Path.cwd())
        )
        print("\n✅ Dépendances installées")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Erreur installation: {e}")
        return False


def check_model_files():
    """Vérifie que les fichiers du modèle existent"""
    print_header("3️⃣  VÉRIFICATION FICHIERS MODÈLE")
    
    required_files = [
        'ml_service/model/predict_ventes_regions_v1.3.pkl',
        'ml_service/model/metadata_v1.3.json',
        'ml_service/model/regional_recommendations.json',
        'gouvernorats_reference.csv'
    ]
    
    all_exist = True
    
    for file in required_files:
        path = Path(file)
        if path.exists():
            size_mb = path.stat().st_size / (1024 * 1024)
            print(f"✅ {file} ({size_mb:.2f} MB)")
        else:
            print(f"❌ {file} - MANQUANT")
            all_exist = False
    
    if not all_exist:
        print("\n⚠️  Exécutez d'abord le notebook ML pour générer les fichiers")
    
    return all_exist


def create_env_file():
    """Crée le fichier .env s'il n'existe pas"""
    print_header("4️⃣  CONFIGURATION .ENV")
    
    env_file = Path('.env')
    env_example = Path('.env.example')
    
    if env_file.exists():
        print(f"✅ {env_file} existe déjà")
        return True
    
    if env_example.exists():
        print(f"📋 Création {env_file} depuis .env.example...")
        env_file.write_text(env_example.read_text())
        print(f"✅ {env_file} créé")
        return True
    
    print(f"⚠️  {env_example} non trouvé - création minimale...")
    
    env_content = """FLASK_ENV=development
FLASK_PORT=5000
FLASK_DEBUG=True
ML_MODEL_PATH=./ml_service/model/predict_ventes_regions_v1.3.pkl
CACHE_TTL_MINUTES=5
"""
    
    env_file.write_text(env_content)
    print(f"✅ {env_file} créé")
    return True


def test_service():
    """Teste le service"""
    print_header("5️⃣  TEST DU SERVICE")
    
    try:
        print("🔍 Initialisation du service...\n")
        from ml_service.predict_api import PredictionService
        
        service = PredictionService()
        
        # Test health
        health = service.health_check()
        print(f"✅ Service: {health['status']}")
        
        # Test prédiction
        print("\n🔮 Test prédiction SOUSSE Q3/2026...\n")
        result = service.predict('SOUSSE', trimestre=3, year=2026)
        
        if result['success']:
            print(f"✅ Prédiction: {result['prediction']}")
            print(f"✅ Confiance: {result['confiance']}%")
            print(f"✅ Recommandation: {result['recommandation']}")
        else:
            print(f"❌ Erreur: {result.get('error')}")
            return False
        
        return True
    
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def start_flask_api():
    """Démarre l'API Flask"""
    print_header("6️⃣  DÉMARRAGE API FLASK")
    
    print("🚀 Lancement Flask sur http://localhost:5000\n")
    print("📝 Endpoints disponibles:")
    print("   • GET  / - Documentation")
    print("   • GET  /api/health - Santé du service")
    print("   • GET  /api/regions - Régions valides")
    print("   • POST /api/predict - Prédiction")
    print("   • POST /api/batch-predict - Prédictions batch")
    print("\n💡 Appuyez sur Ctrl+C pour arrêter\n")
    
    try:
        from ml_service.flask_api import app
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"❌ Erreur Flask: {e}")
        return False


def show_usage_examples():
    """Affiche des exemples d'utilisation"""
    print_header("📚 EXEMPLES D'UTILISATION")
    
    print("""
1️⃣  PYTHON - Utilisation directe:
─────────────────────────────────

from ml_service.predict_api import PredictionService

service = PredictionService()
result = service.predict('SOUSSE', trimestre=3, year=2026)
print(result['prediction'])      # 'HAUSSE' ou 'BAISSE'
print(result['recommandation'])  # 'AUGMENTER', 'MAINTENIR', 'RÉDUIRE'


2️⃣  API REST - Requête HTTP:
──────────────────────────────

curl -X POST http://localhost:5000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '{"region":"SOUSSE","trimestre":3,"year":2026}'


3️⃣  JAVASCRIPT/REACT:
─────────────────────

fetch('http://localhost:5000/api/predict', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        region: 'SOUSSE',
        trimestre: 3,
        year: 2026
    })
})
.then(res => res.json())
.then(data => console.log(data.recommandation))


4️⃣  BATCH - Plusieurs régions:
───────────────────────────────

curl -X POST http://localhost:5000/api/batch-predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "regions":["SOUSSE","TUNIS","SFAX"],
    "trimestre":3,
    "year":2026
  }'
    """)


def main():
    """Fonction principale"""
    
    print("""
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          🚀 ML PREDICTION SERVICE - QUICK START 🚀                ║
║                                                                    ║
║     Service de prédiction commerciale par région                  ║
║     Version: 1.3.0 | Status: Production-Ready ✅                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
    """)
    
    # Checklist
    steps = [
        ("Python version", check_python_version),
        ("Dependencies", install_dependencies),
        ("Model files", check_model_files),
        ("Config .env", create_env_file),
        ("Service test", test_service),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Arrêt à l'étape: {step_name}")
            return False
    
    print("\n" + "="*70)
    print("✅ TOUT PRÊT! Le service est opérationnel")
    print("="*70)
    
    # Afficher les exemples
    show_usage_examples()
    
    # Démarrer Flask?
    start = input("\n\nDémarrer l'API Flask? (o/n): ").lower().strip()
    
    if start == 'o':
        start_flask_api()
    else:
        print("\n👋 À bientôt!")
    
    return True


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Arrêt...")
