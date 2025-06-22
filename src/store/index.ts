import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import analyticsReducer from './slices/analyticsSlice';
import type { RootState } from '../types';

export const store = configureStore({
  reducer: {
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for date objects
    }),
});

// Typed hooks for use throughout the app
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
