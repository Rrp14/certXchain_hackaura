import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  userType: localStorage.getItem('userType') || null,
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, userType } = action.payload;
      state.token = token;
      state.userType = userType;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('userType', userType);
    },
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer; 