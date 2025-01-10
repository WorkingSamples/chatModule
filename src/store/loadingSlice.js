import { createSlice } from '@reduxjs/toolkit';

const loadingSlice = createSlice({
  name: 'loading',
  initialState: {
    users: false,
    chats: false,
    groups: false,
    participants:false
  },
  reducers: {
    setLoading(state, action) {
      const { key, value } = action.payload; // e.g., { key: 'users', value: true }
      if (state[key] !== undefined) {
        state[key] = value;
      }
    },
  },
});

export const { setLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
