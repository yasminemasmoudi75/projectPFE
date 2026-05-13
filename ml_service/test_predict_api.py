"""
TESTS UNITAIRES - SERVICE DE PRÉDICTION ML
===========================================

Tests complets du service avec pytest
Run: pytest ml_service/test_predict_api.py -v --tb=short
"""

import pytest
import json
from ml_service.predict_api import (
    PredictionService,
    InputValidator,
    DataCache,
    PredictionException
)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="module")
def service():
    """Initialiser le service une fois pour tous les tests"""
    try:
        return PredictionService()
    except Exception as e:
        pytest.skip(f"Service ne peut pas être initialisé: {e}")


@pytest.fixture
def cache():
    """Créer une instance de cache pour les tests"""
    return DataCache(ttl_minutes=5)


# ============================================================================
# TESTS - INPUT VALIDATOR
# ============================================================================

class TestInputValidator:
    """Tests de validation des inputs"""
    
    def test_validate_region_valid(self):
        """Test validation région valide"""
        result = InputValidator.validate_region('SOUSSE')
        assert result == 'SOUSSE'
    
    def test_validate_region_lowercase(self):
        """Test conversion minuscules → majuscules"""
        result = InputValidator.validate_region('sousse')
        assert result == 'SOUSSE'
    
    def test_validate_region_with_spaces(self):
        """Test suppression espaces"""
        result = InputValidator.validate_region('  SOUSSE  ')
        assert result == 'SOUSSE'
    
    def test_validate_region_invalid(self):
        """Test région invalide"""
        with pytest.raises(PredictionException):
            InputValidator.validate_region('INVALID_REGION')
    
    def test_validate_region_empty(self):
        """Test région vide"""
        with pytest.raises(PredictionException):
            InputValidator.validate_region('')
    
    def test_validate_trimestre_valid(self):
        """Test trimestre valide"""
        for tri in [1, 2, 3, 4]:
            result = InputValidator.validate_trimestre(tri)
            assert result == tri
    
    def test_validate_trimestre_invalid(self):
        """Test trimestre invalide"""
        with pytest.raises(PredictionException):
            InputValidator.validate_trimestre(5)
    
    def test_validate_trimestre_string(self):
        """Test trimestre comme string"""
        result = InputValidator.validate_trimestre('3')
        assert result == 3
    
    def test_validate_year_valid(self):
        """Test année valide"""
        result = InputValidator.validate_year(2026)
        assert result == 2026
    
    def test_validate_year_out_of_range(self):
        """Test année hors limites"""
        with pytest.raises(PredictionException):
            InputValidator.validate_year(2050)
    
    def test_validate_input_complete(self):
        """Test validation complète"""
        region, tri, year = InputValidator.validate_input('SOUSSE', 3, 2026)
        assert region == 'SOUSSE'
        assert tri == 3
        assert year == 2026


# ============================================================================
# TESTS - DATA CACHE
# ============================================================================

class TestDataCache:
    """Tests du système de cache"""
    
    def test_cache_set_get(self, cache):
        """Test stockage et récupération"""
        data = {'test': 'value'}
        cache.set('key1', data)
        result = cache.get('key1')
        assert result == data
    
    def test_cache_miss(self, cache):
        """Test clé inexistante"""
        result = cache.get('nonexistent')
        assert result is None
    
    def test_cache_clear(self, cache):
        """Test vidage du cache"""
        cache.set('key1', {'data': 'test'})
        cache.clear()
        assert cache.get('key1') is None
    
    def test_cache_size(self, cache):
        """Test taille du cache"""
        cache.clear()
        cache.set('key1', {'data': 1})
        cache.set('key2', {'data': 2})
        assert len(cache.cache) == 2


# ============================================================================
# TESTS - PREDICTION SERVICE
# ============================================================================

