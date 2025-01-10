import { createSlice } from "@reduxjs/toolkit";

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState: {
        users: false,
        chats: false,
        groups: false
    },
    reducers: {
        setSidebarOption(state, action) {
            const { key, value } = action.payload; // e.g., { key: 'users', value: true }
            
             // If the value is true, reset all sidebar options to false
             if (value) {
                for (let option in state) {
                    state[option] = false; // Set all options to false
                }
            }
            
            if (state[key] !== undefined) {
                state[key] = value;
            }
        }
    }
})

export const {setSidebarOption} = sidebarSlice.actions
export default sidebarSlice.reducer 