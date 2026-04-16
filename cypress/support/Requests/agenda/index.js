import ConsultarDetalhesRequests from "./ConsultarDetalhes";
import LancamentoParcelaRequests from "./LancamentoParcela";
import LancamentoMultiplasParcelasRequests from "./LancamentoMultiplasParcelas";
import GerarUnicaCobrancaRequests from "./GerarUnicaCobranca"
import CancelarCobrancasRequests from "./CancelarCobrancas";


const AgendaRequests = {
    ...ConsultarDetalhesRequests,
    ...LancamentoParcelaRequests,
    ...LancamentoMultiplasParcelasRequests,
    ...GerarUnicaCobrancaRequests,
    ...CancelarCobrancasRequests

}

export default {AgendaRequests};