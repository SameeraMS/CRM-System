import { createSlice } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  globalLoading: boolean
}

const initialState: UIState = {
  sidebarOpen: true,
  globalLoading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: { payload: boolean }) => {
      state.sidebarOpen = action.payload
    },
    setGlobalLoading: (state, action: { payload: boolean }) => {
      state.globalLoading = action.payload
    },
  },
})

export const { toggleSidebar, setSidebarOpen, setGlobalLoading } = uiSlice.actions
export default uiSlice.reducer