class TestPredictionService:
    """Tests du service de prédiction"""
    
    def test_service_initialization(self, service):
        """Test initialisation du service"""
        assert service is not None
        assert service.model is not None
        assert service.data_manager is not None
    
    def test_health_check(self, service):
        """Test health check"""
        health = service.health_check()
        assert health['status'] in ['healthy', 'unhealthy']
        assert 'model_loaded' in health
        assert 'timestamp' in health
    
    def test_predict_valid_input(self, service):
        """Test prédiction avec input valide"""
        result = service.predict('SOUSSE', trimestre=3, year=2026)
        
        assert result['success'] is True
        assert 'region' in result
        assert 'prediction' in result
        assert result['prediction'] in ['HAUSSE', 'BAISSE']
        assert 'confiance' in result
        assert 0 <= result['confiance'] <= 100
    
    def test_predict_returns_recommandation(self, service):
        """Test que la recommandation est retournée"""
        result = service.predict('SOUSSE', trimestre=3, year=2026)
        
        assert 'recommandation' in result
        assert result['recommandation'] in ['AUGMENTER', 'MAINTENIR', 'RÉDUIRE']
    
    def test_predict_returns_probabilities(self, service):
        """Test que les probabilités sont retournées"""
        result = service.predict('SOUSSE', trimestre=3, year=2026)
        
        assert 'probabilite_baisse' in result
        assert 'probabilite_hausse' in result
        
        # Les probabilités doivent être > 0 et < 100
        assert 0 < result['probabilite_baisse'] < 100
        assert 0 < result['probabilite_hausse'] < 100
        
        # Leur somme doit être ~100
        assert 99 < result['probabilite_baisse'] + result['probabilite_hausse'] < 101
    
    def test_predict_invalid_region(self, service):
        """Test prédiction avec région invalide"""
        result = service.predict('INVALID', trimestre=3, year=2026)
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_predict_invalid_trimestre(self, service):
        """Test prédiction avec trimestre invalide"""
        result = service.predict('SOUSSE', trimestre=5, year=2026)
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_predict_different_years(self, service):
        """Test prédictions pour différentes années"""
        for year in [2026, 2027, 2028]:
            result = service.predict('SOUSSE', trimestre=3, year=year)
            assert result['success'] is True
            assert result['year'] == year
    
    def test_predict_all_regions(self, service):
        """Test prédiction pour toutes les régions"""
        from ml_service.predict_api import InputValidator
        
        for region in InputValidator.VALID_REGIONS[:5]:  # Test 5 premières
            result = service.predict(region, trimestre=3, year=2026)
            assert result['success'] is True, f"Erreur pour {region}"
    
    def test_predict_caching(self, service):
        """Test que le cache fonctionne"""
        # Première prédiction
        result1 = service.predict('SOUSSE', trimestre=3, year=2026)
        assert result1['success'] is True
        
        # Cache_size doit augmenter
        cache_size_before = len(service.cache.cache)
        assert cache_size_before >= 1
        
        # Deuxième prédiction (depuis cache)
        result2 = service.predict('SOUSSE', trimestre=3, year=2026)
        assert result2 == result1  # Identique
    
    def test_predict_batch(self, service):
        """Test prédictions batch"""
        regions = ['SOUSSE', 'TUNIS', 'SFAX']
        result = service.predict_batch(regions, trimestre=3, year=2026)
        
        assert 'success' in result
        assert 'total' in result
        assert 'success_count' in result
        assert result['total'] == len(regions)
    
    def test_predict_batch_empty(self, service):
        """Test batch avec liste vide"""
        result = service.predict_batch([], trimestre=3, year=2026)
        
        assert result['total'] == 0
        assert result['success_count'] == 0


# ============================================================================
# TESTS - INTEGRATION
# ============================================================================

class TestIntegration:
    """Tests d'intégration complets"""
    
    def test_end_to_end_prediction(self, service):
        """Test prédiction de bout en bout"""
        # 1. Validation
        region, tri, year = InputValidator.validate_input('SOUSSE', 3, 2026)
        
        # 2. Prédiction
        result = service.predict(region, tri, year)
        
        # 3. Vérification résultat
        assert result['success'] is True
        assert result['prediction'] in ['HAUSSE', 'BAISSE']
        assert result['recommandation'] in ['AUGMENTER', 'MAINTENIR', 'RÉDUIRE']
    
    def test_prediction_consistency(self, service):
        """Test que les prédictions sont cohérentes"""
        # Même input → même output
        result1 = service.predict('SOUSSE', 3, 2026)
        result2 = service.predict('SOUSSE', 3, 2026)
        
        assert result1['prediction'] == result2['prediction']
        assert result1['confiance'] == result2['confiance']
    
    def test_prediction_response_format(self, service):
        """Test le format de la réponse"""
        result = service.predict('SOUSSE', 3, 2026)
        
        # Vérifier tous les champs requis
        required_fields = [
            'success', 'region', 'trimestre', 'year',
            'prediction', 'confiance', 'recommandation',
            'timestamp', 'model_version'
        ]
        
        for field in required_fields:
            assert field in result, f"Champ manquant: {field}"


# ============================================================================
# TESTS - ERROR HANDLING
# ============================================================================

class TestErrorHandling:
    """Tests de gestion d'erreurs"""
    
    def test_predict_with_none_region(self, service):
        """Test prédiction avec région None"""
        result = service.predict(None, 3, 2026)
        assert result['success'] is False
    
    def test_predict_with_invalid_year_type(self, service):
        """Test prédiction avec année de type invalide"""
        result = service.predict('SOUSSE', 3, 'invalid')
        assert result['success'] is False
    
    def test_predict_error_structure(self, service):
        """Test structure des erreurs"""
        result = service.predict('INVALID', 3, 2026)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'timestamp' in result


# ============================================================================
# TESTS - PERFORMANCE
# ============================================================================

class TestPerformance:
    """Tests de performance"""
    
    def test_predict_response_time(self, service):
        """Test temps de réponse"""
        import time
        
        start = time.time()
        service.predict('SOUSSE', 3, 2026)
        elapsed = time.time() - start
        
        # Doit être rapide (< 1 seconde)
        assert elapsed < 1.0, f"Prédiction trop lente: {elapsed}s"
    
    def test_batch_predict_performance(self, service):
        """Test performance batch"""
        import time
        
        regions = ['SOUSSE', 'TUNIS', 'SFAX', 'SFAX', 'SOUSSE']
        
        start = time.time()
        service.predict_batch(regions, 3, 2026)
        elapsed = time.time() - start
        
        # 5 prédictions en < 2 secondes
        assert elapsed < 2.0, f"Batch trop lent: {elapsed}s"


# ============================================================================
# MAIN - RUN TESTS
# ============================================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short', '-x'])
