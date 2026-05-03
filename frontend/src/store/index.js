import { create } from 'zustand'

const useStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (userData, token) => set({ 
    user: userData, 
    token: token, 
    isAuthenticated: true 
  }),
  
  logout: () => set({ 
    user: null, 
    token: null, 
    isAuthenticated: false 
  }),
  
  updatePoints: (points) => set((state) => ({
    user: state.user ? { ...state.user, total_points: state.user.total_points + points } : null
  }))
}))

export default useStore
