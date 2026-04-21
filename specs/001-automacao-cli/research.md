# Research: Automação CLI/API do Facin

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Unknowns Resolvidos

### 1. Framework CLI

**Decisão**: `commander.js`
- Já usado em projetos similares; API estável; suporte a subcomandos, opções e glob
- Alternativa descartada: `yargs` (mais pesado, API mais complexa)

### 2. Leitura de arquivos em Node.js (sem browser File API)

`src/lib/extractor.ts` usa `mammoth` (importado via npm) e `DOMParser` (browser).

**Estratégia**: criar `src/cli/extract-node.ts` que:
- Para `.docx`: chama `mammoth.extractRawText({ path })` (API Node.js do mammoth)
- Para `.txt/.md/.rtf`: lê com `fs.readFile` + detecção de encoding via `chardet`
- Para `.xml` Moodle: lê com `fs.readFile` e passa para `extractXmlQuestions` de `src/lib/extractor.ts`
- Retorna `string` — mesma interface esperada pelo `parser.ts`

Isso evita modificar `src/lib/extractor.ts` (zero alterações na lib).

### 3. Detecção de encoding

**Decisão**: `chardet` (npm) — detecta windows-1252, utf-16, latin1.
Fallback: `utf-8` se não detectado com confiança.

### 4. Glob de múltiplos arquivos

**Decisão**: `glob` (npm) — já é dependência transitiva do Vite; expandir `*.txt` no Node.js (shells Windows não fazem glob expansion).

### 5. Execução via `npx` / instalação global

**Decisão**: `bin` field no `package.json` apontando para `dist/cli/index.js`.
Build via `tsc --project tsconfig.cli.json` separado do build Vite (que gera o frontend).

### 6. Progresso em lote

**Decisão**: log simples `[3/10] convertendo arquivo3.txt` via `process.stdout.write`.
Não usar bibliotecas de progress bar para manter zero dependências extras.

## Funções de `src/lib/` reutilizadas

| Função | Arquivo | Uso na CLI |
|--------|---------|-----------|
| `parseText` | `parser.ts` | converter txt/md/rtf → Question[] |
| `buildXml` | `xmlBuilder.ts` | Question[] → Moodle XML |
| `buildGift` | `giftBuilder.ts` | Question[] → GIFT |
| `extractXmlQuestions` | `extractor.ts` | importar banco XML Moodle |
| `findCrossDuplicates` | (a extrair de StepImport) | detectar duplicatas |

**Observação**: `findCrossDuplicates` está inline em `StepImport.tsx`. Será extraída para `src/lib/duplicates.ts` como parte desta feature (sem alterar comportamento).

## Dependências novas

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `commander` | ^12 | framework CLI |
| `chardet` | ^2 | detecção de encoding |
| `glob` | ^11 | expansão glob no Windows |

`tsx` já é devDependency; adicionar ao `scripts.cli` para dev.
