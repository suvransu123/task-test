import React, { useMemo, useState } from 'react'
import { Pencil, Loader2, Plus, X } from 'lucide-react'
import type { OutputNode } from '../../../services/project.service'
import { projectService } from '../../../services/project.service'
import { Button } from '../../../components/ui/Button'

type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'json' | 'string_array'

interface EditableField {
  key: string
  type: FieldType
  /**
   * Stored as the editor value: primitives as-is, JSON values as their
   * stringified form, string_array values as a string[].
   */
  value: string | number | boolean | string[]
}

interface EditableNodeCardProps {
  node: Pick<OutputNode, 'id' | 'title' | 'content' | 'type'>
  projectId?: string
  /** Called after a successful PATCH so the renderer can refetch graph data. */
  onSaved?: () => void
  /** Extra classes for the outer wrapper that owns the relative-positioned Edit button. */
  className?: string
  /**
   * When provided, only these content keys are exposed in the editor form.
   * Untouched keys are preserved verbatim in the PATCH payload — submit still
   * sends the entire content object, just with the listed keys overwritten by
   * the user's edits. When omitted, every key in content is editable.
   */
  editableKeys?: string[]
  children: React.ReactNode
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  (value.length === 0 || value.every((item) => typeof item === 'string'))

const detectType = (value: unknown): FieldType => {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') {
    return value.length > 80 || value.includes('\n') ? 'textarea' : 'text'
  }
  if (isStringArray(value)) return 'string_array'
  return 'json'
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * Determines whether the node's content is doubly-nested ({ content: {...}, ... }).
 * Some renderers unwrap this shape, so we preserve the outer wrapper on save.
 */
const inspectContent = (
  raw: unknown,
): { editable: Record<string, unknown>; isDoubleNested: boolean; outer: Record<string, unknown> } => {
  if (!isPlainObject(raw)) {
    return { editable: {}, isDoubleNested: false, outer: {} }
  }
  if ('content' in raw && isPlainObject(raw.content)) {
    return { editable: raw.content, isDoubleNested: true, outer: raw }
  }
  return { editable: raw, isDoubleNested: false, outer: raw }
}

const toField = (key: string, value: unknown): EditableField => {
  const type = detectType(value)
  if (type === 'json') {
    return { key, type, value: JSON.stringify(value ?? null, null, 2) }
  }
  if (type === 'boolean') {
    return { key, type, value: Boolean(value) }
  }
  if (type === 'number') {
    return { key, type, value: value as number }
  }
  if (type === 'string_array') {
    return {
      key,
      type,
      value: Array.isArray(value) ? value.map((v) => String(v ?? '')) : [],
    }
  }
  return { key, type, value: (value as string | null | undefined) ?? '' }
}

const buildFields = (
  editable: Record<string, unknown>,
  keys: string[] | undefined,
  topLevelFallbacks: Record<string, unknown>,
): EditableField[] => {
  if (keys && keys.length > 0) {
    return keys.map((key) => {
      if (key in editable) return toField(key, editable[key])
      if (key in topLevelFallbacks) return toField(key, topLevelFallbacks[key])
      return toField(key, '')
    })
  }
  return Object.entries(editable).map(([key, value]) => toField(key, value))
}

export const NodeEditor: React.FC<{
  node: EditableNodeCardProps['node']
  projectId: string
  onCancel: () => void
  onSaved: () => void
  /** Restrict the form to these content keys (still sends the full merged object on save). */
  editableKeys?: string[]
}> = ({ node, projectId, onCancel, onSaved, editableKeys }) => {
  const { editable, isDoubleNested, outer } = useMemo(
    () => inspectContent(node.content),
    [node.content],
  )
  const [fields, setFields] = useState<EditableField[]>(() =>
    buildFields(editable, editableKeys, { title: node.title }),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = (idx: number, next: EditableField['value']) => {
    setFields((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], value: next }
      return copy
    })
  }

  const updateArrayItem = (fieldIdx: number, itemIdx: number, val: string) => {
    setFields((prev) => {
      const copy = [...prev]
      const arr = [...(copy[fieldIdx].value as string[])]
      arr[itemIdx] = val
      copy[fieldIdx] = { ...copy[fieldIdx], value: arr }
      return copy
    })
  }

  const addArrayItem = (fieldIdx: number) => {
    setFields((prev) => {
      const copy = [...prev]
      const arr = [...(copy[fieldIdx].value as string[]), '']
      copy[fieldIdx] = { ...copy[fieldIdx], value: arr }
      return copy
    })
  }

  const removeArrayItem = (fieldIdx: number, itemIdx: number) => {
    setFields((prev) => {
      const copy = [...prev]
      const arr = (copy[fieldIdx].value as string[]).filter((_, i) => i !== itemIdx)
      copy[fieldIdx] = { ...copy[fieldIdx], value: arr }
      return copy
    })
  }

