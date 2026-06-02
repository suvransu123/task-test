/**
 * MentionLookup — Single Responsibility utility.
 * Maps each MetadataPanel tab to a key-extractor function that returns
 * the list of primary keys available for @mention autocomplete.
 */

type KeyExtractor = (documentData: any) => string[]

// ─── Per-tab extractors ───────────────────────────────────────────────────────

const extractBriefKeys: KeyExtractor = (data) => {
  if (!data) return ['Problem Statement', 'Proposed Solutions', 'Stakeholders']
  const keys: string[] = []
  if (data.problem_statement !== undefined) keys.push('Problem Statement')
  if (data.solutions !== undefined) keys.push('Proposed Solutions')
  if (data.stakeholders !== undefined) {
    keys.push('Stakeholders')
    if (Array.isArray(data.stakeholders)) {
      data.stakeholders.forEach((s: any) => {
        const name = s?.stakeholder ?? s?.name
        if (typeof name === 'string' && name) keys.push(name)
      })
    }
  }
  return keys.length > 0
    ? keys
    : ['Problem Statement', 'Proposed Solutions', 'Stakeholders']
}

const extractGoalsKeys: KeyExtractor = (data) => {
  if (!data) return []
  const goals = data?.goals ?? data
  if (typeof goals === 'object' && !Array.isArray(goals) && goals !== null) {
    return Object.keys(goals)
  }
  return []
}

const extractUserStoriesKeys: KeyExtractor = (data) => {
  if (!data) return []
  const stories = data?.user_stories ?? data
  if (
    typeof stories === 'object' &&
    !Array.isArray(stories) &&
    stories !== null
  ) {
    return Object.keys(stories)
  }
  return []
}

const extractFRKeys: KeyExtractor = (data) => {
  if (!data) return []
  const keys: string[] = []
  const fr = data?.functional_requirements
  const nfr = data?.non_functional_requirements
  if (fr && typeof fr === 'object' && !Array.isArray(fr)) {
    keys.push(...Object.keys(fr))
  }
  if (nfr && typeof nfr === 'object' && !Array.isArray(nfr)) {
    keys.push(...Object.keys(nfr))
  }
  return keys
}

// ─── Shared markdown heading extractor ───────────────────────────────────────
// Used as a fallback when document content is a prose Markdown string
// rather than a parsed JSON/YAML object.
const HEADING_RE = /^#{1,3}\s+(.+)$/gm

const extractMarkdownHeadings = (text: string): string[] => {
  const headings: string[] = []
  let m: RegExpExecArray | null
  // Reset lastIndex because the regex is stateful (global flag)
  HEADING_RE.lastIndex = 0
  while ((m = HEADING_RE.exec(text)) !== null) {
    const heading = m[1].trim()
    if (heading) headings.push(heading)
  }
  return headings
}

const extractArchitectureKeys: KeyExtractor = (data) => {
  if (!data) return []
  const arch = data?.architecture ?? data?.architecture_design ?? data
  // Case 1: parsed object — use top-level keys
  if (typeof arch === 'object' && !Array.isArray(arch) && arch !== null) {
    return Object.keys(arch).map((k) => k.replace(/_/g, ' '))
  }
  // Case 2: raw Markdown string — extract headings
  if (typeof arch === 'string') {
    return extractMarkdownHeadings(arch)
  }
  return []
}

const extractTechStackKeys: KeyExtractor = (data) => {
  if (!data) return []
  const tech = data?.technology_stack ?? data?.tech_stack ?? data
  // Case 1: parsed object — use top-level category keys
  if (typeof tech === 'object' && !Array.isArray(tech) && tech !== null) {
    return Object.keys(tech).map((k) => k.replace(/_/g, ' '))
  }
  // Case 2: raw Markdown string — extract headings
  if (typeof tech === 'string') {
    return extractMarkdownHeadings(tech)
  }
  return []
}

// ─── Tab → Extractor registry ─────────────────────────────────────────────────

const TAB_EXTRACTORS: Record<string, KeyExtractor> = {
  Brief: extractBriefKeys,
  Goals: extractGoalsKeys,
  'User Stories': extractUserStoriesKeys,
  'Functional Requirements': extractFRKeys,
  'Architecture Design': extractArchitectureKeys,
  'Technology Stack': extractTechStackKeys,
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the list of mentionable keys for a given tab and document content.
 * @param tabName  - The active tab name in MetadataPanel (e.g. "Brief", "Goals")
 * @param documentData - The parsed document content for that tab
 */
export function extractMentionKeys(
  tabName: string,
  documentData: any,
): string[] {
  const extractor = TAB_EXTRACTORS[tabName]
  if (!extractor) return []
  try {
    return extractor(documentData)
  } catch {
    return []
  }
}
