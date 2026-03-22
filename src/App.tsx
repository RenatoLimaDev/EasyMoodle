import { useStore } from '@/store'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { StepImport } from '@/components/steps/StepImport'
import { StepEdit } from '@/components/steps/StepEdit'
import { StepConvert } from '@/components/steps/StepConvert'

export default function App() {
  const step = useStore(s => s.step)

  return (
    <div className="min-h-screen px-4 py-10 pb-20">
      <div className="max-w-3xl mx-auto">

        <header className="mb-10">
          <div style={{
            display: 'inline-block',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '11px',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            padding: '3px 12px',
            borderRadius: '20px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}>
            🧩 Ferramenta de Conversão
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Texto → <span style={{ color: 'var(--color-accent)' }}>Moodle XML</span>
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Extraia, normalize e converta questões de qualquer formato.
          </p>
        </header>

        <StepIndicator />

        {step === 1 && <StepImport />}
        {step === 2 && <StepEdit />}
        {step === 3 && <StepConvert />}

      </div>

    </div>
  )
}
