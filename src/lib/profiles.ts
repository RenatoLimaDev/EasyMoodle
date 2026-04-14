import type { Profile, CodeSegments, ConvertOptions } from '@/types'

const KEY = 'moodle_converter_profiles'

export function readProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function saveProfile(name: string, segments: CodeSegments, options: Partial<ConvertOptions>): void {
  const profiles = readProfiles()
  const id  = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const idx = profiles.findIndex(p => p.name === name)
  const profile: Profile = { id, name, segments, options, createdAt: Date.now() }
  if (idx >= 0) profiles[idx] = profile
  else profiles.push(profile)
  localStorage.setItem(KEY, JSON.stringify(profiles))
}

export function deleteProfile(id: string): void {
  const profiles = readProfiles().filter(p => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(profiles))
}
