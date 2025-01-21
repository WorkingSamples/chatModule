import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeChat: null, // ID of the currently active chat (either user or group)
  messages: [], // Array of messages for the active chat
  otherUser: null, // Other user details for one-on-one chat
  groups: [], // Array of groups the user is part of
  users: [], // List of all users for one-on-one chats
  chats: {}, // Chat history organized by chat ID (both group and one-on-one)
  usersWithChat:[],
  symmetricDecyptedKey:null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat(state, action) {
      state.activeChat = action.payload; // Active chat ID
      state.messages = state.chats[action.payload] || []; // Load messages for the active chat
    },
    setChats(state,action){
      state.chats = action.payload;
    },
    setSymmetricDecryptedKey(state,action){
      state.symmetricDecyptedKey = action.payload;
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    addMessage(state, action) { 
      const { chatId, message } = action.payload;
      if (!state.chats[chatId]) {
        state.chats[chatId] = [];
      }
      state.chats[chatId].push(message); // Append message to the correct chat
      if (state.activeChat === chatId) {
        state.messages.push(message); // Add to visible messages if the chat is active
      }
    },
    setGroups(state, action) {
      state.groups = action.payload; // Array of group details
    },
    addGroup(state, action) {
      state.groups.push(action.payload); // Add a new group
    },
    setUsers(state, action) {
      state.users = action.payload; // Array of user details
    },
    setUsersWithChat(state,action){
      state.usersWithChat = action.payload;
    },
    setOtherUser(state, action) {
      state.otherUser = action.payload; // Store the other user for one-on-one chat
    },
    addGroupMember(state, action) {
      const { groupId, member } = action.payload;
      const group = state.groups.find(group => group.id === groupId);
      if (group) {
        if (!group.members) group.members = [];
        group.members.push(member); // Add the member to the group
      }
    },
    removeGroupMember(state, action) {
      const { groupId, memberId } = action.payload;
      const group = state.groups.find(group => group.id === groupId);
      if (group && group.members) {
        group.members = group.members.filter(member => member.id !== memberId); // Remove the member from the group
      }
    },
    clearChatData() {
      return initialState; // Reset the state to its initial values
    },
  },
});

export const {
  setActiveChat,
  setChats,
  addMessage,
  setGroups,
  setUsersWithChat,
  addGroup,
  setUsers,
  setOtherUser,
  addGroupMember,
  removeGroupMember,
  setMessages,
  clearChatData,
  setSymmetricDecryptedKey
} = chatSlice.actions;

export default chatSlice.reducer;
