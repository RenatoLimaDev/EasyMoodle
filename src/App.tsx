import { useStore } from '@/store'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { StepImport } from '@/components/steps/StepImport'
import { StepEdit } from '@/components/steps/StepEdit'

export default function App() {
  const step = useStore(s => s.step)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="max-w-200 mt-4 w-full mx-auto px-4 flex flex-col h-full">

        {/* Compact top bar */}
        <header className="flex items-center gap-4 py-3 border-b border-border shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '10px',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
              padding: '2px 8px',
              borderRadius: '20px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}>EasyMoodle</span>
            <h1 className="text-xl font-extrabold tracking-tight whitespace-nowrap">
              Texto → <span style={{ color: 'var(--color-accent)' }}>Moodle XML</span>
            </h1>
          </div>
          <div className="flex-1" />
          <StepIndicator />
        </header>

        {/* Step content — fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden py-4">
          {step === 1 && <StepImport />}
          {step === 2 && <StepEdit />}
        </div>

      </div>
    </div>
  )
}
