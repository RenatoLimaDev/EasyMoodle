# Tasks: Automação CLI/API do Facin

**Input**: Design documents from `specs/001-automacao-cli/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/cli-contract.md ✅

**Spec-First approach**: tests escritos ANTES da implementação (red → green → refactor)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuração do projeto CLI — tipos, dependências, build separado do frontend.

- [ ] T001 Instalar dependências: `npm install commander chardet glob` e `npm install --save-dev tsx` (se ausente)
- [ ] T002 Criar `tsconfig.cli.json` com `include: ["src/cli/**/*", "src/lib/**/*"]` e `outDir: "dist/cli"` (Node ESM)
- [ ] T003 Adicionar scripts ao `package.json`: `"build:cli"`, `"cli"` (via tsx) e campo `"bin": { "facin": "./dist/cli/index.js" }`
- [ ] T004 [P] Criar estrutura de diretórios: `src/cli/`, `src/cli/commands/`, `src/cli/utils/`, `src/cli/__tests__/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lógica compartilhada que todas as user stories precisam. DEVE estar completa antes de qualquer US.

**⚠️ CRÍTICO**: As USs 1, 2 e 3 dependem desta fase.

- [ ] T005 Extrair `findCrossDuplicates` de `src/components/steps/StepImport.tsx` → `src/lib/duplicates.ts` com tipagem explícita
- [ ] T006 Escrever testes unitários para `src/lib/__tests__/duplicates.test.ts` (red first, depois verificar que T005 os faz passar)
- [ ] T007 Implementar `src/cli/extract-node.ts`: lê arquivo por path, retorna string — suporta `.txt/.md/.rtf` (fs + chardet), `.docx` (mammoth Node API), `.xml` (fs puro para extractXmlQuestions)
- [ ] T008 [P] Escrever testes para `src/cli/__tests__/extract-node.test.ts` usando fixtures em `src/cli/__tests__/fixtures/` (arquivo .txt e .xml de exemplo)
- [ ] T009 Criar `src/cli/utils/progress.ts`: função `logProgress(current, total, filename)` que imprime `[N/T] convertendo arquivo → saida`

**Checkpoint**: `npx vitest run` — duplicates.ts e extract-node.ts com testes passando.

---

## Phase 3: User Story 1 — Converter arquivo único (Priority: P1) 🎯 MVP

**Goal**: `facin convert questoes.txt` gera `questoes.xml` válido no diretório atual.

**Independent Test**: `echo "1) Questão\nA) Alt" > /tmp/q.txt && npx tsx src/cli/index.ts convert /tmp/q.txt && cat /tmp/q.xml`

### Testes para User Story 1

> **Escreva ANTES da implementação — devem FALHAR primeiro**

- [ ] T010 [P] [US1] Escrever `src/cli/__tests__/convert.test.ts`: testa `facin convert arquivo.txt` (saída padrão), `--output caminho.xml`, `--format gift`, arquivo inválido → exit code não-zero
- [ ] T011 [P] [US1] Adicionar fixtures em `src/cli/__tests__/fixtures/`: `sample.txt` com 3 questões válidas, `empty.txt` sem questões

### Implementação User Story 1

- [ ] T012 [US1] Implementar `src/cli/commands/convert.ts`: função `convertFile(inputPath, opts)` que retorna `ConvertJob` — sem I/O (testável em isolamento)
- [ ] T013 [US1] Implementar lógica de roteamento em `convertFile`: `.xml` → `extractXmlQuestions`, outros → `extractNodeFile` + `parseText` + `buildXml/buildGift`
- [ ] T014 [US1] Implementar `src/cli/index.ts`: entry point, registra comando `convert <arquivo>` via commander com opções `--output`, `--format`
- [ ] T015 [US1] Conectar I/O no comando convert: ler com `extract-node.ts`, chamar `convertFile`, escrever saída com `fs.writeFile`, imprimir resultado
- [ ] T016 [US1] Validar exit codes: 0 em sucesso, 1 em erro de conversão, 2 em argumento inválido/formato não suportado

**Checkpoint**: `npx tsx src/cli/index.ts convert fixtures/sample.txt` gera XML válido. Todos os testes de T010 passam.

---

## Phase 4: User Story 2 — Processamento em lote (Priority: P2)

**Goal**: `facin convert --dir pasta/` converte todos os arquivos e exibe progresso `[N/T]`.

**Independent Test**: `mkdir /tmp/lote && cp fixtures/sample.txt /tmp/lote/{a,b,c}.txt && npx tsx src/cli/index.ts convert --dir /tmp/lote && ls /tmp/lote/*.xml`

### Testes para User Story 2

> **Escreva ANTES da implementação — devem FALHAR primeiro**

- [ ] T017 [P] [US2] Adicionar cenários em `src/cli/__tests__/convert.test.ts`: `--dir` com 3 arquivos gera 3 XMLs; erro em 1 não interrompe os demais; progresso `[1/3]...[3/3]` é impresso

### Implementação User Story 2

