// ===================================================================
// API WEB — chamada pela página hospedada na Vercel
// ===================================================================
// Implantar como App da Web:
//   Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
// A proteção é feita pela propriedade do script PAINEL_SENHA.
//
// Ações aceitas no campo "acao" do POST:
//   emails        → dispararEmails()                 (Emails.gs)
//   drive-caminho → criarCaminhosPendentesWeb()      (Drive.gs)
//   drive-enviar  → processarNotionParaDriveWeb()    (Drive.gs)
// ===================================================================

const ACOES = {
  'emails':        () => ({ mensagem: dispararEmails() }),
  'drive-caminho': () => criarCaminhosPendentesWeb(),
  'drive-enviar':  () => processarNotionParaDriveWeb()
};

function doGet() {
  return responderJson({ ok: true, mensagem: 'API do Painel de Automações ativa.' });
}

function doPost(e) {
  let corpo = {};
  try {
    corpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (erro) {
    return responderJson({ ok: false, mensagem: 'Requisição inválida.' });
  }

  const senhaCorreta = PropertiesService.getScriptProperties().getProperty('PAINEL_SENHA');
  if (!senhaCorreta || corpo.senha !== senhaCorreta) {
    return responderJson({ ok: false, mensagem: 'Senha incorreta.' });
  }

  const executar = ACOES[corpo.acao];
  if (!executar) {
    return responderJson({ ok: false, mensagem: `Ação '${corpo.acao}' desconhecida.` });
  }

  // Evita dois processamentos ao mesmo tempo (clique duplo, duas abas abertas)
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return responderJson({ ok: false, mensagem: 'Já existe um processamento em andamento. Aguarde terminar.' });
  }

  try {
    return responderJson(Object.assign({ ok: true }, executar()));
  } catch (erro) {
    return responderJson({ ok: false, mensagem: erro.message });
  } finally {
    lock.releaseLock();
  }
}

function responderJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
