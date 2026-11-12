# Automatic_Emails

Painel em Google Apps Script que lê os cards com status **Pendente** de uma base do Notion e dispara e-mails pelo Gmail usando modelos prontos (Financeiro, DP, Legalização e Fiscal). Após o envio, o status do card é atualizado para **Enviado** (ou **Erro**).

## Arquivos

| Arquivo | Descrição |
|---|---|
| `Codigo.gs` | Back-end: `doGet()` do Web App, modelos de e-mail, consulta ao Notion e envio pelo Gmail |
| `index.html` | Interface do painel com o botão "Processar Pendentes" |
| `.env.example` | Lista das propriedades do script necessárias (sem o token real) |

## Propriedades do script

Em **Configurações do projeto → Propriedades do script**:

| Propriedade | Uso |
|---|---|
| `NOTION_TOKEN` | Token da integração do Notion (secreto, não versionar) |
| `DATABASE_ID` | ID da base de dados do Notion |
| `DRIVE_ENTRADA_FOLDER_ID` | ID da pasta de entrada no Drive (ainda não usado no código) |
| `DRIVE_ORGANIZADO_FOLDER_ID` | ID da pasta organizada no Drive (ainda não usado no código) |

## Colunas esperadas na base do Notion

`Empresa` (título), `Email` (e-mail), `Script` (seleção, com o nome exato do modelo), `Status` (seleção: Pendente / Enviado / Erro), `Vencimento` (texto), `Valor` (número), `Competência` (texto), `CC` (seleção ou multisseleção), `Anexo` (arquivos).

## Como publicar

1. Crie um projeto em [script.google.com](https://script.google.com) e cole `Codigo.gs` e `index.html` (arquivo HTML chamado `index`).
2. Cadastre as propriedades do script acima.
3. **Implantar → Nova implantação → App da Web**.
