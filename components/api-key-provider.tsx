"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)

  useEffect(() => {
    const savedApiKey = localStorage.getItem("github-api-key")
    if (savedApiKey) {
      setApiKeyState(savedApiKey)
    }
  }, [])

  const setApiKey = (key: string) => {
    localStorage.setItem("github-api-key", key)
    setApiKeyState(key)
  }

  const clearApiKey = () => {
    localStorage.removeItem("github-api-key")
    setApiKeyState(null)
  }

  return <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey }}>{children}</ApiKeyContext.Provider>
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider")
  }
  return context
}
