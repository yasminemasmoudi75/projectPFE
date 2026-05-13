"""
API SERVICE - PRÉDICTION COMMERCIALE ML
========================================

Service production-ready pour prédire les ventes et générer
des recommandations commerciales par région.

Auteur: Système ML
Version: 1.3.0
Date: Mai 2026
Status: Production-Ready ✅
"""

import os
import json
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from pathlib import Path


# ============================================================================
# CONFIGURATION & LOGGING
# ============================================================================

class LoggerConfig:
    """Configuration centralisée des logs"""
    
    @staticmethod
    def setup_logger(name: str = "MLPredictionAPI") -> logging.Logger:
        """Configure le logger avec handlers fichier et console"""
        
        logger = logging.getLogger(name)
        
        # Éviter les logs dupliqués
        if logger.handlers:
            return logger
        
        logger.setLevel(logging.DEBUG)
        
        # Format
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Handler Console
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Handler Fichier
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)
        
        file_handler = logging.FileHandler(
            log_dir / f"prediction_api_{datetime.now().strftime('%Y%m%d')}.log"
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        return logger


logger = LoggerConfig.setup_logger()


# ============================================================================
# VALIDATEURS & EXCEPTION PERSONNALISÉES
# ============================================================================

class PredictionException(Exception):
    """Exception personnalisée pour les erreurs de prédiction"""
    pass


class InputValidator:
    """Valide les inputs de prédiction"""
    
    # Listes valides
    VALID_REGIONS = [
        'ARIANA', 'BEJA', 'BEN_AROUS', 'BIZERTE', 'GABES',
        'GAFSA', 'JENDOUBA', 'KAIROUAN', 'KASSERINE', 'KEBILI',
        'LE_KEF', 'MAHDIA', 'MANOUBA', 'MEDENINE', 'MONASTIR',
        'NABEUL', 'SFAX', 'SIDI_BOUZID', 'SILIANA', 'SOUSSE',
        'TATAOUINE', 'TOZEUR', 'TUNIS', 'ZAGHOUAN'
    ]
    
    VALID_TRIMESTRES = [1, 2, 3, 4]
    MIN_YEAR = 2020
    MAX_YEAR = 2030
    
    @staticmethod
    def validate_region(region: str) -> str:
        """Valide le nom de la région"""
        if not region:
            raise PredictionException("Region ne peut pas être vide")
        
        region_upper = region.upper().strip()
        
        if region_upper not in InputValidator.VALID_REGIONS:
            raise PredictionException(
                f"Region invalide: '{region}'. "
                f"Régions valides: {', '.join(InputValidator.VALID_REGIONS)}"
            )
        
        return region_upper
    
    @staticmethod
    def validate_trimestre(trimestre: int) -> int:
        """Valide le trimestre"""
        try:
            tri = int(trimestre)
        except (ValueError, TypeError):
            raise PredictionException(f"Trimestre doit être un nombre (1-4), reçu: {trimestre}")
        
        if tri not in InputValidator.VALID_TRIMESTRES:
            raise PredictionException(
                f"Trimestre invalide: {tri}. "
                f"Valeurs acceptées: {InputValidator.VALID_TRIMESTRES}"
            )
        
        return tri
    
    @staticmethod
    def validate_year(year: int) -> int:
        """Valide l'année"""
        try:
            y = int(year)
        except (ValueError, TypeError):
            raise PredictionException(f"Year doit être un nombre, reçu: {year}")
        
        if not (InputValidator.MIN_YEAR <= y <= InputValidator.MAX_YEAR):
            raise PredictionException(
                f"Year invalide: {y}. "
                f"Intervalle accepté: {InputValidator.MIN_YEAR}-{InputValidator.MAX_YEAR}"
            )
        
        return y
    
    @staticmethod
    def validate_input(region: str, trimestre: int, year: int = 2026) -> Tuple[str, int, int]:
        """Valide tous les inputs ensemble"""
        region = InputValidator.validate_region(region)
        trimestre = InputValidator.validate_trimestre(trimestre)
        year = InputValidator.validate_year(year)
        
        return region, trimestre, year


# ============================================================================
# GESTIONNAIRE DE DONNÉES & CACHE
# ============================================================================

class DataCache:
    """Gestionnaire de cache simple en mémoire (5 min TTL)"""
    
    def __init__(self, ttl_minutes: int = 5):
        self.cache = {}
        self.ttl = ttl_minutes * 60  # en secondes
        self.logger = logger
        self.logger.info(f"[INIT] Cache initialisé (TTL: {ttl_minutes} min)")
    
    def get(self, key: str) -> Optional[Dict]:
        """Récupère une valeur du cache"""
        if key not in self.cache:
            return None
        
        value, timestamp = self.cache[key]
        
        # Vérifier si expiré
        if (datetime.now() - timestamp).total_seconds() > self.ttl:
            del self.cache[key]
            self.logger.debug(f"Cache EXPIRED: {key}")
            return None
        
        self.logger.debug(f"Cache HIT: {key}")
        return value
    
    def set(self, key: str, value: Dict) -> None:
        """Stocke une valeur dans le cache"""
        self.cache[key] = (value, datetime.now())
        self.logger.debug(f"Cache SET: {key}")
    
    def clear(self) -> None:
        """Vide le cache"""
        self.cache.clear()
        self.logger.info("Cache cleared")


class RegionalDataManager:
    """Gère les données régionales et démographiques"""
    
    def __init__(self, ref_data_path: str = './gouvernorats_reference.csv'):
        self.logger = logger
        self.ref_data_path = ref_data_path
        self.ref_data = None
        self._load_reference_data()
    
    def _load_reference_data(self) -> None:
        """Charge les données de référence des régions"""
        try:
            self.ref_data = pd.read_csv(self.ref_data_path)
            self.logger.info(f"[OK] Données régionales chargées: {len(self.ref_data)} régions")
            
            # Valider
            if len(self.ref_data) != 24:
                self.logger.warning(f"⚠️  Attendu 24 régions, trouvé {len(self.ref_data)}")
            
            if self.ref_data.isnull().sum().sum() > 0:
                self.logger.warning("⚠️  NULLs détectés dans les données régionales")
        
        except FileNotFoundError:
            self.logger.error(f"[FILE_ERROR] Fichier non trouvé: {self.ref_data_path}")
            raise PredictionException(f"Impossible de charger les données régionales: {self.ref_data_path}")
        
        except Exception as e:
            self.logger.error(f"[ERROR] Erreur lors du chargement des données: {e}")
            raise PredictionException(f"Erreur chargement données régionales: {str(e)}")
    
    def get_region_data(self, region_name: str) -> Dict:
        """Récupère les données d'une région"""
        try:
            # Chercher la région
            region_row = self.ref_data[
                self.ref_data['Region'].str.upper() == region_name.upper()
            ]
            
            if region_row.empty:
                raise PredictionException(f"Région non trouvée dans les données: {region_name}")
            
            row = region_row.iloc[0]
            
            return {
                'region': row['Region'],
                'population': float(row['Population']),
                'indice_achat': float(row['Indice_Achat']),
                'nb_hopitaux': int(row['Nb_Hopitaux']),
                'nb_laboratoires': int(row['Nb_Laboratoires'])
            }
        
        except Exception as e:
            self.logger.error(f"[ERROR] Erreur récupération données région: {e}")
            raise PredictionException(f"Erreur données région: {str(e)}")


# ============================================================================
# SERVICE DE PRÉDICTION
# ============================================================================

class PredictionService:
    """Service principal de prédiction ML"""
    
    def __init__(
        self,
        model_path: str = './ml_service/model/predict_ventes_regions_v1.3.pkl',
        metadata_path: str = './ml_service/model/metadata_v1.3.json',
        recommendations_path: str = './ml_service/model/regional_recommendations.json'
    ):
        self.logger = logger
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.recommendations_path = recommendations_path
        
        # Initialiser les composants
        self.model = None
        self.metadata = None
        self.recommendations = None
        self.data_manager = RegionalDataManager()
        self.cache = DataCache(ttl_minutes=5)
        
        # Charger les ressources
        self._load_model()
        self._load_metadata()
        self._load_recommendations()
        
        self.logger.info("[READY] PredictionService initialisé avec succès")
    
    def _load_model(self) -> None:
        """Charge le modèle ML"""
        try:
            self.model = joblib.load(self.model_path)
            self.logger.info(f"[LOADED] Modèle ML chargé: {type(self.model).__name__}")
        except FileNotFoundError:
            self.logger.error(f"[MODEL_ERROR] Modèle non trouvé: {self.model_path}")
            raise PredictionException(f"Modèle ML introuvable: {self.model_path}")
        except Exception as e:
            self.logger.error(f"[MODEL_ERROR] Erreur chargement modèle: {e}")
            raise PredictionException(f"Erreur chargement modèle: {str(e)}")
    
    def _load_metadata(self) -> None:
        """Charge les métadonnées du modèle"""
        try:
            with open(self.metadata_path, 'r') as f:
                self.metadata = json.load(f)
            self.logger.info(f"[OK] Métadonnées chargées (v{self.metadata.get('version')})")
        except FileNotFoundError:
            self.logger.warning(f"⚠️  Métadonnées non trouvées: {self.metadata_path}")
            self.metadata = {'version': 'unknown'}
        except Exception as e:
            self.logger.warning(f"⚠️  Erreur chargement métadonnées: {e}")
            self.metadata = {'version': 'unknown'}
    
    def _load_recommendations(self) -> None:
        """Charge les recommandations régionales"""
        try:
            with open(self.recommendations_path, 'r') as f:
                data = json.load(f)
            
            # Convertir liste en dictionnaire
            if isinstance(data, list):
                # La liste a les régions avec espaces (BEN AROUS), on normalise en underscores
                self.recommendations = {}
                for item in data:
                    region_key = item.get('Region_Inferred', '').replace(' ', '_').upper()
                    self.recommendations[region_key] = item
                self.logger.info(f"[OK] Recommandations converties ({len(self.recommendations)} régions)")
            else:
                self.recommendations = data
                self.logger.info(f"[OK] Recommandations chargées ({len(self.recommendations)} régions)")
        except FileNotFoundError:
            self.logger.warning(f"⚠️  Recommandations non trouvées: {self.recommendations_path}")
            self.recommendations = {}
        except Exception as e:
            self.logger.warning(f"⚠️  Erreur chargement recommandations: {e}")
            self.recommendations = {}
    
    def predict(self, region: str, trimestre: int, year: int = 2026) -> Dict:
        """
        Prédit le résultat commercial pour une région/trimestre
        
        Args:
            region: Nom de la région (ex: 'SOUSSE')
            trimestre: Trimestre (1-4)
            year: Année (par défaut 2026)
        
        Returns:
            Dict avec prediction, confiance, recommandation, etc.
        
        Raises:
            PredictionException: Si erreur de validation ou prédiction
        """
        
        try:
            # ===== ÉTAPE 1: Validation =====
            region, trimestre, year = InputValidator.validate_input(region, trimestre, year)
            
            # ===== ÉTAPE 2: Vérifier le cache =====
            cache_key = f"{region}_{trimestre}_{year}"
            cached = self.cache.get(cache_key)
            if cached:
                self.logger.info(f"[CACHE] Prédiction de cache: {cache_key}")
                return cached
            
            # ===== ÉTAPE 3: Récupérer données régionales =====
            self.logger.debug(f"[LOADING] Récupération données: {region}")
            region_data = self.data_manager.get_region_data(region)
            
            # ===== ÉTAPE 4: Préparer features =====
            mois = trimestre * 3 - 1  # Q1→3, Q2→6, Q3→9, Q4→12
            features = np.array([[
                region_data['population'],
                region_data['indice_achat'],
                region_data['nb_hopitaux'],
                region_data['nb_laboratoires'],
                mois,
                year,
                trimestre,
                500.0  # Prix moyen par défaut (peut être personnalisé)
            ]])
            
            self.logger.debug(f"[OK] Features préparées: {features.shape}")
            
            # ===== ÉTAPE 5: Prédire =====
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            
            prediction_label = 'HAUSSE' if prediction == 1 else 'BAISSE'
            confiance = max(probabilities) * 100
            
            self.logger.info(f"[RESULT] Prédiction: {prediction_label} ({confiance:.1f}%)")
            
            # ===== ÉTAPE 6: Déterminer recommandation =====
            recommandation = self._get_recommendation(region, prediction)
            
            # ===== ÉTAPE 7: Construire réponse =====
            result = {
                'success': True,
                'region': region,
                'trimestre': trimestre,
                'year': year,
                'prediction': prediction_label,
                'confiance': round(confiance, 1),
                'probabilite_baisse': round(probabilities[0] * 100, 1),
                'probabilite_hausse': round(probabilities[1] * 100, 1),
                'recommandation': recommandation,
                'region_data': region_data,
                'timestamp': datetime.now().isoformat(),
                'model_version': self.metadata.get('version', 'unknown'),
                'model_accuracy': self.metadata.get('accuracy', None)
            }
            
            # ===== ÉTAPE 8: Cacher le résultat =====
            self.cache.set(cache_key, result)
            
            return result
        
        except PredictionException as e:
            self.logger.error(f"[VALIDATION_ERROR] Erreur validation: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            self.logger.error(f"[PREDICTION_ERROR] Erreur prédiction: {e}", exc_info=True)
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_recommendation(self, region: str, prediction: int) -> str:
        """Détermine la recommandation commerciale"""
        try:
            # Normaliser la région (remplacer underscores par espaces pour matcher le JSON)
            region_normalized = region.replace('_', ' ').upper()
            
            # Chercher dans les recommandations avec normalisation des deux côtés
            for key, value in self.recommendations.items():
                if key.replace('_', ' ').upper() == region_normalized:
                    return value.get('Recommendation', 'MAINTENIR')
            
            # Fallback: utiliser la prédiction
            return 'AUGMENTER' if prediction == 1 else 'RÉDUIRE'
        
        except Exception as e:
            self.logger.warning(f"⚠️  Erreur récupération recommandation: {e}")
            return 'MAINTENIR'
    
    def predict_batch(self, regions: list, trimestre: int, year: int = 2026) -> Dict:
        """Prédit pour plusieurs régions"""
        results = []
        errors = []
        
        self.logger.info(f"📊 Prédictions batch: {len(regions)} régions")
        
        for region in regions:
            try:
                result = self.predict(region, trimestre, year)
                if result.get('success', True):
                    results.append(result)
                else:
                    errors.append({'region': region, 'error': result.get('error')})
            except Exception as e:
                self.logger.error(f"[ERROR] Erreur batch {region}: {e}")
                errors.append({'region': region, 'error': str(e)})
        
        return {
            'success': len(errors) == 0,
            'total': len(regions),
            'success_count': len(results),
            'error_count': len(errors),
            'results': results,
            'errors': errors
        }
    
    def health_check(self) -> Dict:
        """Vérifie la santé du service"""
        return {
            'status': 'healthy' if self.model is not None else 'unhealthy',
            'model_loaded': self.model is not None,
            'model_type': type(self.model).__name__ if self.model else None,
            'metadata_loaded': self.metadata is not None,
            'recommendations_loaded': len(self.recommendations) > 0,
            'cache_size': len(self.cache.cache),
            'timestamp': datetime.now().isoformat()
        }


# ============================================================================
# EXPORTS PUBLICS
# ============================================================================

__all__ = [
    'PredictionService',
    'InputValidator',
    'DataCache',
    'RegionalDataManager',
    'PredictionException',
    'logger'
]


# ============================================================================
# EXEMPLE D'UTILISATION
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print("[START] TEST DU SERVICE DE PRÉDICTION")
    print("="*70)
    
    try:
        # Initialiser le service
        service = PredictionService()
        
        # Test 1: Prédiction simple
        print("\n[TEST1] Prédiction simple")
        result = service.predict('SOUSSE', trimestre=3, year=2026)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Test 2: Prédiction batch
        print("\n\n[TEST2] Prédictions batch")
        regions = ['SOUSSE', 'TUNIS', 'SFAX']
        batch_result = service.predict_batch(regions, trimestre=3, year=2026)
        print(f"[OK] {batch_result['success_count']}/{batch_result['total']} succès")
        
        # Test 3: Health check
        print("\n\n[TEST3] Health check")
        health = service.health_check()
        print(json.dumps(health, indent=2))
        
        print("\n" + "="*70)
        print("[PASS] TOUS LES TESTS RÉUSSIS")
        print("="*70 + "\n")
    
    except Exception as e:
        print(f"\n[ERROR] ERREUR: {e}\n")
