import { describe, it, expect } from 'vitest'
import { buildGift, buildAllUnitsGift } from '../giftBuilder'
import type { Question, ConvertOptions } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const baseOpts: ConvertOptions = {
  questionType: 'multichoice',
  prefix: 'Questão',
  codeTemplate: '',
  penalty: '0',
  shuffle: false,
  fbCorrect: '',
  fbIncorrect: '',
  useAltFeedback: false,
  splitByUnit: false,
  qmode: 'reset',
  unitOffsets: {},
  unitTemplates: {},
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    texto: 'Enunciado padrão da questão',
    tituloHint: '',
    codigoQ: '',
    seqNum: '1',
    unitKey: null,
    percursoMod: '',
    alternativas: [
      { letra: 'A', texto: 'Alternativa errada', correta: false, feedback: '' },
      { letra: 'B', texto: 'Alternativa correta', correta: true,  feedback: '' },
    ],
    feedbackGeral: '',
    linha: 1,
    formato: 'A',
    ...overrides,
  }
}

// ── Estrutura básica ──────────────────────────────────────────────────────────

describe('buildGift — estrutura básica', () => {
  it('produz texto não vazio', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '')
    expect(gift.trim()).not.toBe('')
  })

  it('cada questão possui marcador ::', () => {
    const gift = buildGift([makeQuestion(), makeQuestion()], baseOpts, 1, '')
    const matches = gift.match(/::/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('questões delimitadas por chaves { }', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '')
    expect(gift).toContain('{')
    expect(gift).toContain('}')
  })

  it('enunciado da questão presente no texto', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '')
    expect(gift).toContain('Enunciado padrão da questão')
  })
})

// ── Multichoice — resposta única ──────────────────────────────────────────────

describe('buildGift — multichoice single (1 resposta correta)', () => {
  it('alternativa correta começa com =', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '')
    expect(gift).toMatch(/=Alternativa correta/)
  })

  it('alternativa errada começa com ~', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '')
    expect(gift).toMatch(/~Alternativa errada/)
  })

  it('sem penalidade: erradas não têm porcentagem negativa', () => {
    const gift = buildGift([makeQuestion()], { ...baseOpts, penalty: '0' }, 1, '')
    expect(gift).not.toMatch(/~%-/)
  })

  it('com penalidade: erradas têm %-n%', () => {
    const gift = buildGift([makeQuestion()], { ...baseOpts, penalty: '0.5' }, 1, '')
    expect(gift).toMatch(/~%-\d+/)
  })
})

// ── Multichoice — múltiplas respostas ─────────────────────────────────────────

describe('buildGift — multichoice multi (2 respostas corretas)', () => {
  const multiQ = makeQuestion({
    alternativas: [
      { letra: 'A', texto: 'Correta 1', correta: true,  feedback: '' },
      { letra: 'B', texto: 'Correta 2', correta: true,  feedback: '' },
      { letra: 'C', texto: 'Errada',    correta: false, feedback: '' },
    ],
  })

  it('corretas têm ~%50% quando há 2 corretas', () => {
    const gift = buildGift([multiQ], baseOpts, 1, '')
    expect(gift).toMatch(/~%50/)
  })

  it('erradas têm ~%-100%', () => {
    const gift = buildGift([multiQ], baseOpts, 1, '')
    expect(gift).toContain('~%-100%')
  })

  it('não usa = para questões multi', () => {
    const gift = buildGift([multiQ], baseOpts, 1, '')
    expect(gift).not.toMatch(/\s=/)
  })
})

// ── Essay (dissertativa) ──────────────────────────────────────────────────────

describe('buildGift — essay (dissertativa)', () => {
  const essayQ = makeQuestion({ questionType: 'essay', alternativas: [] })

  it('questão essay termina com chaves vazias {}', () => {
    const gift = buildGift([essayQ], baseOpts, 1, '')
    expect(gift).toContain('{}')
  })

  it('não contém linhas de alternativa (= ou ~)', () => {
    const gift = buildGift([essayQ], baseOpts, 1, '')
    // Should not have answer lines (= or ~ at start of line inside braces)
    expect(gift).not.toMatch(/\n\s+[=~]/)
  })
})

// ── Nomenclatura das questões ─────────────────────────────────────────────────

