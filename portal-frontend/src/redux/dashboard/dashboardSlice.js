import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRoute: '', // Şu an gösterilen sayfa
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Sayfa değiştirme işlemi
    setCurrentRoute: (state, action) => {
      state.currentRoute = action.payload;
    },
    // Sayfayı sıfırlama
    resetCurrentRoute: (state) => {
      state.currentRoute = '';
    },
  },
});

export const { setCurrentRoute, resetCurrentRoute } = dashboardSlice.actions;

// Selector: State'i okumak için
export const selectCurrentRoute = (state) => state.dashboard.currentRoute;

export default dashboardSlice.reducer;