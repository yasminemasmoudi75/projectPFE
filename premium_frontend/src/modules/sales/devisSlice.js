import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from '../../app/axios'; // Désactivé pour mode sans backend

// Mock Data
const MOCK_DEVIS = [
  {
    Guid: 'd1',
    Prfx: 'DV',
    Nf: 20240001,
    DatUser: '2024-01-15T10:00:00',
    LibTiers: 'Société ABC',
    CodTiers: 'CLI001',
    Adresse: '123 Rue de Paris',
    Ville: 'Tunis',
    TotHT: 1500.00,
    TotTva: 285.00,
    TotRem: 0,
    NetHT: 1500.00,
    Timbre: 1.000,
    TotTTC: 1786.00,
    Valid: true,
    IsConverted: false,
    IA_Probabilite: 85,
    Remarq: 'Projet CRM complet',
    DesRepres: 'Ahmed Ben Ali'
  },
  {
    Guid: 'd2',
    Prfx: 'DV',
    Nf: 20240002,
    DatUser: '2024-02-01T14:30:00',
    LibTiers: 'Tech Solutions',
    CodTiers: 'CLI002',
    Adresse: 'zone industrielle',
    Ville: 'Sfax',
    TotHT: 5000.00,
    TotTva: 950.00,
    TotRem: 200.00,
    NetHT: 4800.00,
    Timbre: 1.000,
    TotTTC: 5751.00,
    Valid: false,
    IsConverted: false,
    IA_Probabilite: 45,
    Remarq: 'Maintenance annuelle',
    DesRepres: 'Sarah Mansour'
  },
  {
    Guid: 'd3',
    Prfx: 'DV',
    Nf: 20240003,
    DatUser: '2024-02-05T09:15:00',
    LibTiers: 'Global Import',
    CodTiers: 'CLI003',
    Adresse: 'Av. Habib Bourguiba',
    Ville: 'Sousse',
    TotHT: 12000.00,
    TotTva: 2280.00,
    TotRem: 0,
    NetHT: 12000.00,
    Timbre: 1.000,
    TotTTC: 14281.00,
    Valid: true,
    IsConverted: true,
    IA_Probabilite: 98,
    Remarq: 'Installation réseau',
    DesRepres: 'Ahmed Ben Ali'
  }
];

// État initial
const initialState = {
  devis: [],
  currentDevis: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 3,
    totalPages: 1,
  },
};

// Actions asynchrones (MOCK)
export const fetchDevis = createAsyncThunk(
  'devis/fetchDevis',
  async ({ page = 1, limit = 10, filters = {} }) => {
    // Simulation réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: MOCK_DEVIS,
      pagination: {
        page: 1,
        limit: 10,
        total: MOCK_DEVIS.length,
        totalPages: 1
      }
    };
  }
);

export const fetchDevisById = createAsyncThunk('devis/fetchDevisById', async (id) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const devis = MOCK_DEVIS.find(d => d.Guid === id);
  if (!devis) throw new Error('Devis non trouvé');
  return devis;
});

export const createDevis = createAsyncThunk('devis/createDevis', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...data, Guid: 'mock-' + Date.now(), DatUser: new Date().toISOString() };
});

export const updateDevis = createAsyncThunk('devis/updateDevis', async ({ id, data }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...data, Guid: id };
});

export const deleteDevis = createAsyncThunk('devis/deleteDevis', async (id) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return id;
});

export const validateDevis = createAsyncThunk('devis/validateDevis', async (id) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const devis = MOCK_DEVIS.find(d => d.Guid === id);
  return { ...devis, Valid: true };
});

export const convertDevis = createAsyncThunk('devis/convertDevis', async (id) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const devis = MOCK_DEVIS.find(d => d.Guid === id);
  return { ...devis, Valid: true, IsConverted: true };
});

// Slice
const devisSlice = createSlice({
  name: 'devis',
  initialState,
  reducers: {
    clearCurrentDevis: (state) => {
      state.currentDevis = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Devis
      .addCase(fetchDevis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevis.fulfilled, (state, action) => {
        state.loading = false;
        state.devis = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Devis By ID
      .addCase(fetchDevisById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevisById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDevis = action.payload;
      })
      .addCase(fetchDevisById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create Devis
      .addCase(createDevis.fulfilled, (state, action) => {
        state.devis.unshift(action.payload);
      })

      // Update Devis
      .addCase(updateDevis.fulfilled, (state, action) => {
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
        }
      })

      // Delete Devis
      .addCase(deleteDevis.fulfilled, (state, action) => {
        state.devis = state.devis.filter((d) => d.Guid !== action.payload);
      })

      // Validate Devis
      .addCase(validateDevis.fulfilled, (state, action) => {
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
        }
      })

      // Convert Devis
      .addCase(convertDevis.fulfilled, (state, action) => {
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
        }
      });
  },
});

export const { clearCurrentDevis, clearError } = devisSlice.actions;
export default devisSlice.reducer;

