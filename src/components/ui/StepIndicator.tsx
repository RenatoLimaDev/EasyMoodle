import { useStore } from '@/store'

const STEPS = [
  { n: 1, label: 'Importar',           sub: 'arquivo ou texto' },
  { n: 2, label: 'Revisar & Exportar', sub: 'editar e gerar XML' },
] as const

export function StepIndicator() {
  const step = useStore(s => s.step)

  return (
    <div className="flex gap-1.5">
      {STEPS.map(({ n, label }) => {
        const isActive = step === n
        const isDone   = step > n
        return (
          <div
            key={n}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
              ${isActive ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
              font-mono text-[11px] font-bold transition-all
              ${isActive ? 'bg-accent text-bg' : isDone ? 'border border-accent text-accent' : 'bg-border text-white/40'}`}>
              {n}
            </div>
            <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/35'}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
