export function collectText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(collectText).join('\n')
  if (typeof value !== 'object') return ''

  const record = value as Record<string, unknown>
  if (typeof record.text === 'string') return record.text
  if (typeof record.output_text === 'string') return record.output_text
  if (typeof record.content === 'string') return record.content
  return Object.values(record).map(collectText).join('\n')
}

function hasTerminalSseEvent(text: string): boolean {
  for (const block of text.split(/\n\n+/)) {
    const dataLine = block
      .split('\n')
      .find((line) => line.startsWith('data: '))
    if (!dataLine) continue

    const data = dataLine.slice('data: '.length).trim()
    if (data === '[DONE]') return true

    try {
      const event = JSON.parse(data) as { type?: string }
      if (
        event.type === 'response.completed' ||
        event.type === 'response.failed' ||
        event.type === 'error'
      ) {
        return true
      }
    } catch {
      // Keep reading while a streamed event is incomplete.
    }
  }

  return false
}

export async function readResponseBody(response: Response): Promise<string> {
  if (!response.body) return response.text()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })

      if (hasTerminalSseEvent(text)) {
        await reader.cancel().catch(() => undefined)
        break
      }
    }
  } finally {
    text += decoder.decode()
    reader.releaseLock()
  }

  return text
}

function collectSseOutputText(sseText: string): string {
  let output = ''

  for (const block of sseText.split(/\n\n+/)) {
    const dataLine = block
      .split('\n')
      .find((line) => line.startsWith('data: '))
    if (!dataLine) continue

    const data = dataLine.slice('data: '.length)
    if (data === '[DONE]') continue

    try {
      const event = JSON.parse(data) as {
        type?: string
        delta?: string
        response?: unknown
        error?: { message?: string; code?: string }
        message?: string
      }

      if (event.type === 'response.failed' || event.type === 'error') {
        throw new Error(
          event.error?.message ??
            event.message ??
            event.error?.code ??
            'Model call failed.',
        )
      }

      if (
        event.type === 'response.output_text.delta' &&
        typeof event.delta === 'string'
      ) {
        output += event.delta
      } else if (event.type === 'response.completed' && !output) {
        output = collectText(event.response)
      }
    } catch (error) {
      if (error instanceof SyntaxError) continue
      throw error
    }
  }

  return output
}

export function collectResponseText(text: string): string {
  const streamed = collectSseOutputText(text)
  if (streamed) return streamed

  const json = JSON.parse(text) as { output_text?: string; output?: unknown }
  return json.output_text ?? collectText(json.output)
}
