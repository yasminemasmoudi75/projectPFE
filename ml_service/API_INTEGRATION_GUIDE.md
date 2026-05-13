# 🚀 API SERVICE - GUIDE COMPLET D'INTÉGRATION

**Version:** 1.3.0  
**Status:** Production-Ready ✅  
**Date:** Mai 2026

---

## 📑 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation](#installation)
3. [Architecture](#architecture)
4. [Endpoints REST](#endpoints-rest)
5. [Intégration React](#intégration-react)
6. [Déploiement](#déploiement)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Ce service expose le modèle ML de prédiction commerciale via une **API REST** production-ready avec:

- ✅ Validation complète des inputs
- ✅ Gestion d'erreurs robuste
- ✅ System de cache (5 min TTL)
- ✅ Logging détaillé
- ✅ Tests unitaires complets
- ✅ Documentation Swagger-ready
- ✅ Support batch pour plusieurs régions

---

## 📦 Installation

### Étape 1: Vérifier les prérequis

```bash
# Python 3.8+
python --version  # Doit afficher 3.8+

# Modèles ML générés
ls ml_service/model/
# Doit contenir:
# - predict_ventes_regions_v1.3.pkl
# - metadata_v1.3.json
# - regional_recommendations.json

# Données régionales
ls gouvernorats_reference.csv
```

### Étape 2: Installation des dépendances

```bash
# Option 1: Quick start (recommandé)
cd ml_service
python quick_start.py

# Option 2: Manuel
pip install -r ml_service/requirements.txt
```

### Étape 3: Configuration

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres (optionnel)
# Défauts OK pour développement
```

### Étape 4: Démarrer le service

```bash
# Option 1: Via quick start
python ml_service/quick_start.py

# Option 2: Démarrer Flask directement
python ml_service/flask_api.py

# Option 3: Production (avec Gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 ml_service.flask_api:app
```

Le service démarre sur **http://localhost:5000**

---

## 🏗️ Architecture

### Composants

```
┌─────────────────────────────────────────────────┐
│         FLASK API (flask_api.py)                │
│  ├─ GET /api/health                            │
│  ├─ GET /api/regions                           │
│  ├─ POST /api/predict                          │
│  └─ POST /api/batch-predict                    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    PREDICTION SERVICE (predict_api.py)          │
│  ├─ PredictionService (orchestrateur)          │
│  ├─ InputValidator (validation)                │
│  ├─ RegionalDataManager (données)              │
│  └─ DataCache (cache 5 min)                    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    MODÈLES & DONNÉES (fichiers .pkl, .csv)     │
│  ├─ predict_ventes_regions_v1.3.pkl            │
│  ├─ governmental_reference.csv (24 régions)    │
│  ├─ metadata_v1.3.json                         │
│  └─ regional_recommendations.json              │
└─────────────────────────────────────────────────┘
```

---

## 🔌 Endpoints REST

### 1. GET `/api/health`

**Santé du service**

```bash
curl http://localhost:5000/api/health
```

**Réponse:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "GradientBoostingClassifier",
  "metadata_loaded": true,
  "recommendations_loaded": true,
  "cache_size": 5,
  "timestamp": "2026-05-11T10:30:00"
}
```

---

### 2. GET `/api/regions`

**Liste des régions valides**

```bash
curl http://localhost:5000/api/regions
```

**Réponse:**
```json
{
  "success": true,
  "count": 24,
  "regions": [
    "ARIANA", "BEJA", "BEN_AROUS", "BIZERTE", "DJERBA",
    "GAFSA", "GABES", "JENDOUBA", "KASSERINE", "KAIROUAN",
    "KEBILI", "KEF", "MAHDIA", "MANOUBA", "MEDENINE",
    "MONASTIR", "NABEUL", "SFAX", "SIDI_BOUZID", "SOUSSE",
    "TATAOUINE", "TOZEUR", "TUNIS", "ZAGHOUAN"
  ]
}
```

---

### 3. POST `/api/predict`

**Prédiction pour une région**

**Request:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "region": "SOUSSE",
    "trimestre": 3,
    "year": 2026
  }'
```

**Parameters:**
| Param | Type | Requis | Valeurs | Défaut |
|-------|------|--------|---------|--------|
| region | string | ✅ | 24 régions tunisiennes | - |
| trimestre | int | ✅ | 1, 2, 3, 4 | - |
| year | int | ❌ | 2020-2030 | 2026 |

**Réponse (Succès):**
```json
{
  "success": true,
  "region": "SOUSSE",
  "trimestre": 3,
  "year": 2026,
  "prediction": "HAUSSE",
  "confiance": 76.8,
  "probabilite_baisse": 23.2,
  "probabilite_hausse": 76.8,
  "recommandation": "AUGMENTER",
  "region_data": {
    "region": "SOUSSE",
    "population": 680000,
    "indice_achat": 1.3,
    "nb_hopitaux": 10,
    "nb_laboratoires": 36
  },
  "timestamp": "2026-05-11T10:30:00",
  "model_version": "1.3.0",
  "model_accuracy": 0.7438
}
```

**Réponse (Erreur):**
```json
{
  "success": false,
  "error": "Region invalide: 'INVALID'. Régions valides: ARIANA, BEJA, ...",
  "timestamp": "2026-05-11T10:30:00"
}
```

**Status codes:**
- `200`: Prédiction réussie
- `400`: Erreur validation (région/trimestre invalide)
- `503`: Service indisponible

---

### 4. POST `/api/batch-predict`

**Prédictions pour plusieurs régions**

**Request:**
```bash
curl -X POST http://localhost:5000/api/batch-predict \
  -H "Content-Type: application/json" \
  -d '{
    "regions": ["SOUSSE", "TUNIS", "SFAX"],
    "trimestre": 3,
    "year": 2026
  }'
```

**Parameters:**
| Param | Type | Requis | Notes |
|-------|------|--------|-------|
| regions | array | ✅ | Max 24 régions |
| trimestre | int | ✅ | 1-4 |
| year | int | ❌ | Défaut 2026 |

**Réponse:**
```json
{
  "success": true,
  "total": 3,
  "success_count": 3,
  "error_count": 0,
  "results": [
    {
      "success": true,
      "region": "SOUSSE",
      "prediction": "HAUSSE",
      "recommandation": "AUGMENTER",
      ...
    },
    ...
  ],
  "errors": []
}
```

---

### 5. GET `/api/stats`

**Statistiques du service**

```bash
curl http://localhost:5000/api/stats
```

**Réponse:**
```json
{
  "success": true,
  "cache_size": 5,
  "model_type": "GradientBoostingClassifier",
  "model_accuracy": 0.7438,
  "model_f1_score": 0.7298,
  "regions_total": 24,
  "recommendations_loaded": 24
}
```

---

## 🌐 Intégration React

### Installation

```bash
# Ajouter au package.json
npm install axios

# Ou utiliser fetch (built-in)
```

### Exemple 1: Hook personnalisé

```javascript
// hooks/usePrediction.js

import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const usePrediction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = async (region, trimestre, year = 2026) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        region,
        trimestre,
        year
      });
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchPredict = async (regions, trimestre, year = 2026) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/batch-predict`, {
        regions,
        trimestre,
        year
      });
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { predict, batchPredict, loading, error };
};
```

