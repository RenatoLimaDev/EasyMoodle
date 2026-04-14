import { describe, it, expect } from 'vitest'
import { extractXmlQuestions } from '../extractor'

// ── Estrutura básica ──────────────────────────────────────────────────────────

describe('extractXmlQuestions — questão simples', () => {
  const xmlSimples = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name>
      <text>Q.001</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>Qual é a capital do Brasil?</p>]]></text>
    </questiontext>
  </question>
</quiz>`

  it('extrai uma questão de XML Moodle válido', () => {
    const qs = extractXmlQuestions(xmlSimples)
    expect(qs).toHaveLength(1)
  })

  it('extrai o nome da questão', () => {
    const qs = extractXmlQuestions(xmlSimples)
    expect(qs[0].name).toBe('Q.001')
  })

  it('extrai o texto da questão sem tags HTML', () => {
    const qs = extractXmlQuestions(xmlSimples)
    expect(qs[0].texto).toContain('Qual é a capital do Brasil?')
    expect(qs[0].texto).not.toContain('<p>')
    expect(qs[0].texto).not.toContain('</p>')
  })
})

// ── Múltiplas questões ────────────────────────────────────────────────────────

describe('extractXmlQuestions — múltiplas questões', () => {
  const xmlMulti = `<quiz>
  <question type="multichoice">
    <name><text>Q1</text></name>
    <questiontext format="html"><text>Primeira questão</text></questiontext>
  </question>
  <question type="essay">
    <name><text>Q2</text></name>
    <questiontext format="html"><text>Segunda questão</text></questiontext>
  </question>
</quiz>`

  it('extrai todas as questões', () => {
    const qs = extractXmlQuestions(xmlMulti)
    expect(qs).toHaveLength(2)
  })

  it('questões têm os textos corretos', () => {
    const qs = extractXmlQuestions(xmlMulti)
    expect(qs[0].texto).toBe('Primeira questão')
    expect(qs[1].texto).toBe('Segunda questão')
  })

  it('questões têm os nomes corretos', () => {
    const qs = extractXmlQuestions(xmlMulti)
    expect(qs[0].name).toBe('Q1')
    expect(qs[1].name).toBe('Q2')
  })
})

// ── Tipo category ignorado ────────────────────────────────────────────────────

describe('extractXmlQuestions — ignora tipo category', () => {
  const xmlCat = `<quiz>
  <question type="category">
    <category><text>Categoria Teste</text></category>
  </question>
  <question type="multichoice">
    <name><text>Q.001</text></name>
    <questiontext format="html"><text>Questão válida</text></questiontext>
  </question>
</quiz>`

  it('ignora questões tipo category', () => {
    const qs = extractXmlQuestions(xmlCat)
    expect(qs).toHaveLength(1)
    expect(qs[0].texto).toBe('Questão válida')
  })

  it('questão válida após category é extraída', () => {
    const qs = extractXmlQuestions(xmlCat)
    expect(qs[0].name).toBe('Q.001')
  })
})

// ── CDATA e entidades HTML ────────────────────────────────────────────────────

describe('extractXmlQuestions — CDATA e entidades HTML', () => {
  const xmlCdata = `<quiz>
  <question type="multichoice">
    <name><text>Q.002</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Texto com &amp; entidade e tag &lt;especial&gt;</p>]]></text>
    </questiontext>
  </question>
</quiz>`

  it('remove marcadores CDATA', () => {
    const qs = extractXmlQuestions(xmlCdata)
    expect(qs[0].texto).not.toContain('CDATA')
    expect(qs[0].texto).not.toContain(']]>')
  })

  it('decodifica entidade &amp; para &', () => {
    const qs = extractXmlQuestions(xmlCdata)
    expect(qs[0].texto).toContain('&')
  })

  it('decodifica entidades &lt; e &gt;', () => {
    const qs = extractXmlQuestions(xmlCdata)
    expect(qs[0].texto).toContain('<')
    expect(qs[0].texto).toContain('>')
  })
})

// ── Entradas inválidas / edge cases ──────────────────────────────────────────

describe('extractXmlQuestions — entradas inválidas', () => {
  it('retorna [] para XML sem questões', () => {
    const qs = extractXmlQuestions('<quiz></quiz>')
    expect(qs).toHaveLength(0)
  })

  it('retorna [] para string vazia', () => {
    const qs = extractXmlQuestions('')
    expect(qs).toHaveLength(0)
  })

  it('questão sem questiontext é ignorada', () => {
    const xml = `<quiz>
  <question type="multichoice">
    <name><text>Q1</text></name>
  </question>
</quiz>`
    const qs = extractXmlQuestions(xml)
    expect(qs).toHaveLength(0)
  })

  it('questão sem tag <name> retorna name vazio', () => {
    const xml = `<quiz>
  <question type="multichoice">
    <questiontext format="html"><text>Enunciado sem nome</text></questiontext>
  </question>
</quiz>`
    const qs = extractXmlQuestions(xml)
    expect(qs).toHaveLength(1)
    expect(qs[0].name).toBe('')
    expect(qs[0].texto).toBe('Enunciado sem nome')
  })

  it('questão com texto vazio no questiontext é ignorada', () => {
    const xml = `<quiz>
  <question type="multichoice">
    <name><text>Q1</text></name>
    <questiontext format="html"><text></text></questiontext>
  </question>
</quiz>`
    const qs = extractXmlQuestions(xml)
    expect(qs).toHaveLength(0)
  })
})

// ── Normalização do texto ─────────────────────────────────────────────────────

describe('extractXmlQuestions — normalização do texto', () => {
  it('colapsa espaços múltiplos em um só', () => {
    const xml = `<quiz>
  <question type="multichoice">
    <name><text>Q1</text></name>
    <questiontext format="html"><text>   Texto   com   espaços   </text></questiontext>
  </question>
</quiz>`
    const qs = extractXmlQuestions(xml)
    expect(qs[0].texto).toBe('Texto com espaços')
  })

  it('remove tags HTML do texto', () => {
    const xml = `<quiz>
  <question type="multichoice">
    <name><text>Q1</text></name>
    <questiontext format="html"><text><p><strong>Texto</strong> com <em>formatação</em></p></text></questiontext>
  </question>
</quiz>`
    const qs = extractXmlQuestions(xml)
    expect(qs[0].texto).toBe('Texto com formatação')
    expect(qs[0].texto).not.toContain('<')
  })
})
