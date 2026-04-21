# CLI Contract: facin

**Spec**: [../spec.md](../spec.md) | **Data Model**: [../data-model.md](../data-model.md)

## Comando: `facin convert`

### Assinatura

```
facin convert <arquivo|glob> [opções]
facin convert --dir <pasta> [opções]
```

### Opções

| Flag | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `--output <caminho>` | string | `<nome-entrada>.xml` | caminho do arquivo de saída |
| `--format <fmt>` | `xml\|gift` | `xml` | formato de saída |
| `--dir <pasta>` | string | — | processar todos os arquivos da pasta |
| `--encoding <enc>` | string | auto-detect | forçar encoding de entrada |

### Comportamento

1. Resolve path(s) de entrada (glob ou `--dir`)
2. Para cada arquivo: extrai texto → parse → build output → escreve arquivo
3. Exibe progresso: `[1/3] convertendo questoes.txt → questoes.xml`
4. Ao final exibe sumário: `✓ 3 arquivos convertidos (127 questões)`

### Saída (stdout)

```
[1/3] convertendo questoes.txt → questoes.xml
[2/3] convertendo aula2.docx → aula2.xml
[3/3] convertendo aula3.txt → aula3.xml
✓ 3 arquivos convertidos (127 questões)
```

### Saída de erro (stderr)

```
✗ aula4.txt: Nenhuma questão reconhecida no arquivo
```

### Códigos de saída

| Código | Significado |
|--------|-------------|
| `0` | Sucesso (todos os arquivos convertidos) |
| `1` | Erro em um ou mais arquivos |
| `2` | Argumento inválido / formato não suportado |

---

## Comando: `facin check-duplicates`

### Assinatura

```
facin check-duplicates <arquivo-novo> <banco.xml>
```

### Comportamento

1. Carrega questões de `<arquivo-novo>` (qualquer formato suportado)
2. Carrega banco de `<banco.xml>` (Moodle XML)
3. Executa `findCrossDuplicates`
4. Exibe relatório

### Saída (stdout) — sem duplicatas

```
✓ Sem duplicatas. 15 questões verificadas contra 200 do banco.
```

### Saída (stdout) — com duplicatas

```
⚠ 3 duplicatas encontradas:
  [2] "Qual é a capital do Brasil..." → banco: "Capital do Brasil (questão 45)"
  [7] "Defina homeostase..." → banco: "Homeostase (questão 12)"
  [9] "O que é DNA..." → banco: "DNA conceito (questão 3)"
```

### Códigos de saída

| Código | Significado |
|--------|-------------|
| `0` | Sem duplicatas |
| `1` | Duplicatas encontradas |
| `2` | Erro (arquivo não encontrado, formato inválido) |

---

## Formatos de entrada suportados

| Extensão | Estratégia |
|----------|-----------|
| `.txt` | `fs.readFile` + `parseText` |
| `.md` | `fs.readFile` + `parseText` |
| `.docx` | `mammoth.extractRawText({ path })` + `parseText` |
| `.rtf` | `fs.readFile` (texto plano) + `parseText` |
| `.xml` | `extractXmlQuestions` (Moodle XML) |

## Instalação

```bash
# global
npm install -g facin

# sem instalação
npx facin convert questoes.txt
```

## Entry point

`package.json`:
```json
{
  "bin": { "facin": "./dist/cli/index.js" }
}
```
