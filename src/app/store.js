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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer les actions non-sérialisables si nécessaire
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