describe('buildGift — nomenclatura das questões', () => {
  it('usa codigoQ como nome quando presente', () => {
    const q = makeQuestion({ codigoQ: 'MEU.CODIGO.Q1' })
    const gift = buildGift([q], baseOpts, 1, '')
    expect(gift).toContain('::MEU.CODIGO.Q1::')
  })

  it('usa codeTemplate com {n}', () => {
    const gift = buildGift([makeQuestion()], { ...baseOpts, codeTemplate: 'Q{n}' }, 1, '')
    expect(gift).toContain('::Q1::')
  })

  it('usa detectedPattern com {n}', () => {
    const gift = buildGift([makeQuestion()], baseOpts, 1, '001.261.U1.2.O.Q{n}')
    expect(gift).toContain('::001.261.U1.2.O.Q1::')
  })

  it('numera questões a partir de startQ', () => {
    const gift = buildGift([makeQuestion()], { ...baseOpts, codeTemplate: 'Q{n}' }, 5, '')
    expect(gift).toContain('::Q5::')
  })

  it('usa prefix + número como fallback', () => {
    const gift = buildGift([makeQuestion()], { ...baseOpts, prefix: 'Teste' }, 3, '')
    expect(gift).toContain('::Teste 3::')
  })

  it('escapa ~ no nome da questão', () => {
    const q = makeQuestion({ codigoQ: 'A~B' })
    const gift = buildGift([q], baseOpts, 1, '')
    expect(gift).toContain('::A\\~B::')
  })

  it('escapa = no nome da questão', () => {
    const q = makeQuestion({ codigoQ: 'A=B' })
    const gift = buildGift([q], baseOpts, 1, '')
    expect(gift).toContain('::A\\=B::')
  })
})

// ── Feedback por alternativa ──────────────────────────────────────────────────

describe('buildGift — feedback por alternativa', () => {
  it('inclui feedback com # quando useAltFeedback=true', () => {
    const q = makeQuestion({
      alternativas: [
        { letra: 'A', texto: 'Errada', correta: false, feedback: 'Por que está errado' },
        { letra: 'B', texto: 'Correta', correta: true,  feedback: '' },
      ],
    })
    const gift = buildGift([q], { ...baseOpts, useAltFeedback: true }, 1, '')
    expect(gift).toContain('#Por que está errado')
  })

  it('não inclui feedback quando useAltFeedback=false', () => {
    const q = makeQuestion({
      alternativas: [
        { letra: 'A', texto: 'Errada', correta: false, feedback: 'Não deve aparecer' },
        { letra: 'B', texto: 'Correta', correta: true,  feedback: '' },
      ],
    })
    const gift = buildGift([q], { ...baseOpts, useAltFeedback: false }, 1, '')
    expect(gift).not.toContain('Não deve aparecer')
  })
})

// ── buildAllUnitsGift ─────────────────────────────────────────────────────────

describe('buildAllUnitsGift', () => {
  const qs = [
    makeQuestion({ unitKey: 'P1', texto: 'Q1 unidade 1' }),
    makeQuestion({ unitKey: 'P1', texto: 'Q2 unidade 1' }),
    makeQuestion({ unitKey: 'P2', texto: 'Q3 unidade 2' }),
  ]

  it('retorna um grupo por unidade', () => {
    const units = buildAllUnitsGift(qs, baseOpts, '')
    expect(units).toHaveLength(2)
  })

  it('cada grupo tem o unitKey correto', () => {
    const units = buildAllUnitsGift(qs, baseOpts, '')
    expect(units[0].unitKey).toBe('1')
    expect(units[1].unitKey).toBe('2')
  })

  it('cada grupo tem GIFT gerado (contém ::)', () => {
    const units = buildAllUnitsGift(qs, baseOpts, '')
    units.forEach(u => {
      expect(u.xml).toContain('::')
      expect(u.xml).toContain('{')
    })
  })

  it('modo reset: cada unidade começa em Q1', () => {
    const units = buildAllUnitsGift(qs, { ...baseOpts, qmode: 'reset', codeTemplate: 'Q{n}' }, '')
    expect(units[0].startQ).toBe(1)
    expect(units[1].startQ).toBe(1)
  })

  it('modo continue: numeração contínua entre unidades', () => {
    const units = buildAllUnitsGift(qs, { ...baseOpts, qmode: 'continue', codeTemplate: 'Q{n}' }, '')
    expect(units[0].startQ).toBe(1)
    expect(units[1].startQ).toBe(3)
  })

  it('modo offset: usa o offset configurado', () => {
    const units = buildAllUnitsGift(
      qs,
      { ...baseOpts, qmode: 'offset', codeTemplate: 'Q{n}', unitOffsets: { '1': 10, '2': 20 } },
      ''
    )
    expect(units[0].startQ).toBe(10)
    expect(units[1].startQ).toBe(20)
  })
})
