# Data Model: Automação CLI/API do Facin

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Entidades

### ConvertJob

Representa a conversão de um único arquivo.

```typescript
interface ConvertJob {
  inputPath: string        // caminho absoluto do arquivo de entrada
  outputPath: string       // caminho absoluto do arquivo de saída
  format: 'xml' | 'gift'  // formato de saída
  questions: Question[]    // questões extraídas (de src/lib/parser.ts)
  warnings: string[]       // avisos não-fatais (ex: questão sem alternativas)
  error?: string           // mensagem de erro fatal (job falhou)
}
```

### DuplicateReport

Resultado de `facin check-duplicates`.

```typescript
interface DuplicateReport {
  sourceFile: string    // arquivo de questões novas
  bankFile: string      // banco de referência (.xml)
  duplicates: Array<{
    questionIndex: number  // índice na lista de questões novas (0-based)
    questionText: string   // texto da questão nova (truncado a 80 chars)
    matchedIn: string      // name/título da questão do banco que coincidiu
  }>
  totalChecked: number  // total de questões verificadas
}
```

### BatchResult

Agregado de múltiplos ConvertJobs.

```typescript
interface BatchResult {
  jobs: ConvertJob[]
  succeeded: number
  failed: number
  totalQuestions: number  // soma das questões convertidas com sucesso
}
```

## Reuso de tipos existentes

`Question` e `QuestionAlt` vêm de `src/lib/parser.ts` — sem redefinição.
`XmlBuildOptions` vem de `src/lib/xmlBuilder.ts`.

## Fluxo de dados

```
arquivo .txt/.docx/.xml
        │
        ▼
extract-node.ts → string (texto bruto)
        │
        ▼  (se não for XML Moodle)
parser.ts::parseText → Question[]
        │
        ▼
xmlBuilder.ts::buildXml ou giftBuilder.ts::buildGift → string (saída)
        │
        ▼
fs.writeFile → arquivo de saída
```

Para `check-duplicates`:

```
arquivo novo + banco.xml
        │
        ▼
extract-node.ts → Question[] (novo) + XmlQuestion[] (banco)
        │
        ▼
duplicates.ts::findCrossDuplicates → DuplicateMatch[]
        │
        ▼
DuplicateReport → stdout
```
