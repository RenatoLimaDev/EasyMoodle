# Moodle XML Converter

Converte questões de múltipla escolha de qualquer formato para o XML do Moodle.

## Setup local

```bash
npm install
npm run dev
```

## Deploy

Gera um site estático — hospede em qualquer lugar:

```bash
npm run build
# /dist pronto para Vercel, Netlify, GitHub Pages, servidor próprio
```

**Vercel (mais fácil):**
```bash
npm i -g vercel
vercel        # só isso — sem variáveis de ambiente necessárias
```

## Estrutura

```
src/
├── types/index.ts           ← interfaces TypeScript
├── lib/
│   ├── parser.ts            ← parsing de texto → questões
│   ├── xmlBuilder.ts        ← geração do XML Moodle
│   ├── extractor.ts         ← leitura de arquivos + download
│   └── profiles.ts          ← perfis salvos (localStorage)
├── store/index.ts           ← estado global (Zustand)
└── components/
    ├── ui/StepIndicator.tsx
    └── steps/
        ├── StepImport.tsx   ← etapa 1: upload / colar texto
        ├── StepEdit.tsx     ← etapa 2: editor + auto-normalizar
        └── StepConvert.tsx  ← etapa 3: código, opções, gerar XML
```

## Formatos de entrada suportados

- `.docx` — extração via Mammoth.js
- `.txt`, `.md`, `.rtf` — texto puro com detecção de encoding (UTF-8 / Windows-1252)
- Cole diretamente na área de texto

## Formatos de questão reconhecidos

```
Questão 1 (Percurso 1 – Título)   ← com código ou percurso
Enunciado multi-linha...
A) Alternativa
B) Correta *
ANSWER: B; Feedback: texto
```

```
1) Enunciado                        ← numeração simples
A) Alternativa
B) Correta *
```

---
