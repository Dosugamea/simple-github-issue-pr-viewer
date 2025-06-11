"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { encryptApiKey, decryptApiKey, isEncryptedData, validateApiKeyFormat } from "@/lib/crypto-utils"

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  isValidKey: boolean
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

const STORAGE_KEY = "star"

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isValidKey, setIsValidKey] = useState(false)

  useEffect(() => {
    loadApiKey()
  }, [])

  const loadApiKey = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        let decryptedKey: string

        if (isEncryptedData(savedData)) {
          // 暗号化されたデータを復号化
          decryptedKey = decryptApiKey(savedData)
        } else {
          // 旧形式の平文データ（マイグレーション）
          decryptedKey = savedData
          // 暗号化して再保存
          const encrypted = encryptApiKey(decryptedKey)
          localStorage.setItem(STORAGE_KEY, encrypted)
          console.log("APIキーを暗号化形式に移行しました")
        }

        if (validateApiKeyFormat(decryptedKey)) {
          setApiKeyState(decryptedKey)
          setIsValidKey(true)
        } else {
          console.warn("保存されたAPIキーの形式が無効です")
          clearApiKey()
        }
      }
    } catch (error) {
      console.error("APIキーの読み込みエラー:", error)
      clearApiKey()
    }
  }

  const setApiKey = (key: string) => {
    try {
      const trimmedKey = key.trim()

      if (!validateApiKeyFormat(trimmedKey)) {
        throw new Error("APIキーの形式が無効です")
      }

      const encrypted = encryptApiKey(trimmedKey)
      localStorage.setItem(STORAGE_KEY, encrypted)
      setApiKeyState(trimmedKey)
      setIsValidKey(true)
    } catch (error) {
      console.error("APIキーの保存エラー:", error)
      throw error
    }
  }

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    // 旧形式のキーも削除（マイグレーション対応）
    localStorage.removeItem("github-api-key")
    setApiKeyState(null)
    setIsValidKey(false)
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey, isValidKey }}>{children}</ApiKeyContext.Provider>
  )
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider")
  }
  return context
}
