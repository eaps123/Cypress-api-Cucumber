import IncluirPropostaManualRequests from "./Inclusao/IncluirPropostaManual";
import IncluirPropostaRequests from "./IncluirProposta";
import PropostaFinalizarRequests from "./PropostaFinalizar";
import SimulacaoValorParcelaRequests from "./SimulacaoValorParcela";
import CalculaGridParcelasSimplificadoSACRequests from "./CalculaGridParcelasSimplificadoSAC";
import IncluirPropostaManualSACRequests from "./Inclusao/IncluirPropostaManualSAC";
import LimiteEspecialRequests from "./LimiteEspecial";
import IncluirPropostaManualSimplificadoSACRequests from "./Inclusao/IncluirPropostaManualSimplificadoSAC";
import IncluirPropostaManualSimplificadoPriceRequests from "./Inclusao/IncluirPropostaManualSimplificadoPrice";
import IncluirPropostaManualSimplificadoRequests from "./Inclusao/IncluirPropostaManualSimplificado";
import * as FuncoesRequests from '../../Funcoes/index';


const PropostaRequests = {
    ...IncluirPropostaManualRequests,
    ...IncluirPropostaRequests,
    ...PropostaFinalizarRequests,
    ...FuncoesRequests,
    ...IncluirPropostaManualSimplificadoSACRequests,
    ...IncluirPropostaManualSimplificadoPriceRequests,
    ...SimulacaoValorParcelaRequests,
    ...CalculaGridParcelasSimplificadoSACRequests,
    ...IncluirPropostaManualSACRequests,
    ...LimiteEspecialRequests,
    ...IncluirPropostaManualSimplificadoRequests

}

export default {PropostaRequests};
