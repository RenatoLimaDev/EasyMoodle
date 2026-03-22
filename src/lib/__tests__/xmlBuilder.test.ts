import { describe, it, expect } from 'vitest'
import { buildXml, buildAllUnits } from '../xmlBuilder'
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

// ── buildXml — estrutura básica ───────────────────────────────────────────────

describe('buildXml — estrutura XML', () => {
  it('produz XML válido com declaração e tag quiz', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<quiz>')
    expect(xml).toContain('</quiz>')
  })

  it('gera uma tag <question> por questão', () => {
    const xml = buildXml([makeQuestion(), makeQuestion()], baseOpts, 1, '')
    const matches = xml.match(/<question type=/g) ?? []
    expect(matches).toHaveLength(2)
  })

  it('wrap do enunciado em CDATA com tag <p>', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '')
    expect(xml).toContain('<![CDATA[')
    expect(xml).toContain('<p dir="ltr"')
    expect(xml).toContain('Enunciado padrão da questão')
  })
})

// ── buildXml — multichoice ────────────────────────────────────────────────────

describe('buildXml — tipo multichoice', () => {
  it('type="multichoice" quando há 1 correta', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '')
    expect(xml).toContain('type="multichoice"')
    expect(xml).not.toContain('type="multichoice_multi"')
  })

  it('type="multichoice_multi" quando há 2 corretas', () => {
    const q = makeQuestion({
      alternativas: [
        { letra: 'A', texto: 'Correta 1', correta: true,  feedback: '' },
        { letra: 'B', texto: 'Correta 2', correta: true,  feedback: '' },
        { letra: 'C', texto: 'Errada',    correta: false, feedback: '' },
      ],
    })
    const xml = buildXml([q], baseOpts, 1, '')
    expect(xml).toContain('type="multichoice_multi"')
  })

  it('fraction="100" para alternativa correta (única)', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '')
    expect(xml).toContain('fraction="100"')
  })

  it('fraction="0" para alternativa errada sem penalidade', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, penalty: '0' }, 1, '')
    expect(xml).toContain('fraction="0"')
  })

  it('aplica penalidade negativa nas erradas', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, penalty: '0.5' }, 1, '')
    expect(xml).toMatch(/fraction="-\d/)
  })

  it('shuffleanswers true quando habilitado', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, shuffle: true }, 1, '')
    expect(xml).toContain('<shuffleanswers>true</shuffleanswers>')
  })

  it('shuffleanswers false por padrão', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '')
    expect(xml).toContain('<shuffleanswers>false</shuffleanswers>')
  })
})

// ── buildXml — essay ──────────────────────────────────────────────────────────

describe('buildXml — tipo essay (dissertativa)', () => {
  const essayQ = makeQuestion({ questionType: 'essay', alternativas: [] })

  it('type="essay"', () => {
    const xml = buildXml([essayQ], baseOpts, 1, '')
    expect(xml).toContain('type="essay"')
  })

  it('contém responseformat', () => {
    const xml = buildXml([essayQ], baseOpts, 1, '')
    expect(xml).toContain('<responseformat>editor</responseformat>')
  })

  it('contém graderinfo', () => {
    const xml = buildXml([essayQ], baseOpts, 1, '')
    expect(xml).toContain('<graderinfo')
    expect(xml).toContain('</graderinfo>')
  })

  it('contém responsetemplate', () => {
    const xml = buildXml([essayQ], baseOpts, 1, '')
    expect(xml).toContain('<responsetemplate')
  })

  it('não contém tags de alternativa', () => {
    const xml = buildXml([essayQ], baseOpts, 1, '')
    expect(xml).not.toContain('<answer ')
  })

  it('graderinfo inclui feedbackGeral', () => {
    const q = makeQuestion({ questionType: 'essay', alternativas: [], feedbackGeral: 'Critério de avaliação' })
    const xml = buildXml([q], baseOpts, 1, '')
    expect(xml).toContain('Critério de avaliação')
  })
})

// ── buildXml — nomenclatura ───────────────────────────────────────────────────

