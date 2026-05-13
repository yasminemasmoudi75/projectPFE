"""
FLASK API - ENDPOINT REST POUR PRÉDICTION ML
=============================================

API REST exposant le service de prédiction via Flask
Endpoints: /predict, /health, /regions, /batch-predict

Format: RESTful avec JSON
"""

import sys
import os
from pathlib import Path

# Ajouter le répertoire parent à sys.path
sys.path.insert(0, str(Path(__file__).parent))

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict_api import PredictionService, logger


# ============================================================================
# INITIALISATION FLASK
# ============================================================================

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSON_AS_ASCII'] = False

# Initialiser le service
try:
    prediction_service = PredictionService()
    logger.info("Service de prediction initialise dans Flask")
except Exception as e:
    logger.error(f"Erreur initialisation service: {e}")
    prediction_service = None


# ============================================================================
# MIDDLEWARE & ERROR HANDLING
# ============================================================================

@app.before_request
def log_request():
    """Log chaque requête"""
    logger.debug(f"→ {request.method} {request.path}")


@app.errorhandler(404)
def not_found(error):
    """Endpoint non trouvé"""
    return jsonify({
        'success': False,
        'error': 'Endpoint non trouvé',
        'available_endpoints': ['/api/predict', '/api/health', '/api/regions']
    }), 404


@app.errorhandler(500)
def server_error(error):
    """Erreur serveur"""
    logger.error(f"Erreur serveur: {error}")
    return jsonify({
        'success': False,
        'error': 'Erreur serveur interne'
    }), 500


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check du service
    
    Returns:
        200: Service sain
        503: Service indisponible
    """
    if prediction_service is None:
        logger.error("Service non initialise")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': 'Service non initialisé'
        }), 503
    
    health_info = prediction_service.health_check()
    
    return jsonify(health_info), 200


@app.route('/api/regions', methods=['GET'])
def regions():
    """
    Liste toutes les régions valides
    
    Returns:
        200: Liste des régions
    """
    try:
        from predict_api import InputValidator
        return jsonify({
            'success': True,
            'count': len(InputValidator.VALID_REGIONS),
            'regions': sorted(InputValidator.VALID_REGIONS)
        }), 200
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/predict', methods=['POST', 'GET'])
def predict():
    """
    Prédit les ventes pour une région
    
    GET Parameters:
        region: Nom de la région (requis)
        trimestre: Trimestre 1-4 (optionnel, défaut 3)
        year: Année (optionnel, défaut 2026)
    
    POST Body JSON:
    {
        "region": "SOUSSE",      (requis)
        "trimestre": 3,          (requis, 1-4)
        "year": 2026             (optionnel, défaut 2026)
    }
    
    Returns:
        200: Prédiction réussie
        400: Erreur validation
        503: Service indisponible
    """
    
    if prediction_service is None:
        logger.error("Service non initialise")
        return jsonify({
            'success': False,
            'error': 'Service indisponible'
        }), 503
    
    try:
        # Récupérer les paramètres (GET ou POST JSON)
        if request.method == 'GET':
            region = request.args.get('region')
            trimestre = request.args.get('trimestre', 3, type=int)
            year = request.args.get('year', 2026, type=int)
        else:
            # POST JSON
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'error': 'Content-Type doit être application/json'
                }), 400
            
            data = request.get_json()
            
            # Valider les champs requis
            if 'region' not in data or 'trimestre' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Champs requis: region, trimestre',
                    'example': {
                        'region': 'SOUSSE',
                        'trimestre': 3,
                        'year': 2026
                    }
                }), 400
            
            # Récupérer les paramètres
            region = data['region']
            trimestre = data['trimestre']
            year = data.get('year', 2026)
        
        logger.info(f"Prediction: {region} Q{trimestre}/{year}")
        
        # Appeler le service
        result = prediction_service.predict(region, trimestre, year)
        
        if not result.get('success', True):
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Erreur endpoint predict: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Erreur: {str(e)}'
        }), 500


@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """
    Prédit pour plusieurs régions
    
    Body JSON:
    {
        "regions": ["SOUSSE", "TUNIS", "SFAX"],
        "trimestre": 3,
        "year": 2026
    }
    
    Returns:
        200: Prédictions réussies (partiellement ou totalement)
        400: Erreur validation
        503: Service indisponible
    """
    
    if prediction_service is None:
        return jsonify({
            'success': False,
            'error': 'Service indisponible'
        }), 503
    
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type doit être application/json'
            }), 400
        
        data = request.get_json()
        
        if 'regions' not in data or 'trimestre' not in data:
            return jsonify({
                'success': False,
                'error': 'Champs requis: regions (list), trimestre'
            }), 400
        
        regions = data['regions']
        trimestre = data['trimestre']
        year = data.get('year', 2026)
        
        if not isinstance(regions, list):
            return jsonify({
                'success': False,
                'error': 'regions doit être une liste'
            }), 400
        
        if len(regions) > 24:
            return jsonify({
                'success': False,
                'error': 'Maximum 24 régions à la fois'
            }), 400
        
        logger.info(f"Predictions batch: {len(regions)} regions")
        
        result = prediction_service.predict_batch(regions, trimestre, year)
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Erreur batch-predict: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Erreur: {str(e)}'
        }), 500


@app.route('/api/stats', methods=['GET'])
def stats():
    """
    Statistiques du service
    """
    if prediction_service is None:
        return jsonify({'success': False, 'error': 'Service indisponible'}), 503
    
    return jsonify({
        'success': True,
        'cache_size': len(prediction_service.cache.cache),
        'model_type': type(prediction_service.model).__name__,
        'model_accuracy': prediction_service.metadata.get('accuracy'),
        'model_f1_score': prediction_service.metadata.get('f1_score'),
        'regions_total': 24,
        'recommendations_loaded': len(prediction_service.recommendations)
    }), 200


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.route('/', methods=['GET'])
def root():
    """Endpoint racine - Documentation API"""
    return jsonify({
        'name': 'ML Prediction API',
        'version': '1.3.0',
        'description': 'Service de prédiction commerciale par région',
        'endpoints': {
            'GET /': 'Cette page',
            'GET /api/health': 'Santé du service',
            'GET /api/regions': 'Liste des régions valides',
            'GET /api/stats': 'Statistiques du service',
            'POST /api/predict': 'Prédire pour une région',
            'POST /api/batch-predict': 'Prédire pour plusieurs régions'
        },
        'example_predict': {
            'method': 'POST',
            'url': '/api/predict',
            'body': {
                'region': 'SOUSSE',
                'trimestre': 3,
                'year': 2026
            }
        },
        'example_batch': {
            'method': 'POST',
            'url': '/api/batch-predict',
            'body': {
                'regions': ['SOUSSE', 'TUNIS', 'SFAX'],
                'trimestre': 3,
                'year': 2026
            }
        }
    }), 200


# ============================================================================
# DÉMARRAGE
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"\n{'='*70}")
    logger.info(f"Demarrage Flask sur le port {port}")
    logger.info(f"{'='*70}\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=debug
    )