  const handleSave = async () => {
    if (!node.id) {
      setError('Cannot save: node has no id.')
      return
    }
    setError(null)
    // Start from the existing content so any keys the user wasn't shown remain
    // intact in the PATCH payload, then overwrite the visible/edited keys.
    const newDict: Record<string, unknown> = { ...editable }
    for (const f of fields) {
      if (f.type === 'json') {
        const raw = String(f.value).trim()
        if (raw === '') {
          newDict[f.key] = null
          continue
        }
        try {
          newDict[f.key] = JSON.parse(raw)
        } catch {
          setError(`Invalid JSON for "${f.key}". Fix the value and try again.`)
          return
        }
      } else if (f.type === 'number') {
        newDict[f.key] = f.value === '' ? null : Number(f.value)
      } else if (f.type === 'boolean') {
        newDict[f.key] = Boolean(f.value)
      } else if (f.type === 'string_array') {
        // Drop empty/whitespace-only entries so a stray blank row doesn't ship.
        newDict[f.key] = (f.value as string[])
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      } else {
        newDict[f.key] = f.value
      }
    }

    const finalContent: Record<string, unknown> = isDoubleNested
      ? { ...outer, content: newDict }
      : newDict

    setSaving(true)
    try {
      const res = await projectService.updateNodeContent(projectId, node.id, finalContent)
      if (res.error) {
        setError(res.error)
        setSaving(false)
        return
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.')
      setSaving(false)
    }
  }

  return (
    <div className="col-span-full bg-background border-2 border-accent rounded-xl p-5 shadow-md">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent shrink-0">
            Editing
          </span>
          {node.title && (
            <span className="text-[14px] font-bold text-text-primary leading-tight truncate">
              {node.title}
            </span>
          )}
        </div>
        {node.id && (
          <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded shrink-0">
            {node.id}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {fields.length === 0 && (
          <div className="text-[12px] text-text-muted italic">No editable fields.</div>
        )}
        {fields.map((field, idx) => (
          <div key={field.key} className="flex items-start gap-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted pt-2 w-36 shrink-0 wrap-break-word">
              {field.key}
            </div>
            <div className="flex-1 min-w-0">
              {field.type === 'boolean' && (
                <label className="inline-flex items-center gap-2 text-[13px] text-text-primary pt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => updateField(idx, e.target.checked)}
                    className="w-4 h-4"
                  />
                  {String(field.value)}
                </label>
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value as number}
                  onChange={(e) =>
                    updateField(idx, e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full text-[13px] bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                />
              )}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={String(field.value)}
                  onChange={(e) => updateField(idx, e.target.value)}
                  className="w-full text-[13px] bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                />
              )}
              {field.type === 'textarea' && (
                <textarea
                  value={String(field.value)}
                  onChange={(e) => updateField(idx, e.target.value)}
                  rows={4}
                  className="w-full text-[13px] bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none leading-relaxed resize-y"
                />
              )}
              {field.type === 'json' && (
                <textarea
                  value={String(field.value)}
                  onChange={(e) => updateField(idx, e.target.value)}
                  rows={6}
                  spellCheck={false}
                  className="w-full text-[12px] bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none font-mono leading-relaxed resize-y"
                />
              )}
              {field.type === 'string_array' && (
                <div className="flex flex-col gap-2">
                  {(field.value as string[]).length === 0 && (
                    <div className="text-[12px] text-text-muted italic">No entries — click Add.</div>
                  )}
                  {(field.value as string[]).map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayItem(idx, itemIdx, e.target.value)}
                        className="flex-1 text-[13px] bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                      />
                      <Button
                        variant="unstyled"
                        onClick={() => removeArrayItem(idx, itemIdx)}
                        title="Remove"
                        className="p-2 text-text-muted hover:text-red-500 rounded border border-border-default"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="unstyled"
                    onClick={() => addArrayItem(idx)}
                    className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-accent border border-dashed border-accent/40 rounded-lg hover:bg-accent/5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="unstyled"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-[13px] font-bold rounded-lg border border-border-default text-text-secondary hover:bg-surface-muted disabled:opacity-50"
        >
          Cancel
        </Button>
        <Button
          variant="unstyled"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-[13px] font-bold rounded-lg bg-accent text-white hover:bg-accent-muted disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Wrap any card display with an Edit button. On click, replaces the card body
 * with an auto-generated form for the node's content. Primitives get typed
 * inputs; nested objects/arrays get a JSON textarea. Submit PATCHes the new
 * content to the backend; on success, onSaved() is invoked so the parent can
 * refetch graph data.
 */
export const EditableNodeCard: React.FC<EditableNodeCardProps> = ({
  node,
  projectId,
  onSaved,
  className = '',
  editableKeys,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false)

  if (!node?.id || !projectId) {
    return <>{children}</>
  }

  if (isEditing) {
    return (
      <NodeEditor
        node={node}
        projectId={projectId}
        editableKeys={editableKeys}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false)
          onSaved?.()
        }}
      />
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <Button
        variant="unstyled"
        onClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        title="Edit"
        className="absolute top-2 right-2 z-10 p-1.5 bg-background border border-border-default rounded-md text-text-muted hover:text-accent hover:border-accent opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      {children}
    </div>
  )
}

export default EditableNodeCard