- [ ] T018 [US2] Implementar função `convertBatch(paths: string[], opts): BatchResult` em `src/cli/commands/convert.ts`
- [ ] T019 [US2] Adicionar expansão glob via `glob` npm para `facin convert *.txt` (Windows safe)
- [ ] T020 [US2] Adicionar flag `--dir <pasta>` ao comando convert: lista arquivos, chama `convertBatch` com `logProgress`
- [ ] T021 [US2] Imprimir sumário final: `✓ N arquivos convertidos (M questões)` / `✗ K erros`
- [ ] T022 [US2] Exit code: 0 se todos ok, 1 se qualquer arquivo falhou

**Checkpoint**: lote de 3 arquivos — progresso visível, 3 XMLs gerados, 1 com erro não interrompe os outros.

---

## Phase 5: User Story 3 — Verificar duplicatas via CLI (Priority: P3)

**Goal**: `facin check-duplicates novas.txt banco.xml` imprime relatório e usa exit code 0/1.

**Independent Test**: `npx tsx src/cli/index.ts check-duplicates fixtures/sample.txt /tmp/q.xml` — com XML gerado de sample.txt deve mostrar 3 duplicatas e exit code 1.

### Testes para User Story 3

> **Escreva ANTES da implementação — devem FALHAR primeiro**

- [ ] T023 [P] [US3] Escrever `src/cli/__tests__/check-duplicates.test.ts`: sem duplicatas → exit 0 + mensagem "Sem duplicatas"; com duplicatas → exit 1 + lista com índice e texto; arquivo não encontrado → exit 2

### Implementação User Story 3

- [ ] T024 [US3] Implementar `src/cli/commands/check-duplicates.ts`: carrega questões do arquivo novo e banco XML, chama `findCrossDuplicates` de `src/lib/duplicates.ts`
- [ ] T025 [US3] Formatar saída do relatório: `⚠ N duplicatas encontradas:` + lista `[idx] "texto..." → banco: "título"` ou `✓ Sem duplicatas. N questões verificadas.`
- [ ] T026 [US3] Registrar comando `check-duplicates <arquivo> <banco>` em `src/cli/index.ts` com exit codes corretos

**Checkpoint**: `src/cli/__tests__/check-duplicates.test.ts` — todos os cenários passam.

---

## Phase 6: Polish & Build

**Purpose**: Empacotamento, documentação de uso, validação final.

- [ ] T027 [P] Compilar CLI: `npm run build:cli` deve gerar `dist/cli/index.js` executável (`#!/usr/bin/env node`)
- [ ] T028 [P] Adicionar shebang ao entry point `src/cli/index.ts`: `#!/usr/bin/env node`
- [ ] T029 Testar `npx tsx src/cli/index.ts --help` e `npx tsx src/cli/index.ts convert --help`
- [ ] T030 Validar SC-001: converter `fixtures/sample.txt` (50+ questões) em < 3s
- [ ] T031 Atualizar `CLAUDE.md`: mover feature para Concluído, atualizar tabela de testes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as USs
- **US1 (Phase 3)**: Depende de Phase 2 — MVP entregável
- **US2 (Phase 4)**: Depende de Phase 2 — pode rodar em paralelo com US3 após Phase 2
- **US3 (Phase 5)**: Depende de Phase 2 (usa `findCrossDuplicates`) — paralelo com US2
- **Polish (Phase 6)**: Depende de todas as USs desejadas

### User Story Dependencies

- **US1 (P1)**: Independente após Phase 2
- **US2 (P2)**: Independente após Phase 2 (estende US1 mas não depende dela)
- **US3 (P3)**: Independente após Phase 2 (usa duplicates.ts de Phase 2)

### Parallel Opportunities

- T004, T008, T009: paralelos (arquivos diferentes)
- T010, T011: paralelos (fixtures vs lógica de teste)
- T017, T023: paralelos (testes de US2 e US3 são independentes)
- T027, T028, T029: paralelos

---

## Parallel Example: Phase 2

```bash
# Podem rodar em paralelo:
Task T007: Implementar src/cli/extract-node.ts
Task T009: Criar src/cli/utils/progress.ts
# Após T007:
Task T008: Testes de extract-node.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — `facin convert arquivo.txt`
4. **VALIDAR**: `npx tsx src/cli/index.ts convert fixtures/sample.txt` gera XML válido
5. Commit e demo

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → `facin convert` funciona para arquivo único (MVP!)
3. US2 → adiciona lote + progresso
4. US3 → adiciona `facin check-duplicates`
5. Polish → build, packaging, docs

---

## Notes

- [P] = pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- [USN] = pertence à user story N
- Vitest cobre testes de `src/cli/__tests__/` — mesmo runner dos testes de `src/lib/`
- Fixtures em `src/cli/__tests__/fixtures/` — não usar `fs.readFile` em runtime dos testes; embutir como strings constantes se necessário (ver roundtrip.test.ts como referência)
- Commit após cada checkpoint validado
