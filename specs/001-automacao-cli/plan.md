# Implementation Plan: Automação CLI/API do Facin

**Branch**: `claude/review-app-spec-driven-gvfXl` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)

## Summary

Expor a lógica de `src/lib/` como uma CLI (`facin convert`, `facin check-duplicates`) reutilizando 100% do código existente. A única camada nova é a interface de linha de comando e adaptadores de I/O para Node.js (ler arquivo por path em vez de browser `File` API).

## Technical Context

**Language/Version**: TypeScript 5 + Node.js ≥ 18
**Primary Dependencies**: commander.js (CLI), tsx (dev runner), mammoth (já presente)
**Storage**: sistema de arquivos local (entrada/saída via paths)
**Testing**: Vitest (unit) + testes de integração CLI via `child_process.execSync`
**Target Platform**: Node.js (Linux/macOS/Windows)
**Project Type**: CLI tool (wrapper sobre biblioteca existente)
**Performance Goals**: arquivo de 50 questões convertido em < 3s
**Constraints**: zero duplicação de lógica de `src/lib/`
**Scale/Scope**: uso local, sem servidor, sem autenticação

## Constitution Check

| Princípio | Status | Observação |
|-----------|--------|------------|
| I. Spec-First | ✅ | Specs escritas antes de qualquer código |
| II. Formato Moodle Válido | ✅ | Reutiliza `buildXml` e `buildGift` existentes |
| III. Feedback Sempre Visível | ✅ | CLI exibe progresso, erros e resultado |
| IV. Parsing Multi-Formato | ✅ | Reutiliza `extractText` adaptado para Node |
| V. Automação como Destino | ✅ | Este plano É o princípio V sendo realizado |

## Project Structure

### Documentation (esta feature)

```text
specs/001-automacao-cli/
├── plan.md              ← este arquivo
├── research.md
├── data-model.md
├── contracts/
│   └── cli-contract.md
└── tasks.md             ← gerado por /speckit-tasks
```

### Source Code

```text
src/
├── lib/                 ← existente, sem alterações
│   ├── parser.ts
│   ├── xmlBuilder.ts
│   ├── giftBuilder.ts
│   ├── extractor.ts
│   └── profiles.ts
├── cli/
│   ├── index.ts         ← entry point: registra comandos
│   ├── extract-node.ts  ← adaptador Node.js para leitura de arquivos
│   ├── commands/
│   │   ├── convert.ts
│   │   └── check-duplicates.ts
│   └── utils/
│       └── progress.ts  ← barra de progresso simples
└── components/          ← existente, sem alterações

src/lib/__tests__/       ← existente
src/cli/__tests__/
├── convert.test.ts
└── check-duplicates.test.ts
```

**Structure Decision**: Pasta `src/cli/` isolada — a lógica de UI (`src/components/`) e de negócio (`src/lib/`) não são tocadas.

## Implementation Phases

### Phase 0 — Extract shared logic (prerequisite)

- Extrair `findCrossDuplicates` de `StepImport.tsx` → `src/lib/duplicates.ts`
- Escrever testes unitários para `duplicates.ts`

### Phase 1 — Node.js file adapter

- Implementar `src/cli/extract-node.ts`
- Suporte: `.txt`, `.md`, `.docx` (mammoth), `.rtf`, `.xml` (Moodle)
- Detecção de encoding via `chardet`

### Phase 2 — CLI `convert` command

- `src/cli/commands/convert.ts`
- Arquivo único + lote (`--dir` / glob)
- Progress output `[N/T]`
- Exit codes 0/1/2

### Phase 3 — CLI `check-duplicates` command

- `src/cli/commands/check-duplicates.ts`
- Reutiliza `findCrossDuplicates` de `src/lib/duplicates.ts`
- Exit code 0 (sem dup) / 1 (com dup) / 2 (erro)

### Phase 4 — Build & packaging

- `tsconfig.cli.json` para compilar `src/cli/` → `dist/cli/`
- `bin` field em `package.json`
- Script `npm run build:cli`

## Artifacts

| Arquivo | Descrição |
|---------|-----------|
| [research.md](research.md) | Decisões de framework e dependências |
| [data-model.md](data-model.md) | ConvertJob, DuplicateReport, BatchResult |
| [contracts/cli-contract.md](contracts/cli-contract.md) | Assinatura dos comandos CLI |
| tasks.md | Gerado por `/speckit-tasks` |
