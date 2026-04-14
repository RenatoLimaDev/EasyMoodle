import type { Question, ConvertOptions, UnitGroup } from '@/types'
import { groupByUnit } from './parser'

// Escapes GIFT special characters: ~ = # { } \
function escapeGift(str: string): string {
  return str.replace(/([~=#{}\\])/g, '\\$1')
}

function resolveQuestionName(
  p: Question,
  qNum: number,
  prefix: string,
  codeTemplate: string,
  detectedPattern: string,
  unitTemplate?: string
): string {
  if (p.codigoQ) return escapeGift(p.codigoQ)
  if (unitTemplate) return escapeGift(unitTemplate.replace(/\{n\}/g, String(qNum)))
  if (codeTemplate) return escapeGift(codeTemplate.replace(/\{n\}/g, String(qNum)))
  if (detectedPattern) return escapeGift(detectedPattern.replace(/\{n\}/g, String(qNum)))
  if (p.tituloHint) return escapeGift(`${prefix} ${qNum} — ${p.tituloHint}`)
  return escapeGift(`${prefix} ${qNum}`)
}

export function buildGift(
  perguntas: Question[],
  opts: ConvertOptions,
  startQ: number,
  detectedPattern: string,
  unitKey?: string
): string {
  const { prefix, codeTemplate, penalty, useAltFeedback, unitTemplates } = opts
  const unitTemplate = unitKey && unitTemplates?.[unitKey] ? unitTemplates[unitKey] : undefined

  const parts: string[] = []

  perguntas.forEach((p, i) => {
    const isEssay  = p.questionType === 'essay'
    const corretas = p.alternativas.filter(a => a.correta).length
    const qNum     = startQ + i
    const name     = resolveQuestionName(p, qNum, prefix, codeTemplate, detectedPattern, unitTemplate)

    let block = `::${name}::${escapeGift(p.texto)}{\n`

    if (isEssay) {
      block = `::${name}::${escapeGift(p.texto)}{}`
      parts.push(block)
      return
    }

    const isMulti = corretas > 1
    const nWrong  = p.alternativas.length - corretas

    p.alternativas.forEach(a => {
      const fb = useAltFeedback && a.feedback ? ` #${escapeGift(a.feedback)}` : ''

      if (!isMulti) {
        if (a.correta) {
          block += `  =${escapeGift(a.texto)}${fb}\n`
        } else {
          const penaltyStr = parseFloat(penalty) > 0 && nWrong > 0
            ? `%-${(parseFloat(penalty) * 100 / nWrong).toFixed(5)}%`
            : ''
          block += `  ~${penaltyStr}${escapeGift(a.texto)}${fb}\n`
        }
      } else {
        if (a.correta) {
          const frac = (100 / corretas).toFixed(5)
          block += `  ~%${frac}%${escapeGift(a.texto)}${fb}\n`
        } else {
          block += `  ~%-100%${escapeGift(a.texto)}${fb}\n`
        }
      }
    })

    block += '}'
    parts.push(block)
  })

  return parts.join('\n\n')
}

export function buildAllUnitsGift(
  perguntas: Question[],
  opts: ConvertOptions,
  detectedPattern: string
): UnitGroup[] {
  const groups = groupByUnit(perguntas)

  let continueCursor = 1

  return groups.map(({ unitKey, questions }) => {
    let startQ: number
    if (opts.qmode === 'continue') {
      startQ = continueCursor
      continueCursor += questions.length
    } else if (opts.qmode === 'offset') {
      startQ = opts.unitOffsets[unitKey] ?? 1
    } else {
      // 'reset' (default) — each unit always starts at Q1
      startQ = 1
    }

    const xml = buildGift(questions, opts, startQ, detectedPattern, unitKey)
    return { unitKey, questions, startQ, xml }
  })
}
