import yaml from 'js-yaml'

/**
 * Unescapes double-escaped strings from JSON/API.
 */
export const unescapeString = (str: string) => {
  try {
    return str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'")
  } catch {
    return str
  }
}

/**
 * Attempts to parse a string as JSON or YAML.
 */
export const parseContent = (content: any): any => {
  if (typeof content !== 'string') return content

  const trimmed = content.trim()

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      /* Fall through */
    }
  }

  if (trimmed.includes(': ') || trimmed.startsWith('- ')) {
    try {
      const parsed = yaml.load(trimmed)
      if (typeof parsed === 'object' && parsed !== null) return parsed
    } catch {
      /* Fall through */
    }
  }

  return unescapeString(trimmed)
}

/**
 * Formats keys from snake_case to Title Case.
 */
export const formatKey = (key: string) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * If `raw` is an object with a "content" key, returns that inner value.
 * Otherwise returns `raw` as-is.
 * Used to unwrap { content: ... } wrappers before rendering or exporting.
 */
export const resolveContent = (raw: any): any =>
  raw !== null &&
  typeof raw === 'object' &&
  !Array.isArray(raw) &&
  'content' in raw
    ? raw.content
    : raw

/**
 * Returns the formatted first key of a document's parsed content,
 * used as the tab label. Falls back to `fallback` if content is not an object.
 */
export const getTabLabel = (
  rawDocumentContent: any,
  fallback: string,
): string => {
  const resolved = resolveContent(rawDocumentContent)
  const parsed = parseContent(resolved)
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const firstKey = Object.keys(parsed).find(
      (k) => !['id', '_id', '__v'].includes(k),
    )
    if (firstKey) return formatKey(firstKey)
  }
  return fallback
}

/**
 * Converts a parsed document value into a human-readable plain-text string
 * suitable for clipboard copy or file download.
 */
export const contentToText = (value: any, depth = 0): string => {
  const parsed = parseContent(value)
  const indent = '  '.repeat(depth)

  if (parsed === null || parsed === undefined) return ''

  if (typeof parsed !== 'object') {
    return unescapeString(String(parsed))
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => `${indent}- ${contentToText(item, depth + 1)}`)
      .join('\n')
  }

  return Object.entries(parsed)
    .filter(([k]) => !['id', '_id', '__v'].includes(k))
    .map(([k, v]) => {
      const heading = `${indent}${formatKey(k)}`
      const body = contentToText(v, depth + 1)
      return `${heading}\n${body}`
    })
    .join('\n\n')
}
