// ==========================================
// 1. FUNÇÃO WEB
// ==========================================
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Painel de Disparos - Notion')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==========================================
// 2. CONFIGURAÇÕES 
// ==========================================
function getHeaders() {
  const token = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
  return {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };
}

function getDatabaseId() {
  return PropertiesService.getScriptProperties().getProperty('DATABASE_ID');
}

// ==========================================
// 3.  SCRIPTS 
// ==========================================
const MODELOS = {
  // FINANCEIRO
  "[FIN] 2 dias antes": {
    assunto: "Lembrete: HONORÁRIOS CONTÁBEIS - [EMPRESA]",
    texto: `Olá!

Passando para lembrar que o honorário contábil com vencimento no dia [VENCIMENTO] está se aproximando.
Valor: R$ [VALOR]

Chave PIX: 113.959.764-73

Pedimos, por gentileza, que programe o pagamento dentro do prazo para evitar pendências. Caso já tenha realizado, por favor, desconsidere esta mensagem.

Ficamos à disposição.`
  },
  "[FIN]  Dia do vencimento": {
    assunto: "Lembrete: HONORÁRIOS CONTÁBEIS - [EMPRESA]",
    texto: `Olá!

Passando para lembrar que o honorário contábil com vencimento hoje ([VENCIMENTO]) precisa ser regularizado.
Valor: R$ [VALOR]

Chave PIX: 113.959.764-73

Pedimos, por gentileza, que programe o pagamento dentro do prazo para evitar pendências. Caso já tenha realizado, por favor, desconsidere esta mensagem.

Ficamos à disposição.`
  },
  "[FIN]  Após Vencimento": {
    assunto: "Lembrete: HONORÁRIOS CONTÁBEIS - [EMPRESA]",
    texto: `Olá!

Identificamos que o honorário contábil referente à competência atual encontra-se vencido.
Valor: R$ [VALOR]

Chave PIX: 113.959.764-73

Pedimos, por gentileza, que verifique a pendência e realize o pagamento assim que possível. Caso já tenha efetuado, por favor, desconsidere esta mensagem.

Ficamos à disposição.`
  },
  "[FIN] Extratos Bancários": {
    assunto: "EXTRATOS BANCÁRIOS - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Solicitamos o envio dos extratos bancários da empresa referentes à competência de [COMPETENCIA] , esse arquivo deverá ser encaminhado em .CSV para continuidade das rotinas contábeis e financeiras.

Ficamos à disposição.`
  },
"[FIN] Emissão de Nota Fiscal": {
    assunto: "EMISSÃO DE NOTA FISCAL - [EMPRESA]",
    texto: `Olá!

Segue em anexo as notas fiscais conforme solicitado.

Em caso de dúvidas, estamos à disposição!`
  },
  // DEPARTAMENTO PESSOAL
  "[DP] INSS + FGTS": {
    assunto: "INSS + FGTS - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo as guias de INSS e FGTS referentes à competência [COMPETENCIA].

Pedimos a gentileza de efetuar os pagamentos até os vencimentos informados nas respectivas guias.

Estamos à disposição para qualquer esclarecimento.`
  },
  "[DP] Recibos de Adiantamento": {
    assunto: "RECIBOS DE ADIANTAMENTO - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo os recibos de adiantamento salarial referentes à competência [COMPETENCIA].

Qualquer dúvida, estamos à disposição.`
  },
  "[DP] Folha de Pagamento": {
    assunto: "FOLHA DE PAGAMENTO - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo:
• Extrato Mensal;
• Recibos;
• Pró-labore.

Referentes à competência [COMPETENCIA].

Qualquer dúvida ou necessidade de ajuste, permanecemos à disposição.`
  },
  "[DP] Contracheque Mensal": {
    assunto: "CONTRACHEQUE MENSAL - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo o recibo de contracheque mensal referente à competência [COMPETENCIA].

Qualquer dúvida ou necessidade de ajuste, estamos à disposição.`
  },

  // LEGALIZAÇÃO
  "[LEG] Abertura": {
    assunto: "Abertura de Empresa Concluída - [EMPRESA]",
    texto: `Prezado CLIENTE,

Temos o prazer de informar que o processo de abertura da sua empresa foi concluído com sucesso.

Agradecemos pela confiança depositada em nosso escritório para conduzir esse momento tão importante. Ficamos felizes em fazer parte do início desse novo projeto e desejamos muito sucesso nessa nova etapa.

Segue em anexo a documentação da empresa para sua conferência e utilização:
• Contrato Social;
• Cartão CNPJ;
• Demais documentos pertinentes ao processo.

Permanecemos à disposição para qualquer suporte necessário e reforçamos nosso compromisso em oferecer um atendimento seguro, ágil e de qualidade.

Atenciosamente,`
  },
  "[LEG] Alteração": {
    assunto: "Alteração Contratual Concluída - [EMPRESA]",
    texto: `Prezado CLIENTE,

Temos o prazer de informar que o processo de alteração contratual da sua empresa foi concluído com sucesso.

Agradecemos pela confiança depositada em nosso escritório para conduzir esse momento tão importante. Ficamos felizes em fazer parte do início desse novo projeto e desejamos muito sucesso nessa nova etapa.

Segue em anexo a documentação da empresa para sua conferência e utilização:
• Contrato Social;
• Cartão CNPJ;
• Demais documentos pertinentes ao processo.

Permanecemos à disposição para qualquer suporte necessário e reforçamos nosso compromisso em oferecer um atendimento seguro, ágil e de qualidade.

Atenciosamente,`
  },

  // FISCAL
  "[FIS] DMS Municipal": {
    assunto: "DMS MUNICIPAL - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo o recibo da Declaração Mensal de Serviços (DMS) Municipal referente à competência [COMPETENCIA].

Qualquer dúvida, ficamos à disposição.`
  },
  "[FIS] Simples Nacional": {
    assunto: "SIMPLES NACIONAL - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo:
• Guia DAS do Simples Nacional;
• Recibo de entrega;
• Cópia da declaração.

Referentes à competência [COMPETENCIA].

Pedimos a gentileza de realizar o pagamento até o vencimento da guia para evitar juros e multas.

Qualquer dúvida, estamos à disposição.`
  },
  "[FIS] EFD REINF + DCTFWEB": {
    assunto: "EFD REINF + DCTFWEB - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo os recibos da EFD REINF e DCTFWEB referentes à competência [COMPETENCIA].

Permanecemos à disposição para qualquer esclarecimento.`
  },
  "[FIS] EFD REINF": {
    assunto: "EFD REINF - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo os recibos da EFD REINF referentes à competência [COMPETENCIA].

Permanecemos à disposição para qualquer esclarecimento.`
  },
  "[FIS] DCTFWEB": {
    assunto: "DCTFWEB - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo os recibos da DCTFWEB referentes à competência [COMPETENCIA].

Permanecemos à disposição para qualquer esclarecimento.`
  },
  "[FIS] DAS MEI": {
    assunto: "DAS MEI - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo a guia referente ao DAS MEI da competência [COMPETENCIA].

Pedimos atenção à data de vencimento para evitar encargos.

Qualquer dúvida, estamos à disposição.`
  },
  "[FIS] Parcelamento": {
    assunto: "PARCELAMENTO - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo as guias referentes aos parcelamentos da competência [COMPETENCIA].

Pedimos atenção às datas de vencimentos para evitar encargos.

Qualquer dúvida, estamos à disposição.`
  },
  "[FIS] ICMS Fronteira + DESTDA": {
    assunto: "ICMS FRONTEIRA + DESTDA - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo os recibos do ICMS Fronteira e DESTDA referentes à competência [COMPETENCIA].

Ficamos à disposição para qualquer suporte necessário.`
  },
  "[FIS] Certidões Negativas": {
    assunto: "CERTIDÕES NEGATIVAS - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Realizamos a verificação dos DTEs da esfera Federal, Estadual e Municipal.

Segue em anexo as certidões negativas atualizadas da empresa referentes à competência [COMPETENCIA].

Qualquer dúvida, permanecemos à disposição.`
  },
    "[FIS] EFD Contribuições": {
    assunto: "EFD CONTRIBUIÇÕES - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo o recibo referente à entrega da declaração EFD Contribuições da competência [COMPETENCIA].

Qualquer dúvida, estamos à disposição.`
  },
  "[FIS] SPED ICMS / IPI": {
    assunto: "SPED ICMS / IPI - Competência: [COMPETENCIA] - [EMPRESA]",
    texto: `Olá!

Segue em anexo o recibo referente à entrega da declaração SPED ICMS / IPI da competência [COMPETENCIA].

Qualquer dúvida, estamos à disposição.`
  }
};

// ==========================================
// 4. FUNÇÃO PRINCIPAL: DISPARAR EMAILS
// ==========================================
function dispararEmails() {
  const url = `https://api.notion.com/v1/databases/${getDatabaseId()}/query`;
  const headers = getHeaders();
  
  let resultados = [];
  let temMais = true;
  let proximoCursor = undefined;

  while (temMais) {
    let payload = { filter: { property: "Status", select: { equals: "Pendente" } } };
    if (proximoCursor) { payload.start_cursor = proximoCursor; }
    
    let options = {
      method: 'post',
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    let response = UrlFetchApp.fetch(url, options);
    let data = JSON.parse(response.getContentText());

    if (data.results && data.results.length > 0) {
      resultados = resultados.concat(data.results);
    }
    temMais = data.has_more;
    proximoCursor = data.next_cursor;
  }

  if (resultados.length === 0) {
    return "Nenhum e-mail com status 'Pendente' foi encontrado no momento.";
  }

  let enviadosComSucesso = 0;
  let falhas = 0;

  resultados.forEach(page => {
    const props = page.properties;
    const pageId = page.id;

    try {
      const destinatario = props["Email"] && props["Email"].email ? props["Email"].email : null;
      const empresa = props["Empresa"] && props["Empresa"].title.length > 0 ? props["Empresa"].title[0].plain_text : "Cliente";
      const scriptSelecionado = props["Script"] && props["Script"].select ? props["Script"].select.name : null;
      
      let vencimento = "";
      if (props["Vencimento"] && props["Vencimento"].rich_text && props["Vencimento"].rich_text.length > 0) {
        vencimento = props["Vencimento"].rich_text[0].plain_text.trim();
      }
      const isVencimentoValido = (vencimento !== "" && vencimento.toLowerCase() !== "nulo");

      let valor = "";
      if (props["Valor"] && props["Valor"].number !== null && props["Valor"].number !== undefined) {
        valor = props["Valor"].number.toString();
      }
      const isValorValido = (valor !== "" && valor.toLowerCase() !== "nulo");

      let competencia = "";
      if (props["Competência"] && props["Competência"].rich_text && props["Competência"].rich_text.length > 0) {
        competencia = props["Competência"].rich_text[0].plain_text.trim();
      } else if (props["Competencia"] && props["Competencia"].rich_text && props["Competencia"].rich_text.length > 0) {
        competencia = props["Competencia"].rich_text[0].plain_text.trim();
      }
      const isCompetenciaValida = (competencia !== "" && competencia.toLowerCase() !== "nulo");
      
      let emailsCopia = null;
      if (props["CC"]) {
        if (props["CC"].select) { emailsCopia = props["CC"].select.name; } 
        else if (props["CC"].multi_select && props["CC"].multi_select.length > 0) {
          emailsCopia = props["CC"].multi_select.map(item => item.name).join(','); 
        }
      }

      if (!destinatario) {
        atualizarStatusNotion(pageId, "Erro");
        throw new Error(`Empresa ${empresa} sem e-mail cadastrado.`);
      }
      if (!scriptSelecionado || !MODELOS[scriptSelecionado]) {
        atualizarStatusNotion(pageId, "Erro");
        throw new Error(`Script '${scriptSelecionado}' não encontrado.`);
      }

      const scriptCorreto = MODELOS[scriptSelecionado];
      let assuntoFormatado = scriptCorreto.assunto.replace(/\[EMPRESA\]/g, empresa);
      let mensagemFormatada = scriptCorreto.texto.replace(/\[EMPRESA\]/g, empresa);

      // Tratamento de Tags
      if (isVencimentoValido) {
        assuntoFormatado = assuntoFormatado.replace(/\[VENCIMENTO\]/g, vencimento);
        mensagemFormatada = mensagemFormatada.replace(/\[VENCIMENTO\]/g, vencimento);
      } else {
        mensagemFormatada = mensagemFormatada.replace(/ com vencimento no dia \[VENCIMENTO\]/gi, '');
        mensagemFormatada = mensagemFormatada.replace(/ com vencimento hoje \(\[VENCIMENTO\]\)/gi, '');
      }

      if (isValorValido) {
        mensagemFormatada = mensagemFormatada.replace(/\[VALOR\]/g, valor);
      } else {
        mensagemFormatada = mensagemFormatada.replace(/^Valor:\s*R\$\s*\[VALOR\]\r?\n?/gm, '');
      }

      if (isCompetenciaValida) {
        assuntoFormatado = assuntoFormatado.replace(/\[COMPETENCIA\]/g, competencia);
        mensagemFormatada = mensagemFormatada.replace(/\[COMPETENCIA\]/g, competencia);
      } else {
        assuntoFormatado = assuntoFormatado.replace(/\s*-\s*Competência:\s*\[COMPETENCIA\]/gi, '');
        mensagemFormatada = mensagemFormatada.replace(/\s*referente(s)? à competência \[COMPETENCIA\]/gi, '');
        mensagemFormatada = mensagemFormatada.replace(/\s*da competência \[COMPETENCIA\]/gi, '');
        mensagemFormatada = mensagemFormatada.replace(/^Referentes à competência \[COMPETENCIA\]\.\r?\n?/gm, '');
      }

      // Limpa espaços vazios excessivos deixados pela exclusão de frases
      mensagemFormatada = mensagemFormatada.replace(/\n{3,}/g, '\n\n');

      // Processamento de Anexos
      let arquivosParaEnviar = [];
      const colunaAnexo = props["Anexo"];
      
      if (colunaAnexo && colunaAnexo.files && colunaAnexo.files.length > 0) {
        colunaAnexo.files.forEach(arquivo => {
          try {
            let urlDownload = "";
            if (arquivo.type === "file") urlDownload = arquivo.file.url;
            else if (arquivo.type === "external") urlDownload = arquivo.external.url;
            
            if (urlDownload) {
              const blobArquivo = UrlFetchApp.fetch(urlDownload).getBlob().setName(arquivo.name);
              arquivosParaEnviar.push(blobArquivo);
            }
          } catch (erroDownload) {
            Logger.log(`⚠️ Anexo ${arquivo.name} não pôde ser baixado.`);
          }
        });
      }

      let opcoesExtras = {};
      if (emailsCopia) opcoesExtras.cc = emailsCopia; 
      if (arquivosParaEnviar.length > 0) opcoesExtras.attachments = arquivosParaEnviar;

      // -------------------------------------------------------------
      // NOVIDADE: Converte o texto para HTML para garantir os parágrafos 
      // -------------------------------------------------------------
      opcoesExtras.htmlBody = mensagemFormatada.replace(/\n/g, '<br>');

      // Disparo do E-mail
      GmailApp.sendEmail(destinatario, assuntoFormatado, mensagemFormatada, opcoesExtras);
      
      atualizarStatusNotion(pageId, "Enviado");
      enviadosComSucesso++;

    } catch (erro) {
      Logger.log(`❌ Erro no envio (${pageId}): ${erro.message}`);
      falhas++;
    }
  });

  let resultadoFinal = `Disparo finalizado. ${enviadosComSucesso} e-mail(s) enviado(s) com sucesso.`;
  if (falhas > 0) {
    resultadoFinal += ` Tivemos ${falhas} falha(s). Verifique os cards com status 'Erro' no Notion.`;
  }
  
  return resultadoFinal;
}

// ==========================================
// 5. FUNÇÃO: ATUALIZAR STATUS NO NOTION
// ==========================================
function atualizarStatusNotion(pageId, novoStatus) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  const payload = { 
    properties: { "Status": { select: { name: novoStatus } } } 
  };
  const options = { 
    method: 'patch', 
    headers: getHeaders(), 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  
  UrlFetchApp.fetch(url, options);
}
