import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../auth/authSlice';
import devisReducer from '../modules/sales/devisSlice';
import projetReducer from '../modules/crm/projetSlice';
import activiteReducer from '../modules/activities/activiteSlice';
import objectifReducer from '../modules/goals/objectifSlice';
import messageReducer from '../modules/messaging/messageSlice';
import iaReducer from '../modules/ai-engine/iaSlice';
import bcvReducer from '../modules/sales/bcvSlice';
import blvReducer from '../modules/sales/blvSlice';
import favReducer from '../modules/sales/favSlice';
import adminReducer from '../modules/admin/adminSlice';
import predictionReducer from '../modules/sales/predictionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    devis: devisReducer,
    projets: projetReducer,
    activites: activiteReducer,
    objectifs: objectifReducer,
    messages: messageReducer,
    ia: iaReducer,
    bcv: bcvReducer,
    blv: blvReducer,
    fav: favReducer,
    admin: adminReducer,
    prediction: predictionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Garder les checks en dev mais éviter les warnings coûteux sur de gros payloads.
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: [
          'devis.devis',
          'devis.currentDevis',
          'projets.projets',
          'activites.activites',
          'bcv.bcv',
          'blv.blv',
          'fav.fav',
          'prediction.predictions',
          'prediction.currentPrediction',
        ],
        warnAfter: 256,
      },
      immutableCheck: {
        warnAfter: 128,
      }
    }),
  devTools: import.meta.env.MODE !== 'production',
});

