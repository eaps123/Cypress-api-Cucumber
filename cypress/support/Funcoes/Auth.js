function gerarAuth(padrao = "INTEGRACAO_CREDITO") {

  const integracoes = {
    
    QA_INTEGRATION_EVERTON: {
      Usuario: "everton.pedro@moneyp.com.br",
      Senha: "Sucesso@2021",
      CodigoParametro: "QA_INTEGRATION_EVERTON",
      Chave: "c08fb00b-888e-4f9a-98dd-d501bc490f19"
    },
    INTEGRACAO_CREDITO: {
      Usuario: "integracao.credito@fulltechpro.com.br",
      Senha: "Integracao@20252",
      CodigoParametro: "INTEGRACAO_CREDITO",
      Chave: "8a4c7f43-20f9-400b-819e-8250f6660037"
    },
    INTEGRACAO_AUTOMACAO_AGENDA: {
      Usuario: "automacao.agenda1@gmail.com",
      Senha: "Automacaoagenda1!",
      CodigoParametro: "INTEGRACAO_AUTOMACAO_AGENDA",
      Chave: "2db5bdab-e84b-40ed-91aa-35dc08ff0a43"        
    },
      INTEGRACAO_AUTOMACAO_AGENDA_IMPACTO_FINANCEIRO: {
      Usuario: "automacao.agenda1@gmail.com",
      Senha: "Automacaoagenda1!",
      CodigoParametro: "INTEGRACAO_AUTOMACAO_AGENDA_IMPACTO_FINANCEIRO",
      Chave: "2db5bdab-e84b-40ed-91aa-35dc08ff0a43"        
    },
    INTEGRACAO_AUTOMACAO_PARTNER: {
      Usuario: "automacao.agenda1@gmail.com",
      Senha: "Automacaoagenda1!",
      CodigoParametro: "INTEGRACAO_AUTOMACAO_AGENDA",
      Chave: "2db5bdab-e84b-40ed-91aa-35dc08ff0a43"        
    },
    JOSE_TESTE_INTEGRACAO: {
      Usuario: "jose.crema@fulltechpro.com.br",
      Senha: "-----",
      CodigoParametro: "JOSE_TESTE_INTEGRACAO",
      Chave: "79aef6c8-7429-4dfc-b4bd-f5ca42962df0"        
    }
  };

  return integracoes[padrao];
}
export default gerarAuth;
