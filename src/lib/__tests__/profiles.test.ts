import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readProfiles, saveProfile, deleteProfile } from '../profiles'

// ── Mock de localStorage para ambiente Node ───────────────────────────────────

const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
  getItem:    (key: string) => mockStorage[key] ?? null,
  setItem:    (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] },
  clear:      () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
  length:     0,
  key:        (_: number) => null,
}

vi.stubGlobal('localStorage', mockLocalStorage)

const baseSegments = { prod: '001', ano: '261', unit: '1', mod: '2', tipo: 'O' as const }
const baseOptions  = { penalty: '0', shuffle: true, prefix: 'Questão' }

beforeEach(() => {
  mockLocalStorage.clear()
})

// ── readProfiles — estado inicial ─────────────────────────────────────────────

describe('readProfiles — estado inicial', () => {
  it('retorna array vazio quando não há perfis salvos', () => {
    expect(readProfiles()).toEqual([])
  })

  it('retorna array vazio para JSON inválido no storage', () => {
    mockStorage['moodle_converter_profiles'] = 'json inválido {'
    expect(readProfiles()).toEqual([])
  })

  it('retorna array vazio para valor null no storage', () => {
    expect(readProfiles()).toEqual([])
  })
})

// ── saveProfile — criar e recuperar ──────────────────────────────────────────

describe('saveProfile — criar e recuperar', () => {
  it('salva um perfil e o recupera com readProfiles', () => {
    saveProfile('Meu Perfil', baseSegments, baseOptions)
    const profiles = readProfiles()
    expect(profiles).toHaveLength(1)
    expect(profiles[0].name).toBe('Meu Perfil')
  })

  it('salva múltiplos perfis distintos', () => {
    saveProfile('Perfil A', baseSegments, baseOptions)
    saveProfile('Perfil B', { ...baseSegments, prod: '002' }, baseOptions)
    expect(readProfiles()).toHaveLength(2)
  })

  it('substitui perfil com mesmo nome', () => {
    saveProfile('Duplicado', baseSegments, baseOptions)
    saveProfile('Duplicado', { ...baseSegments, prod: '999' }, {})
    const profiles = readProfiles()
    expect(profiles).toHaveLength(1)
    expect(profiles[0].segments.prod).toBe('999')
  })

  it('cada perfil recebe um id único', () => {
    saveProfile('P1', baseSegments, baseOptions)
    saveProfile('P2', baseSegments, baseOptions)
    const [p1, p2] = readProfiles()
    expect(p1.id).toBeTruthy()
    expect(p2.id).toBeTruthy()
    expect(p1.id).not.toBe(p2.id)
  })

  it('perfil salvo possui campo createdAt numérico', () => {
    saveProfile('Perfil', baseSegments, baseOptions)
    const [p] = readProfiles()
    expect(typeof p.createdAt).toBe('number')
    expect(p.createdAt).toBeGreaterThan(0)
  })

  it('persiste os segments corretamente', () => {
    saveProfile('Perfil', baseSegments, baseOptions)
    expect(readProfiles()[0].segments).toEqual(baseSegments)
  })

  it('persiste as options corretamente', () => {
    saveProfile('Perfil', baseSegments, baseOptions)
    expect(readProfiles()[0].options).toEqual(baseOptions)
  })

  it('id começa com p_', () => {
    saveProfile('Perfil', baseSegments, baseOptions)
    expect(readProfiles()[0].id).toMatch(/^p_/)
  })
})

// ── deleteProfile — remover ───────────────────────────────────────────────────

describe('deleteProfile — remover', () => {
  it('remove perfil pelo id', () => {
    saveProfile('Para remover', baseSegments, baseOptions)
    const [profile] = readProfiles()
    deleteProfile(profile.id)
    expect(readProfiles()).toHaveLength(0)
  })

  it('não afeta outros perfis ao remover um', () => {
    saveProfile('Manter', baseSegments, baseOptions)
    saveProfile('Remover', { ...baseSegments, prod: '002' }, baseOptions)
    const profiles = readProfiles()
    const toRemove = profiles.find(p => p.name === 'Remover')!
    deleteProfile(toRemove.id)
    const remaining = readProfiles()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('Manter')
  })

  it('não lança erro ao remover id inexistente', () => {
    saveProfile('Perfil', baseSegments, baseOptions)
    expect(() => deleteProfile('id-que-nao-existe')).not.toThrow()
    expect(readProfiles()).toHaveLength(1)
  })

  it('lista fica vazia após remover último perfil', () => {
    saveProfile('Único', baseSegments, baseOptions)
    const [p] = readProfiles()
    deleteProfile(p.id)
    expect(readProfiles()).toHaveLength(0)
  })
})
