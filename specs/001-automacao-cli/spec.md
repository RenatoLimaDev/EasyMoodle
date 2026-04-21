# Feature Specification: Automação CLI/API do Facin

**Feature Branch**: `001-automacao-cli`
**Created**: 2026-04-21
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Converter arquivo via linha de comando (Priority: P1)

Um professor tem uma pasta com 30 arquivos `.txt` de questões e quer convertê-los todos para Moodle XML sem abrir o navegador.

**Why this priority**: É o núcleo da automação — sem isso não há pipeline possível.

**Independent Test**: Executar `facin convert questoes.txt` e verificar que `quiz.xml` é criado com questões válidas.

**Acceptance Scenarios**:

1. **Given** um arquivo `.txt` com questões no formato padrão, **When** o usuário executa `facin convert arquivo.txt`, **Then** um arquivo `quiz.xml` válido é gerado no diretório atual.
2. **Given** um arquivo `.docx`, **When** o usuário executa `facin convert arquivo.docx --output saida.xml`, **Then** o arquivo é gerado no caminho especificado.
3. **Given** um arquivo inválido ou sem questões reconhecidas, **When** executado, **Then** uma mensagem de erro descritiva é exibida e o processo termina com código de saída não-zero.

---

### User Story 2 - Processamento em lote de múltiplos arquivos (Priority: P2)

Um professor quer converter todos os arquivos de uma pasta de uma vez.

**Why this priority**: Elimina o trabalho repetitivo de converter arquivo por arquivo.

**Independent Test**: Executar `facin convert *.txt` ou `facin convert --dir pasta/` e verificar que um XML por arquivo é gerado.

**Acceptance Scenarios**:

1. **Given** uma pasta com 10 arquivos `.txt`, **When** o usuário executa `facin convert --dir pasta/`, **Then** 10 arquivos `.xml` são gerados correspondentes.
2. **Given** arquivos de formatos mistos (`.txt`, `.docx`), **When** processados em lote, **Then** cada um é convertido corretamente e erros individuais não interrompem o lote.

---

### User Story 3 - Verificar duplicatas entre dois arquivos via CLI (Priority: P3)

Um professor quer checar se questões novas já existem no banco antes de importar.

**Why this priority**: Funcionalidade já existe na UI — expor na CLI completa o fluxo de automação.

**Independent Test**: Executar `facin check-duplicates novas.txt banco.xml` e ver relatório de duplicatas.

**Acceptance Scenarios**:

1. **Given** um arquivo de questões e um banco XML, **When** executado, **Then** lista de duplicatas é exibida com identificação da questão.
2. **Given** arquivos sem duplicatas, **When** executado, **Then** mensagem "Sem duplicatas" e código de saída 0.
3. **Given** duplicatas encontradas, **When** executado, **Then** código de saída não-zero para integração com scripts.

---

### Edge Cases

- Arquivo com encoding não-UTF8 (windows-1252, utf-16) deve ser detectado e processado.
- Arquivo vazio ou sem questões reconhecidas: erro descritivo, não crash.
- Sem permissão de escrita no diretório de saída: mensagem de erro clara.
- Formato de saída inválido especificado: listar formatos suportados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor um comando `facin convert <arquivo>` que leia questões e gere Moodle XML.
- **FR-002**: O sistema DEVE suportar os formatos de entrada: `.txt`, `.md`, `.docx`, `.odt`, `.rtf`, `.xml` (Moodle).
- **FR-003**: O sistema DEVE suportar os formatos de saída: `--format xml` (padrão) e `--format gift`.
- **FR-004**: O sistema DEVE permitir especificar arquivo de saída via `--output <caminho>`.
- **FR-005**: O sistema DEVE processar múltiplos arquivos via glob ou flag `--dir`.
- **FR-006**: O sistema DEVE expor um comando `facin check-duplicates <arquivo> <banco.xml>` que retorne relatório de duplicatas.
- **FR-007**: O sistema DEVE retornar código de saída 0 em sucesso e não-zero em erro ou duplicatas encontradas.
- **FR-008**: O sistema DEVE reutilizar as funções de `src/lib/` sem duplicação de lógica.
- **FR-009**: O sistema DEVE exibir progresso quando processar múltiplos arquivos (ex: `[3/10] convertendo arquivo3.txt`).
- **FR-010**: O sistema DEVE ser instalável via `npm install -g` ou executável via `npx`.

### Key Entities

- **ConvertJob**: arquivo de entrada + opções (formato, output, template) + resultado (xml/gift gerado, avisos)
- **DuplicateReport**: lista de questões duplicadas com índice, texto e fonte da duplicata
- **BatchResult**: coleção de ConvertJobs com contagem de sucesso/falha

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um único arquivo de 50 questões é convertido em menos de 3 segundos.
- **SC-002**: Lote de 100 arquivos é processado sem intervenção manual.
- **SC-003**: 100% das funções de `src/lib/` são reutilizadas sem cópia de código.
- **SC-004**: A CLI pode ser integrada em um script shell ou pipeline de CI sem modificações.
- **SC-005**: Mensagens de erro são suficientemente descritivas para o usuário corrigir o problema sem documentação.

## Assumptions

- A lógica de negócio já está em `src/lib/` e é importável no Node.js puro.
- O usuário tem Node.js instalado (versão ≥ 18).
- O formato de saída padrão é XML Moodle (mesmo comportamento da UI).
- Mobile e Windows PowerShell são suportados apenas se não exigirem mudanças na lógica core.
- A CLI é um wrapper sobre `src/lib/` — não reimplementa parsing ou geração de XML.
- Autenticação não é necessária (ferramenta local, sem servidor).
