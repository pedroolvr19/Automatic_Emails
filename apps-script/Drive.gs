// ===================================================================
// AUTOMAÇÃO: NOTION → DRIVE
// Propriedades do script:
//   NOTION_TOKEN_DRIVE       → token da integração do Notion usada no Drive
//   NOTION_DATABASE_ID       → ID do database de tarefas no Notion
//   DRIVE_EMPRESAS_FOLDER_ID → ID da pasta fixa "Empresas" no Drive
// ===================================================================

const PROP_COMPETENCIA = 'Competência';
const PROP_STATUS = 'Status';
const PROP_ARQUIVO = 'Arquivo';
const PROP_DEPARTAMENTO = 'Departamento';
const PROP_REGIME = 'Complemento Fiscal';
const PROP_COMPLEMENTO_DP = 'Complemento DP';
const STATUS_FEITO = 'Concluído';

// Continuação fixa de pastas depois da Competência — só pros departamentos
// que NÃO usam escolha única (Fiscal usa Complemento Fiscal, DP usa Complemento DP).
const SEGMENTOS_FIXOS_POR_DEPARTAMENTO = {
  'Contábil': ['Extrato', 'Relatório']
};

// ===================================================================
// AÇÕES CHAMADAS PELA API (Api.gs)
// ===================================================================

/**
 * Botão "Criar caminho": cria a estrutura de pastas de todas as linhas
 * pendentes, sem exigir nem enviar arquivo.
 */
function criarCaminhosPendentesWeb() {
  const tarefas = buscarTarefasNaoConcluidas();
  const resultados = tarefas.map(criarCaminhoLinha);
  return { total: tarefas.length, resultados: resultados };
}

/**
 * Botão "Enviar arquivo": baixa e salva no Drive todos os arquivos
 * anexados nas linhas pendentes, e marca cada linha como Concluído.
 */
function processarNotionParaDriveWeb() {
  const pendentes = buscarTarefasPendentes();
  const resultados = pendentes.map(processarLinhaNotionComResultado);
  return { total: pendentes.length, resultados: resultados };
}

// ===================================================================
// NOTION — leitura
// ===================================================================

function notionRequest(metodo, endpoint, payload) {
  const scriptProps = PropertiesService.getScriptProperties();
  const token = scriptProps.getProperty('NOTION_TOKEN_DRIVE') || scriptProps.getProperty('NOTION_TOKEN');
  const options = {
    method: metodo,
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28'
    },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);

  const response = UrlFetchApp.fetch(`https://api.notion.com/v1/${endpoint}`, options);
  const data = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    Logger.log(`ERRO Notion (${endpoint}): ` + JSON.stringify(data));
    return null;
  }
  return data;
}

function buscarTarefasNaoConcluidas() {
  const databaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID');
  const data = notionRequest('post', `databases/${databaseId}/query`, {
    filter: { property: PROP_STATUS, status: { does_not_equal: STATUS_FEITO } }
  });
  return data ? data.results : [];
}

function buscarTarefasPendentes() {
  const databaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID');
  const data = notionRequest('post', `databases/${databaseId}/query`, {
    filter: {
      and: [
        { property: PROP_STATUS, status: { does_not_equal: STATUS_FEITO } },
        { property: PROP_ARQUIVO, files: { is_not_empty: true } }
      ]
    }
  });
  return data ? data.results : [];
}

function marcarTarefaComoFeita(pageId) {
  const data = notionRequest('patch', `pages/${pageId}`, {
    properties: { [PROP_STATUS]: { status: { name: STATUS_FEITO } } }
  });
  return data !== null;
}

