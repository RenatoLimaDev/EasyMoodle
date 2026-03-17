import { useStore } from '@/store'

const STEPS = [
  { n: 1, label: 'Importar', sub: 'arquivo ou texto' },
  { n: 2, label: 'Revisar',  sub: 'editar e normalizar' },
  { n: 3, label: 'Converter', sub: 'gerar XML' },
] as const

export function StepIndicator() {
  const step = useStore(s => s.step)

  return (
    <div className="flex gap-1.5 mb-8">
      {STEPS.map(({ n, label, sub }) => {
        const isActive = step === n
        const isDone   = step > n
        return (
          <div
            key={n}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all
              ${isActive ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
              font-mono text-xs font-bold transition-all
              ${isActive ? 'bg-accent text-bg' : isDone ? 'border border-accent text-accent bg-transparent' : 'bg-border text-white/40'}`}>
              {n}
            </div>
            <div>
              <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/40'}`}>{label}</div>
              <div className="text-[11px] text-white/25 font-mono hidden sm:block">{sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
