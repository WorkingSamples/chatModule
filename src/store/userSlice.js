import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { currentUser: null, status: null,userPvtKey:null ,usersStatus:[]},
  reducers: {
    setUser(state, action) {
      const { uid, email,displayName } = action.payload || {};
      state.currentUser = { uid, email,displayName }; // Extract only serializable fields
    },
    setStatus(state, action) {
      state.status = action.payload; // Handle status updates
    },
    setUserPvtKey(state, action) {
      state.userPvtKey = action.payload; // Handle status updates
    },
    setUsersStatus(state,action){
      state.usersStatus = action.payload
    },
    clearUser(state) {
      state.currentUser = null; // Reset currentUser to initial state
      state.status = null; // Reset status to initial state
    },
  },
});

export const { setUser, setStatus,clearUser , setUserPvtKey,setUsersStatus} = userSlice.actions;
export default userSlice.reducer;
