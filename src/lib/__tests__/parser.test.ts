import { describe, it, expect } from 'vitest'
import {
  parseText,
  findDuplicates,
  findCrossDuplicates,
  detectCodeInText,
  inferTemplate,
  groupByUnit,
} from '../parser'

// ── parseText ────────────────────────────────────────────────────────────────

describe('parseText — Formato A (numeração simples)', () => {
  const texto = `
1. Qual é a capital do Brasil?
A) São Paulo
B) Rio de Janeiro
C) Brasília *
D) Salvador
ANSWER: C
`.trim()

  it('detecta a questão', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas).toHaveLength(1)
  })

  it('extrai o enunciado', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].texto).toBe('Qual é a capital do Brasil?')
  })

  it('extrai 4 alternativas', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].alternativas).toHaveLength(4)
  })

  it('marca a alternativa correta', () => {
    const { perguntas } = parseText(texto)
    const correta = perguntas[0].alternativas.find(a => a.correta)
    expect(correta?.letra).toBe('C')
    expect(correta?.texto).toBe('Brasília')
  })

  it('formato é A', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].formato).toBe('A')
  })
})

describe('parseText — Formato B (Questão N)', () => {
  const texto = `
Questão 1 (Percurso 2.3)
Explique o conceito de recursão.
A) Uma técnica que não usa memória
*B) Função que chama a si mesma
C) Laço infinito
ANSWER: B; Feedback: Recursão é quando a função se autoinvoca.
`.trim()

  it('detecta a questão', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas).toHaveLength(1)
  })

  it('extrai unitKey e percursoMod do Percurso', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].unitKey).toBe('P2')
    expect(perguntas[0].percursoMod).toBe('3')
  })

  it('extrai feedback do ANSWER inline', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].feedbackGeral).toContain('Recursão')
  })

  it('formato é B', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].formato).toBe('B')
  })
})

describe('parseText — Questão com código', () => {
  const texto = `
Questão 1 (001.261.U1.2.O.Q1)
Enunciado com código completo.
A) Alt A
*B) Alt B
`.trim()

  it('extrai codigoQ do parêntese', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].codigoQ).toBe('001.261.U1.2.O.Q1')
  })

  it('extrai unitKey da unidade no código', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].unitKey).toBe('U1')
  })
})

describe('parseText — Múltiplas questões', () => {
  const texto = `
1. Primeira questão
A) Alt A
*B) Alt B

2. Segunda questão
A) Correta *
B) Errada
`.trim()

  it('detecta duas questões', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas).toHaveLength(2)
  })

  it('questões têm enunciados corretos', () => {
    const { perguntas } = parseText(texto)
    expect(perguntas[0].texto).toBe('Primeira questão')
    expect(perguntas[1].texto).toBe('Segunda questão')
  })
})

describe('parseText — feedback por alternativa [fb:]', () => {
  const texto = `
1. Questão com feedback por alternativa
A) Errada [fb: Este está errado pois X]
B) Correta * [fb: Correto porque Y]
`.trim()

  it('extrai feedback da alternativa corretamente', () => {
    const { perguntas } = parseText(texto)
    const alts = perguntas[0].alternativas
    expect(alts[0].feedback).toBe('Este está errado pois X')
    expect(alts[1].feedback).toBe('Correto porque Y')
    expect(alts[1].texto).not.toContain('[fb:')
  })
})

describe('parseText — entrada vazia', () => {
  it('retorna zero questões para texto vazio', () => {
    const { perguntas } = parseText('')
    expect(perguntas).toHaveLength(0)
  })

  it('não gera avisos desnecessários', () => {
    const { avisos } = parseText('')
    expect(avisos).toHaveLength(0)
  })
})

// ── detectCodeInText ─────────────────────────────────────────────────────────

describe('detectCodeInText', () => {
  it('detecta códigos no padrão PROD.ANO.U.MOD.TIPO.Q', () => {
    const texto = '001.261.U1.2.O.Q1 — Enunciado'
    expect(detectCodeInText(texto)).toContain('001.261.U1.2.O.Q1')
  })

  it('retorna array vazio quando não há código', () => {
    expect(detectCodeInText('Questão simples sem código')).toHaveLength(0)
  })

  it('retorna no máximo 3 códigos', () => {
    const texto = [
      '001.261.U1.1.O.Q1',
      '001.261.U1.1.O.Q2',
      '001.261.U1.1.O.Q3',
      '001.261.U1.1.O.Q4',
    ].join('\n')
    expect(detectCodeInText(texto).length).toBeLessThanOrEqual(3)
  })
})

// ── inferTemplate ─────────────────────────────────────────────────────────────

