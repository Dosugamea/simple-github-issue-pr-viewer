/**
 * 簡単な暗号化・復号化ユーティリティ
 * 注意: これは基本的な難読化であり、完全なセキュリティを提供するものではありません
 */

// 固定のソルト（実際のアプリケーションではより複雑にする）
const SALT = "github-viewer-2025"

/**
 * 文字列をBase64エンコードしてXOR暗号化
 */
export function encryptApiKey(apiKey: string): string {
  try {
    // タイムスタンプを追加してランダム性を向上
    const timestamp = Date.now().toString()
    const dataToEncrypt = `${timestamp}:${apiKey}`

    // XOR暗号化
    const encrypted = xorEncrypt(dataToEncrypt, SALT)

    // Base64エンコード
    return btoa(encrypted)
  } catch (error) {
    console.error("暗号化エラー:", error)
    return apiKey // フォールバック
  }
}

/**
 * Base64デコードしてXOR復号化
 */
export function decryptApiKey(encryptedKey: string): string {
  try {
    // Base64デコード
    const decoded = atob(encryptedKey)

    // XOR復号化
    const decrypted = xorDecrypt(decoded, SALT)

    // タイムスタンプを除去
    const parts = decrypted.split(":")
    if (parts.length >= 2) {
      return parts.slice(1).join(":") // タイムスタンプ以降を結合
    }

    return decrypted
  } catch (error) {
    console.error("復号化エラー:", error)
    return encryptedKey // フォールバック
  }
}

/**
 * XOR暗号化
 */
function xorEncrypt(text: string, key: string): string {
  let result = ""
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i)
    const keyChar = key.charCodeAt(i % key.length)
    result += String.fromCharCode(textChar ^ keyChar)
  }
  return result
}

/**
 * XOR復号化（暗号化と同じ処理）
 */
function xorDecrypt(encryptedText: string, key: string): string {
  return xorEncrypt(encryptedText, key) // XORは対称なので同じ関数
}

/**
 * APIキーの形式を検証
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // GitHub Personal Access Tokenの基本的な形式チェック
  const patterns = [
    /^ghp_[a-zA-Z0-9]{36}$/, // 新形式
    /^github_pat_[a-zA-Z0-9_]{82}$/, // Fine-grained personal access tokens
    /^[a-f0-9]{40}$/, // 旧形式（40文字の16進数）
  ]

  return patterns.some((pattern) => pattern.test(apiKey))
}

/**
 * 暗号化されたデータかどうかを判定
 */
export function isEncryptedData(data: string): boolean {
  try {
    // Base64として有効かチェック
    const decoded = atob(data)
    // タイムスタンプ形式があるかチェック
    const decrypted = xorDecrypt(decoded, SALT)
    return decrypted.includes(":") && /^\d+:/.test(decrypted)
  } catch {
    return false
  }
}

/**
 * APIキーを安全にマスク表示
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return ""

  if (apiKey.length <= 8) {
    return "*".repeat(apiKey.length)
  }

  const start = apiKey.substring(0, 4)
  const end = apiKey.substring(apiKey.length - 4)
  const middle = "*".repeat(Math.max(0, apiKey.length - 8))

  return `${start}${middle}${end}`
}