### Exemple 2: Composant React

```javascript
// components/RegionPrediction.jsx

import { useState } from 'react';
import { usePrediction } from '../hooks/usePrediction';

export const RegionPrediction = () => {
  const [region, setRegion] = useState('SOUSSE');
  const [result, setResult] = useState(null);
  const { predict, loading, error } = usePrediction();

  const handlePredict = async () => {
    try {
      const data = await predict(region, 3, 2026);
      setResult(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="prediction-form">
      <h2>Prédiction Commerciale</h2>
      
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="SOUSSE">SOUSSE</option>
        <option value="TUNIS">TUNIS</option>
        <option value="SFAX">SFAX</option>
        {/* ... autres régions */}
      </select>
      
      <button onClick={handlePredict} disabled={loading}>
        {loading ? 'Chargement...' : 'Prédire'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result?.success && (
        <div className="result">
          <p><strong>Région:</strong> {result.region}</p>
          <p><strong>Prédiction:</strong> {result.prediction}</p>
          <p><strong>Confiance:</strong> {result.confiance}%</p>
          <p><strong>Recommandation:</strong> {result.recommandation}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 🚀 Déploiement

### Production avec Gunicorn

```bash
# Installer
pip install gunicorn

# Démarrer (4 workers)
gunicorn -w 4 -b 0.0.0.0:5000 ml_service.flask_api:app

