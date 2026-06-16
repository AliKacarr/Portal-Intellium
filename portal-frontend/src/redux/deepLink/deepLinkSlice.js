import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  route: null,      // Gidilecek sayfa (örn: 'projectList')
  deepLinkId: null, // Açılacak kayıt ID'si (örn: '15')
};

export const deepLinkSlice = createSlice({
  name: 'deepLink',
  initialState,
  reducers: {
    // Bildirime tıklandığında veriyi set eder
    setDeepLink: (state, action) => {
      state.route = action.payload.route;
      state.deepLinkId = action.payload.deepLinkId ?? null;
    },
    // İşlem bitince veriyi temizler
    clearDeepLink: (state) => {
      state.route = null;
      state.deepLinkId = null;
    },
  },
});

export const { setDeepLink, clearDeepLink } = deepLinkSlice.actions;

// Selector: State'i okumak için
export const selectDeepLink = (state) => state.deepLink;

export default deepLinkSlice.reducer;