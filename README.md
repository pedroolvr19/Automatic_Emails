# Automatic_Emails

Painel único para as automações do Notion:

- **E-mails:** lê os cards com status **Pendente**, envia pelo Gmail com o modelo escolhido e marca **Enviado** / **Erro**.
- **Drive:** cria a estrutura de pastas (Empresa > Departamento > Competência > …) e salva os anexos do Notion no Drive, marcando a linha como **Concluído**.

```
Página (Vercel) ──POST {acao, senha}──▶ Apps Script (doPost) ──▶ Notion + Gmail + Drive
```

| Arquivo | Onde fica | O que faz |
|---|---|---|
| `index.html` | Vercel | Painel com senha e os botões |
| `apps-script/Api.gs` | Apps Script | `doPost`: confere a senha e chama a ação |
| `apps-script/Emails.gs` | Apps Script | Modelos e disparo de e-mails |
| `apps-script/Drive.gs` | Apps Script | Criação de pastas e envio de arquivos |

## 1. Configurar o Apps Script (um projeto só)

1. Em um projeto do Apps Script, crie três arquivos de script — `Api`, `Emails` e `Drive` — e cole o conteúdo de cada `.gs` da pasta `apps-script/`. Apague os `index.html` / `Index.html` antigos e o `doGet` antigo, se houver.
2. Em **Configurações do projeto → Propriedades do script**, cadastre:

| Propriedade | Uso |
|---|---|
| `PAINEL_SENHA` | Senha digitada na página |
| `NOTION_TOKEN_EMAILS` | Token da integração do Notion da base de e-mails (o `NOTION_TOKEN` do projeto antigo "Envio Email") |
| `DATABASE_ID` | Base do Notion dos e-mails |
| `NOTION_TOKEN_DRIVE` | Token da integração do Notion da base do Drive (o `NOTION_TOKEN` do projeto antigo "Notion Arquivos Drive") |
| `NOTION_DATABASE_ID` | Base do Notion das tarefas do Drive |
| `DRIVE_EMPRESAS_FOLDER_ID` | Pasta "Empresas" no Drive |

> `DRIVE_ENTRADA_FOLDER_ID` e `DRIVE_ORGANIZADO_FOLDER_ID` não são usadas pelo código e podem ser apagadas.

3. Rode a função `diagnosticar` uma vez pelo editor para autorizar Gmail e Drive e conferir a conexão.
4. **Implantar → Nova implantação → App da Web** — Executar como: **Eu**; Quem pode acessar: **Qualquer pessoa**.
5. Copie a URL que termina em `/exec`.

> Ao alterar o código depois, use **Gerenciar implantações → Editar → Nova versão** para manter a mesma URL.

## 2. Configurar a página

Em `index.html`, troque `COLE_AQUI_A_URL_DO_APP_DA_WEB` pela URL `/exec`.

## 3. Subir na Vercel

1. Faça push deste repositório para o GitHub.
2. Na Vercel: **Add New → Project → importe o repositório**.
3. Framework Preset: **Other**, sem build command → **Deploy**.

A pasta `apps-script/` não é publicada (veja `.vercelignore`).

## Bases do Notion

**E-mails:** `Empresa` (título), `Email`, `Script` (seleção com o nome exato do modelo), `Status` (seleção: Pendente / Enviado / Erro), `Vencimento` (texto), `Valor` (número), `Competência` (texto), `CC` (seleção ou multisseleção), `Anexo` (arquivos).

**Drive:** título (empresa), `Competência` (texto), `Departamento` (seleção: Fiscal / Departamento Pessoal / Contábil), `Complemento Fiscal` (seleção), `Complemento DP` (seleção), `Arquivo` (arquivos), `Status` (status, com a opção `Concluído`).