function lerTexto(props, nomePropriedade) {
  const prop = props[nomePropriedade];
  if (!prop || !prop.rich_text || prop.rich_text.length === 0) return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

function lerSelect(props, nomePropriedade) {
  const prop = props[nomePropriedade];
  if (!prop || !prop.select) return '';
  return prop.select.name;
}

/**
 * Lê o valor da coluna do tipo Título (é sempre única no Notion e não
 * pode ser removida, então identificamos pelo TIPO, não pelo nome —
 * funciona mesmo que você renomeie a coluna no futuro).
 */
function lerTitulo(props) {
  for (const nome in props) {
    if (props[nome].type === 'title') {
      const titulo = props[nome].title;
      return titulo.length > 0 ? titulo.map(t => t.plain_text).join('') : '';
    }
  }
  return '';
}

// ===================================================================
// DRIVE — organização de pastas
// ===================================================================

function getOuCriaSubpasta(pastaPai, nomeSubpasta) {
  const existentes = pastaPai.getFoldersByName(nomeSubpasta);
  return existentes.hasNext() ? existentes.next() : pastaPai.createFolder(nomeSubpasta);
}

function construirCaminho(pastaRaiz, segmentos) {
  let pastaAtual = pastaRaiz;
  for (const segmento of segmentos) {
    pastaAtual = getOuCriaSubpasta(pastaAtual, segmento);
  }
  return pastaAtual;
}

/**
 * Monta os segmentos que vêm DEPOIS da Competência, de acordo com o departamento.
 * Fiscal e Departamento Pessoal usam escolha única (Complemento Fiscal / Complemento DP).
 * Os demais usam a lista fixa em SEGMENTOS_FIXOS_POR_DEPARTAMENTO.
 * Retorna null se faltar informação obrigatória.
 */
function obterSegmentosFinais(departamento, regime, complementoDP) {
  if (departamento === 'Fiscal') {
    return regime ? [regime] : null;
  }
  if (departamento === 'Departamento Pessoal') {
    return complementoDP ? [complementoDP] : null;
  }
  const segmentosFixos = SEGMENTOS_FIXOS_POR_DEPARTAMENTO[departamento];
  if (!segmentosFixos) {
    Logger.log(`Departamento sem mapeamento de pastas: ${departamento}`);
    return null;
  }
  return segmentosFixos;
}

// ===================================================================
// PROCESSAMENTO POR LINHA
// ===================================================================

/**
 * Lê os campos comuns de uma linha e monta o caminho de pastas.
 * Retorna { erro } ou { caminho }.
 */
function prepararLinha(pagina) {
  const props = pagina.properties;

  const cliente = lerTitulo(props);
  const competencia = lerTexto(props, PROP_COMPETENCIA);
  const departamento = lerSelect(props, PROP_DEPARTAMENTO);
  const regime = lerSelect(props, PROP_REGIME);
  const complementoDP = lerSelect(props, PROP_COMPLEMENTO_DP);

  if (!cliente || !competencia || !departamento) {
    return { erro: `Linha incompleta (id: ${pagina.id}) — falta Empresa (título), Competência ou Departamento` };
  }

  const segmentosFinais = obterSegmentosFinais(departamento, regime, complementoDP);
  if (!segmentosFinais) {
    let motivo;
    if (departamento === 'Fiscal') motivo = `preencha "${PROP_REGIME}"`;
    else if (departamento === 'Departamento Pessoal') motivo = `preencha "${PROP_COMPLEMENTO_DP}"`;
    else motivo = 'departamento sem pastas configuradas em SEGMENTOS_FIXOS_POR_DEPARTAMENTO';
    return { erro: `${cliente} / ${departamento}: ${motivo} (id: ${pagina.id})` };
  }

  return { caminho: [cliente, departamento, competencia, ...segmentosFinais] };
}

/**
 * Botão "Criar caminho": cria a pasta sem mexer em arquivo.
 */
function criarCaminhoLinha(pagina) {
  const preparo = prepararLinha(pagina);
  if (preparo.erro) return { sucesso: false, mensagem: preparo.erro };

  const rootId = PropertiesService.getScriptProperties().getProperty('DRIVE_EMPRESAS_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootId);
  construirCaminho(rootFolder, preparo.caminho);

  return { sucesso: true, mensagem: `Empresas/${preparo.caminho.join('/')}` };
}

/**
 * Botão "Enviar arquivo": baixa TODOS os arquivos anexados na linha
 * e salva cada um no caminho correspondente.
 */
function processarLinhaNotionComResultado(pagina) {
  const props = pagina.properties;
  const arquivos = props[PROP_ARQUIVO].files;

  if (!arquivos || arquivos.length === 0) {
    return { sucesso: false, mensagem: `Sem arquivo anexado (id: ${pagina.id})` };
  }

  const preparo = prepararLinha(pagina);
  if (preparo.erro) return { sucesso: false, mensagem: preparo.erro };

  const rootId = PropertiesService.getScriptProperties().getProperty('DRIVE_EMPRESAS_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootId);
  const pastaDestino = construirCaminho(rootFolder, preparo.caminho);

  const enviados = [];
  const erros = [];

  arquivos.forEach(function(arquivoInfo) {
    const urlArquivo = arquivoInfo.type === 'file' ? arquivoInfo.file.url : arquivoInfo.external.url;
    const nomeOriginal = arquivoInfo.name;

    const response = UrlFetchApp.fetch(urlArquivo, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      erros.push(`${nomeOriginal} (HTTP ${response.getResponseCode()})`);
      return;
    }

    const blob = response.getBlob().setName(nomeOriginal);
    pastaDestino.createFile(blob);
    enviados.push(nomeOriginal);
  });

  if (enviados.length > 0 && erros.length === 0) {
    marcarTarefaComoFeita(pagina.id);
    return {
      sucesso: true,
      mensagem: `${enviados.length} arquivo(s) → Empresas/${preparo.caminho.join('/')}: ${enviados.join(', ')}`
    };
  }

  if (enviados.length > 0 && erros.length > 0) {
    return {
      sucesso: false,
      mensagem: `Envio parcial (id: ${pagina.id}) — ok: ${enviados.join(', ')} | falharam: ${erros.join(', ')}`
    };
  }

  return { sucesso: false, mensagem: `Nenhum arquivo enviado (id: ${pagina.id}) — erros: ${erros.join(', ')}` };
}

// ===================================================================
// DIAGNÓSTICO (rodar manualmente pelo editor quando algo não funcionar)
// ===================================================================

function diagnosticar() {
  Logger.log('--- Conexão Notion ---');
  const databaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID');
  const dbInfo = notionRequest('get', `databases/${databaseId}`);
  if (dbInfo) {
    Logger.log('OK. Propriedades encontradas:');
    for (const nome in dbInfo.properties) {
      Logger.log(`- "${nome}" (${dbInfo.properties[nome].type})`);
    }
  }

  Logger.log('--- Pasta Empresas no Drive ---');
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_EMPRESAS_FOLDER_ID');
  try {
    const folder = DriveApp.getFolderById(folderId);
    Logger.log('OK. Pasta: ' + folder.getName());
  } catch (e) {
    Logger.log('ERRO: ' + e.message);
  }
}