# Avec auto-reload en dev
gunicorn -w 4 -b 0.0.0.0:5000 --reload ml_service.flask_api:app
```

### Docker (optionnel)

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY ml_service/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "ml_service.flask_api:app"]
```

```bash
# Build & Run
docker build -t ml-prediction .
docker run -p 5000:5000 ml-prediction
```

### NGINX (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/ml-prediction

server {
    listen 80;
    server_name api.prediction.tn;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🐛 Troubleshooting

### Erreur: "Modèle non trouvé"

```
❌ Erreur: Modèle ML introuvable: ./ml_service/model/predict_ventes_regions_v1.3.pkl
```

**Solution:**
```bash
# Vérifier que le fichier existe
ls ml_service/model/predict_ventes_regions_v1.3.pkl

# Sinon, réexécuter le notebook ML
jupyter notebook ML_VENTES_PREDICTION_REGIONS_CORRECT_V1.3.ipynb
```

---

### Erreur: "Region invalide"

```
❌ Erreur: Region invalide: 'INVALID_REGION'
```

**Solution:**
```bash
# Vérifier la liste des régions valides
curl http://localhost:5000/api/regions

# Utiliser un nom exact
curl -X POST http://localhost:5000/api/predict \
  -d '{"region":"SOUSSE","trimestre":3}'
```

---

### Erreur: "Port 5000 déjà utilisé"

```
OSError: [Errno 48] Address already in use
```

**Solution:**
```bash
# Trouver le processus
lsof -i :5000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
export FLASK_PORT=5001
python ml_service/flask_api.py
```

---

### Erreur CORS (Frontend)

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Le service inclut CORS par défaut. Si vous avez toujours des problèmes:

```python
# Dans flask_api.py, ajouter:
from flask_cors import CORS
CORS(app, origins=["http://localhost:3000"])
```

---

## 📊 Tests

```bash
# Exécuter tous les tests
pytest ml_service/test_predict_api.py -v

# Tests spécifiques
pytest ml_service/test_predict_api.py::TestInputValidator -v

# Avec couverture
pytest ml_service/test_predict_api.py --cov=ml_service

# Verbose + detailed output
pytest ml_service/test_predict_api.py -vv --tb=short
```

---

## 📈 Performance

| Métrique | Valeur |
|----------|--------|
| Temps prédiction | < 100ms |
| Temps batch (5 régions) | < 500ms |
| Cache hit rate | 70%+ |
| Accuracy modèle | 74.38% |
| F1-Score | 0.7298 |

---

## 📚 Documentation complète

Pour plus d'informations:
- [predict_api.py](predict_api.py) - Code service détaillé
- [flask_api.py](flask_api.py) - Code Flask détaillé
- [test_predict_api.py](test_predict_api.py) - Tests unitaires
- [DOCUMENTATION_HYBRID_API_SQL_SERVICE.md](../DOCUMENTATION_HYBRID_API_SQL_SERVICE.md) - Documentation ML

---

**Version:** 1.3.0  
**Status:** Production-Ready ✅  
**Last Updated:** Mai 11, 2026
