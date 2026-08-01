import type { DeveloperKey } from './developer-keys.types.js'

const developerKeys = new Map<string, DeveloperKey>()

export function saveDeveloperKey(key: DeveloperKey): DeveloperKey {
  developerKeys.set(key.id, key)
  return key
}

export function getDeveloperKeyById(id: string): DeveloperKey | undefined {
  return developerKeys.get(id)
}

export function listDeveloperKeysByWorkspace(
  workspaceId: string
): DeveloperKey[] {
  return Array.from(developerKeys.values()).filter(
    (key) => key.workspaceId === workspaceId
  )
}

export function updateDeveloperKey(
  id: string,
  updates: Partial<Omit<DeveloperKey, 'id' | 'createdAt'>>
): DeveloperKey | undefined {
  const existing = developerKeys.get(id)

  if (!existing) {
    return undefined
  }

  const updated: DeveloperKey = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  developerKeys.set(id, updated)
  return updated
}