import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import chatReducer from './chatSlice';
import loadingReducer from './loadingSlice'
import sidebarReducer from './sidebarSlice'

const store = configureStore({
  reducer: {
    user: userReducer,
    chat:chatReducer,
    loading : loadingReducer,
    sidebar:sidebarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializability check
    }),
});

export default store;
