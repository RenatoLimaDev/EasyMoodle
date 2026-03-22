import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { parseText, findDuplicates, findCrossDuplicates } from '@/lib/parser'
import { extractXmlQuestions } from '@/lib/extractor'

export function StepEdit() {
  const rawText   = useStore(s => s.rawText)
  const setRawText= useStore(s => s.setRawText)
  const setParsed = useStore(s => s.setParsed)
  const perguntas = useStore(s => s.perguntas)
  const avisos    = useStore(s => s.avisos)
  const setStep   = useStore(s => s.setStep)

  const updateText = (txt: string) => {
    setRawText(txt)
    const result = parseText(txt)
    setParsed(result.perguntas, result.avisos)
  }

  const autoNormalize = () => {
    const lines = rawText.split('\n')
    const out: string[] = []
    const reQuestaoWord = /^Quest[aã]o\s+(\d+)\s*([(（].*?[)）])?\s*/i
    const reQuestaoNum  = /^(\d+)\s*[).]\s+/
    const reAlternativa = /^[A-Ea-e]\s*[).]\s+/
    const reAnswer      = /^ANSWER\s*:/i
    let qCount = 0
    let i = 0

    while (i < lines.length) {
      const l = lines[i].trim()
      if (!l) { i++; continue }

      if (reQuestaoWord.test(l)) {
        qCount++
        out.push(l)
        i++
        while (i < lines.length) {
          const next = lines[i].trim()
          if (!next) { i++; continue }
          if (reAlternativa.test(next) || reAnswer.test(next)) break
          out.push(next)
          i++
        }
        continue
      }

      if (reQuestaoNum.test(l)) {
        qCount++
        const rest = l.replace(reQuestaoNum, '').trim()
        let enunciado = rest
        i++
        while (i < lines.length) {
          const next = lines[i].trim()
          if (!next) { i++; continue }
          if (reAlternativa.test(next) || reAnswer.test(next)) break
          enunciado = enunciado ? enunciado + ' ' + next : next
          i++
        }
        out.push(`${qCount}) ${enunciado}`)
        continue
      }

      if (reAlternativa.test(l)) {
        const letra = l[0].toUpperCase()
        const resto = l.replace(/^[A-Ea-e]\s*[).]\s*/, '').trim()
        out.push(`${letra}) ${resto}`)
        i++; continue
      }

      out.push(l)
      i++
    }

    updateText(out.join('\n'))
  }

  const xmlRef    = useRef<HTMLInputElement>(null)
  const [refQuestions, setRefQuestions] = useState<Array<{ name: string; texto: string }>>([])
  const [refFilename, setRefFilename]   = useState('')
  const [refError, setRefError]         = useState('')

  const loadRefXml = async (file: File) => {
    setRefError('')
    try {
      const text = await file.text()
      const qs = extractXmlQuestions(text)
      if (qs.length === 0) { setRefError('Nenhuma questão encontrada no XML.'); return }
      setRefQuestions(qs)
      setRefFilename(file.name)
    } catch {
      setRefError('Erro ao ler o arquivo XML.')
    }
  }

  const lines = rawText.split('\n').filter(l => l.trim()).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-base">✏️ Revise o texto extraído</h2>
          <span className="font-mono text-xs text-white/30 bg-surface2 border border-border px-2 py-1 rounded">
            {lines} linhas · {rawText.length} chars
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep(1)} className="btn-secondary">← Voltar</button>
          <button onClick={autoNormalize} className="btn-secondary border-accent3/40 text-accent3 hover:bg-accent3/10">
            ⚙️ Auto-normalizar
          </button>
          <button onClick={() => { setRawText(''); setParsed([], []) }} className="btn-secondary">
            🗑 Limpar
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={rawText}
        onChange={e => updateText(e.target.value)}
        className="input min-h-[340px] resize-y leading-7 text-[13px]"
        spellCheck={false}
        placeholder="O texto extraído aparecerá aqui para você revisar e editar..."
      />

      {/* Hint */}
      <div className="card border-l-4 border-l-accent4 text-xs font-mono text-white/40 leading-relaxed space-y-1">
        <p><span className="text-white/60">Formato aceito:</span></p>
        <p><span className="text-accent">1)</span> Enunciado da questão &nbsp;·&nbsp; <span className="text-accent">A)</span> Alternativa</p>
        <p>Marque a correta com <span className="text-accent">*</span> no final &nbsp;·&nbsp; ou use <span className="text-accent">ANSWER: B; Feedback: texto</span></p>
        <p>Cabeçalho <span className="text-accent">Questão N (Percurso...)</span> também é reconhecido automaticamente</p>
        <p className="text-white/25 pt-1"><span className="text-accent3">⚙️ Auto-normalizar</span> converte formatos variados para o padrão</p>
      </div>

      {/* Detection preview */}
      <div className="card space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-white/30 mb-3">
          Detecção de questões
        </div>
        {perguntas.length === 0 ? (
          <p className="text-white/30 text-xs font-mono">Nenhuma questão detectada.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <p className="text-accent text-xs font-mono mb-2">
              ✅ {perguntas.length} questão(ões) · {avisos.length > 0 ? `⚠️ ${avisos.length} aviso(s)` : 'sem avisos'}
            </p>
            {perguntas.slice(0, 6).map((p, i) => {
              const corretas = p.alternativas.filter(a => a.correta).length
              return (
                <div key={i} className="text-xs font-mono text-white/50 leading-relaxed">
                  <span className={corretas > 0 ? 'text-accent' : 'text-accent3'}>
                    {corretas > 0 ? '✅' : '⚠️'}
                  </span>
                  {' '}<span className="text-white/80">Q{i + 1}</span>
                  {p.unitKey && <span className="text-accent4"> [{p.unitKey}]</span>}
                  {' '}— {p.texto.slice(0, 72)}{p.texto.length > 72 ? '…' : ''}
                  <span className="text-white/25 ml-2">{p.alternativas.length}alt</span>
                </div>
              )
            })}
            {perguntas.length > 6 && (
              <p className="text-white/25 text-xs font-mono">… e mais {perguntas.length - 6}</p>
            )}
          </div>
        )}
      </div>

      {/* Cross-check against Moodle XML */}
      <div className="card border-l-4 border-l-accent4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent4">
              🔍 Verificar contra banco Moodle
            </div>
            <div className="text-[11px] text-white/30 font-mono mt-0.5">
              Importe um XML exportado do Moodle para detectar questões já cadastradas
            </div>
          </div>
          {refFilename && (
            <button onClick={() => { setRefQuestions([]); setRefFilename('') }}
              className="text-[11px] font-mono text-white/30 hover:text-accent2 transition-colors">
              ✕ remover
            </button>
          )}
        </div>

        {!refFilename ? (
          <div>
            <input ref={xmlRef} type="file" accept=".xml" className="hidden"
              onChange={e => e.target.files?.[0] && loadRefXml(e.target.files[0])} />
            <button onClick={() => xmlRef.current?.click()}
              className="w-full border border-dashed border-accent4/30 rounded-lg py-3 text-xs
                         font-mono text-accent4/60 hover:border-accent4/60 hover:text-accent4
                         hover:bg-accent4/5 transition-all">
              + Selecionar arquivo .xml do Moodle
            </button>
            {refError && <p className="text-accent2 text-xs font-mono mt-2">{refError}</p>}
          </div>
        ) : (
          (() => {
            const cross = findCrossDuplicates(perguntas, refQuestions)
            const removeQuestion = (idx: number) => setParsed(perguntas.filter((_, i) => i !== idx), avisos)
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-accent4">✓ {refFilename}</span>
                  <span className="text-white/25">— {refQuestions.length} questões no banco</span>
                </div>
                {cross.length === 0 ? (
                  <p className="text-accent text-xs font-mono">✅ Nenhuma duplicata com o banco.</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    <p className="text-accent2 text-xs font-mono">⚠️ {cross.length} questão(ões) já existem no banco:</p>
                    {cross.map((d, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-xs font-mono text-white/50">
                          <span className="text-accent3">{d.type === 'code' ? '🔑 Código' : '📄 Texto'} igual</span>
                          <span className="text-white/30 mx-1">—</span>
                          <span className="text-accent2">Q{d.newIdx + 1}</span>
                          {d.refName && <span className="text-white/25 ml-1">↔ {d.refName}</span>}
                          <span className="text-white/20 block pl-4 truncate">
                            {d.refTexto.slice(0, 80)}{d.refTexto.length > 80 ? '…' : ''}
                          </span>
                        </div>
                        <button onClick={() => removeQuestion(d.newIdx)}
                          className="ml-0 text-[11px] font-mono px-2 py-0.5 rounded border border-accent2/30
                                     text-accent2/70 hover:bg-accent2/15 hover:text-accent2 hover:border-accent2/60
                                     transition-all">
                          remover Q{d.newIdx + 1}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()
        )}
      </div>

      {/* Duplicates */}
      {(() => {
        const duplicates = findDuplicates(perguntas)
        if (duplicates.length === 0) return null

        const removeQuestion = (idx: number) => {
          const novas = perguntas.filter((_, i) => i !== idx)
          setParsed(novas, avisos)
        }

        return (
          <div className="card border-l-4 border-l-accent2 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent2 mb-1">
              ⚠️ {duplicates.length} duplicata(s) detectada(s)
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {duplicates.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-mono text-white/50">
                    <span className="text-accent3">
                      {d.type === 'code' ? '🔑 Código' : '📄 Texto'} igual
                    </span>
                    <span className="text-white/30 mx-1">—</span>
                    <span className="text-accent2">
                      Q{d.indexes.map(idx => idx + 1).join(' e Q')}
                    </span>
                    <span className="text-white/25 ml-2">
                      {d.value}{d.value.length >= 80 ? '…' : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 pl-2">
                    {d.indexes.map(idx => (
                      <button
                        key={idx}
                        onClick={() => removeQuestion(idx)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded border border-accent2/30
                                   text-accent2/70 hover:bg-accent2/15 hover:text-accent2 hover:border-accent2/60
                                   transition-all"
                      >
                        remover Q{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <button
        onClick={() => setStep(3)}
        disabled={perguntas.length === 0}
        className="btn-primary w-full text-base"
      >
        Continuar para configurações →
      </button>
    </div>
  )
}
