Cypress.automacao = {};

import 'cypress-file-upload';


/*************Requests*************/

import PropostaRequests from "./Requests/Proposta/index";
import AgendaRequests from "./Requests/agenda/index";
import FuncoesRequests from "./Funcoes/index";
import FluxoIrregularRequests from "./Requests/FluxoIrregular/index";
import ReportsRequests from "./Requests/Imprimir/index";


Cypress.automacao.Requests = {
    ...PropostaRequests,
    ...AgendaRequests,
    ...FuncoesRequests,
    ...FluxoIrregularRequests,
    ...ReportsRequests


};