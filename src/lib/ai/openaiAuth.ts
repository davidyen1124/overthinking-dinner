import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

type CodexAuth = {
  auth_mode?: string
  tokens?: {
    access_token?: string
    account_id?: string
  }
}

export type CodexChatGptAuth = {
  token: string
  accountId: string
  baseUrl: 'https://chatgpt.com/backend-api/codex'
}

export async function getCodexChatGptAuth(): Promise<CodexChatGptAuth> {
  const authPath = path.join(os.homedir(), '.codex', 'auth.json')
  const raw = await readFile(authPath, 'utf8')
  const auth = JSON.parse(raw) as CodexAuth

  if (
    auth.auth_mode === 'chatgpt' &&
    auth.tokens?.access_token &&
    auth.tokens.account_id
  ) {
    return {
      token: auth.tokens.access_token,
      accountId: auth.tokens.account_id,
      baseUrl: 'https://chatgpt.com/backend-api/codex',
    }
  }

  throw new Error('No usable Codex ChatGPT auth found in ~/.codex/auth.json.')
}