describe('inferTemplate', () => {
  it('substitui o número final por {n}', () => {
    expect(inferTemplate('001.261.U1.2.O.Q5')).toBe('001.261.U1.2.O.Q{n}')
  })

  it('funciona com Q1', () => {
    expect(inferTemplate('001.261.U1.2.O.Q1')).toBe('001.261.U1.2.O.Q{n}')
  })
})

// ── findDuplicates ────────────────────────────────────────────────────────────

describe('findDuplicates', () => {
  it('retorna vazio quando não há duplicatas', () => {
    const { perguntas } = parseText(`
1. Questão única A
*A) Alt A

2. Questão única B
*A) Alt A
    `.trim())
    expect(findDuplicates(perguntas)).toHaveLength(0)
  })

  it('detecta duplicata por texto', () => {
    const { perguntas } = parseText(`
1. Texto idêntico
*A) Alt

2. Texto idêntico
*A) Alt
    `.trim())
    const dupes = findDuplicates(perguntas)
    expect(dupes).toHaveLength(1)
    expect(dupes[0].type).toBe('text')
    expect(dupes[0].indexes).toEqual([0, 1])
  })

  it('detecta duplicata por código', () => {
    const qs = [
      { texto: 'Q1', codigoQ: 'ABC.001', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const },
      { texto: 'Q2', codigoQ: 'ABC.001', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '2', feedbackGeral: '', linha: 2, formato: 'A' as const },
    ]
    const dupes = findDuplicates(qs)
    expect(dupes.some(d => d.type === 'code')).toBe(true)
  })

  it('ignora questões sem texto para duplicata de texto', () => {
    const qs = [
      { texto: '', codigoQ: '', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const },
      { texto: '', codigoQ: '', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '2', feedbackGeral: '', linha: 2, formato: 'A' as const },
    ]
    expect(findDuplicates(qs)).toHaveLength(0)
  })
})

// ── findCrossDuplicates ───────────────────────────────────────────────────────

describe('findCrossDuplicates', () => {
  const refs = [
    { name: 'Q.001', texto: 'Questão que já existe no banco' },
    { name: 'Q.002', texto: 'Outra questão do banco' },
  ]

  it('detecta duplicata por texto com banco', () => {
    const qs = [{ texto: 'Questão que já existe no banco', codigoQ: '', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const }]
    const cross = findCrossDuplicates(qs, refs)
    expect(cross).toHaveLength(1)
    expect(cross[0].type).toBe('text')
    expect(cross[0].newIdx).toBe(0)
  })

  it('detecta duplicata por código com banco', () => {
    const qs = [{ texto: 'Outro enunciado', codigoQ: 'Q.001', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const }]
    const cross = findCrossDuplicates(qs, refs)
    expect(cross[0].type).toBe('code')
  })

  it('não reporta falso positivo', () => {
    const qs = [{ texto: 'Questão completamente nova', codigoQ: 'Q.999', alternativas: [], unitKey: null, percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const }]
    expect(findCrossDuplicates(qs, refs)).toHaveLength(0)
  })
})

// ── groupByUnit ───────────────────────────────────────────────────────────────

describe('groupByUnit', () => {
  it('agrupa questões por unidade', () => {
    const qs = [
      { texto: 'Q1', unitKey: 'P1', codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '1', feedbackGeral: '', linha: 1, formato: 'A' as const },
      { texto: 'Q2', unitKey: 'P2', codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '2', feedbackGeral: '', linha: 2, formato: 'A' as const },
      { texto: 'Q3', unitKey: 'P1', codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '3', feedbackGeral: '', linha: 3, formato: 'A' as const },
    ]
    const groups = groupByUnit(qs)
    expect(groups).toHaveLength(2)
    expect(groups[0].questions).toHaveLength(2)
    expect(groups[1].questions).toHaveLength(1)
  })

  it('ordena grupos numericamente', () => {
    const qs = [
      { texto: 'Q', unitKey: 'P3', codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '', feedbackGeral: '', linha: 1, formato: 'A' as const },
      { texto: 'Q', unitKey: 'P1', codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '', feedbackGeral: '', linha: 2, formato: 'A' as const },
    ]
    const groups = groupByUnit(qs)
    expect(groups[0].unitKey).toBe('1')
    expect(groups[1].unitKey).toBe('3')
  })

  it('questões sem unidade vão para P?', () => {
    const qs = [{ texto: 'Q', unitKey: null, codigoQ: '', alternativas: [], percursoMod: '', tituloHint: '', seqNum: '', feedbackGeral: '', linha: 1, formato: 'A' as const }]
    const groups = groupByUnit(qs)
    expect(groups[0].unitKey).toBe('P?')
  })
})
