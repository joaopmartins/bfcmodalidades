# BFC Modalidades

Dashboard com o estado atual das modalidades desportivas do **Boavista Futebol Clube**.

Acompanha a performance de cada escalao e compara com a epoca anterior.

> **Aviso:** Este projeto nao e oficial do Boavista FC. E um projeto independente criado por um adepto.

## Funcionalidades

- **Dashboard** com todas as modalidades e escaloes do clube
- **Comparacao** entre a epoca atual e a anterior (posicao, pontos, resultados)
- **Filtros** por modalidade e tipo (senior, formacao, feminino)
- **Indicadores visuais** de performance (melhor, pior, igual, extinta)
- **Zonas** de titulo, subida, playoff e descida
- **Vista detalhada** (modal) com comparacao lado a lado
- **Dark mode** com detecao automatica de preferencia do sistema
- **Responsivo** (mobile, tablet, desktop)
- **Boavistometro** — seccao satirica sobre o estado do clube

## Modalidades Incluidas

| Modalidade | Escaloes | Categoria |
|---|---|---|
| Futebol Masculino | 8 (Senior, Equipa B, Sub-19 a Sub-13) | Futebol |
| Futebol Feminino | 1 (Senior) | Futebol |
| Voleibol Feminino | 4 (Senior, Sub-19, Sub-17, Sub-15) | Pavilhao |
| Futsal | 5 (Senior, Sub-20, Sub-17, Sub-15, Sub-13) | Pavilhao |
| Andebol | 4 (Senior, Sub-18, Sub-16, Sub-14) | Pavilhao |

## Tech Stack

- **HTML5** — estrutura da pagina
- **Tailwind CSS v3** (via CDN) — estilos utilitarios
- **Vanilla JavaScript** (ES6+) — logica da aplicacao
- **JSON** — fonte de dados (`data.json`)

Sem dependencias, sem build step, sem backend.

## Estrutura do Projeto

```
bfcmodalidades/
├── index.html          # Pagina principal
├── data.json           # Dados de todas as modalidades/escaloes
├── css/
│   └── styles.css      # Estilos custom (animacoes, dark mode, print)
├── js/
│   └── app.js          # Logica da aplicacao
└── assets/
    └── logo.png        # Logo do Boavista FC
```

## Como Usar

1. Clonar o repositorio:
   ```bash
   git clone https://github.com/joaopmartins/bfcmodalidades.git
   ```

2. Abrir `index.html` no browser, ou servir com qualquer servidor HTTP:
   ```bash
   cd bfcmodalidades
   npx serve .
   # ou
   python3 -m http.server 8000
   ```

3. Aceder a `http://localhost:8000` (ou a porta indicada).

## Atualizar Dados

Os dados estao em `data.json`. Para atualizar resultados, editar diretamente o ficheiro.

### Estrutura de `data.json`

```json
{
  "meta": {
    "lastUpdated": "2026-02-15",
    "currentSeason": "2025-26",
    "previousSeason": "2024-25"
  },
  "modalidades": [
    {
      "id": "futebol",
      "nome": "Futebol Masculino",
      "icon": "⚽",
      "categoria": "futebol",
      "escaloes": [
        {
          "id": "senior-masc",
          "nome": "Senior (SAD)",
          "tipo": "senior",
          "status": null,
          "atual": {
            "competicao": "Liga Portugal",
            "posicao": 18,
            "jogos": 21,
            "vitorias": 2,
            "empates": 3,
            "derrotas": 16,
            "golosMarcados": 21,
            "golosSofridos": 53,
            "pontos": 9,
            "zona": "descida"
          },
          "anterior": {
            "competicao": "Liga Portugal",
            "posicaoFinal": 18,
            "pontosFinal": 24,
            "golosMarcados": 24,
            "golosSofridos": 60
          }
        }
      ]
    }
  ]
}
```

### Campos por escalao

| Campo | Descricao | Obrigatorio |
|---|---|---|
| `id` | Identificador unico | Sim |
| `nome` | Nome do escalao | Sim |
| `tipo` | `"senior"`, `"formacao"`, ou `"feminino"` | Sim |
| `status` | `"extinta"` se a equipa foi extinta, `null` caso contrario | Nao |
| `atual.competicao` | Nome da competicao atual | Sim |
| `atual.posicao` | Posicao na classificacao | Sim |
| `atual.jogos` | Jogos disputados | Sim |
| `atual.vitorias` | Vitorias | Sim |
| `atual.empates` | Empates | Sim |
| `atual.derrotas` | Derrotas | Sim |
| `atual.golosMarcados` | Golos marcados | Nao |
| `atual.golosSofridos` | Golos sofridos | Nao |
| `atual.pontos` | Pontos | Sim |
| `atual.zona` | `"titulo"`, `"subida"`, `"playoff"`, `"descida"`, ou `null` | Nao |
| `anterior.competicao` | Competicao da epoca anterior | Sim |
| `anterior.posicaoFinal` | Posicao final da epoca anterior | Sim |
| `anterior.pontosFinal` | Pontos finais da epoca anterior | Sim |

### Adicionar nova modalidade

Adicionar um novo objeto ao array `modalidades` em `data.json`:

```json
{
  "id": "nova-modalidade",
  "nome": "Nome da Modalidade",
  "icon": "🏀",
  "categoria": "pavilhao",
  "escaloes": []
}
```

### Marcar equipa como extinta

Definir `"status": "extinta"` e `"atual": null`:

```json
{
  "id": "equipa-id",
  "nome": "Nome da Equipa",
  "tipo": "senior",
  "status": "extinta",
  "atual": null,
  "anterior": { ... }
}
```

## Legenda dos Indicadores

| Indicador | Significado |
|---|---|
| 🚀 | Muito melhor que a epoca anterior (subiu 3+ posicoes) |
| 🟢 | Melhor que a epoca anterior |
| 🔵 | Igual a epoca anterior |
| 🟠 | Pior que a epoca anterior |
| 🔴 | Muito pior (desceu 3+ posicoes) |
| 🚫 | Equipa extinta |
| 🏆 | Zona de titulo |
| ▲ | Zona de subida |
| 🚨 | Zona de descida |

## Deploy

Site estatico — pode ser alojado em qualquer servico de hosting estatico:

- **GitHub Pages**: Ativar nas settings do repositorio
- **Netlify/Vercel**: Ligar ao repositorio, sem configuracao adicional
- **Qualquer servidor HTTP**: Copiar os ficheiros para o diretorio de servico

## Licenca

Projeto sem fins lucrativos, criado para uso informativo.
O logotipo e marcas do Boavista FC sao propriedade do clube.