describe('buildXml — nomenclatura das questões', () => {
  it('usa codigoQ quando presente', () => {
    const q = makeQuestion({ codigoQ: 'MEU.CODIGO.Q1' })
    const xml = buildXml([q], baseOpts, 1, '')
    expect(xml).toContain('<text>MEU.CODIGO.Q1</text>')
  })

  it('usa codeTemplate com {n}', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, codeTemplate: 'Q{n}' }, 1, '')
    expect(xml).toContain('<text>Q1</text>')
  })

  it('usa detectedPattern com {n}', () => {
    const xml = buildXml([makeQuestion()], baseOpts, 1, '001.261.U1.2.O.Q{n}')
    expect(xml).toContain('<text>001.261.U1.2.O.Q1</text>')
  })

  it('numera questões a partir de startQ', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, codeTemplate: 'Q{n}' }, 5, '')
    expect(xml).toContain('<text>Q5</text>')
  })

  it('usa prefix + número como fallback', () => {
    const xml = buildXml([makeQuestion()], { ...baseOpts, prefix: 'Teste' }, 3, '')
    expect(xml).toContain('Teste 3')
  })

  it('escapa caracteres especiais no nome', () => {
    const q = makeQuestion({ codigoQ: 'A&B<C>D' })
    const xml = buildXml([q], baseOpts, 1, '')
    expect(xml).toContain('A&amp;B&lt;C&gt;D')
    expect(xml).not.toContain('A&B')
  })
})

// ── buildXml — feedback de alternativa ───────────────────────────────────────

describe('buildXml — feedback por alternativa', () => {
  it('inclui feedback quando useAltFeedback=true', () => {
    const q = makeQuestion({
      alternativas: [
        { letra: 'A', texto: 'Errada', correta: false, feedback: 'Explicação do erro' },
        { letra: 'B', texto: 'Correta', correta: true, feedback: '' },
      ],
    })
    const xml = buildXml([q], { ...baseOpts, useAltFeedback: true }, 1, '')
    expect(xml).toContain('Explicação do erro')
  })

  it('não inclui feedback quando useAltFeedback=false', () => {
    const q = makeQuestion({
      alternativas: [
        { letra: 'A', texto: 'Errada', correta: false, feedback: 'Não deve aparecer' },
        { letra: 'B', texto: 'Correta', correta: true, feedback: '' },
      ],
    })
    const xml = buildXml([q], { ...baseOpts, useAltFeedback: false }, 1, '')
    expect(xml).not.toContain('Não deve aparecer')
  })
})

// ── buildAllUnits ─────────────────────────────────────────────────────────────

describe('buildAllUnits', () => {
  const qs = [
    makeQuestion({ unitKey: 'P1', texto: 'Q1 unidade 1' }),
    makeQuestion({ unitKey: 'P1', texto: 'Q2 unidade 1' }),
    makeQuestion({ unitKey: 'P2', texto: 'Q3 unidade 2' }),
  ]

  it('retorna um grupo por unidade', () => {
    const units = buildAllUnits(qs, baseOpts, '')
    expect(units).toHaveLength(2)
  })

  it('cada grupo tem o unitKey correto', () => {
    const units = buildAllUnits(qs, baseOpts, '')
    expect(units[0].unitKey).toBe('1')
    expect(units[1].unitKey).toBe('2')
  })

  it('cada grupo tem o XML gerado', () => {
    const units = buildAllUnits(qs, baseOpts, '')
    units.forEach(u => {
      expect(u.xml).toContain('<quiz>')
      expect(u.xml).toContain('</quiz>')
    })
  })

  it('modo reset: cada unidade começa em Q1', () => {
    const units = buildAllUnits(qs, { ...baseOpts, qmode: 'reset', codeTemplate: 'Q{n}' }, '')
    expect(units[0].startQ).toBe(1)
    expect(units[1].startQ).toBe(1)
  })

  it('modo continue: numeração contínua entre unidades', () => {
    const units = buildAllUnits(qs, { ...baseOpts, qmode: 'continue', codeTemplate: 'Q{n}' }, '')
    expect(units[0].startQ).toBe(1)
    expect(units[1].startQ).toBe(3)
  })
})
