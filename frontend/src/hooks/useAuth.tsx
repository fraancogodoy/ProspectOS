import { createContext, useContext } from "react"

export interface AuthContextValue {
  authHabilitada: boolean
  usuario: string | null
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  authHabilitada: false,
  usuario: null,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
