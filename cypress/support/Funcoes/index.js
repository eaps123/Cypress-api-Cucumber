import ExcluirCamposJsonFuncoes from "./ExcluirCamposJson";
import GerarDataMesSeguinteFuncoes from "./GerarDataMesSeguinte";
import GerarNomesAleatoriosFuncoes from "./GerarNomesAleatorios";
import RepetirRequisicaoFuncoes from "./RepetirRequisicao";
import SobrescreverCamposJsonFuncoes from "./SobrescreverCamposJson";
import gerarAuth from "./Auth";
import ExecutarCaso from "./ExecutarCaso";
import SalvarJsonUnico from "./SalvarJsonUnico";
import GerarParcelas from "./GerarParcelas";
import VerificarParcelasConsultarDetalhes from "./VerificarParcelasConsultarDetalhes";
import setPropostaEnv from "./SalvarPropostaEnv";
import setNested from "./Nested";
import fillPessoaDTO from "./FillPessoaDTO";
import AtribuirArraysDTO from "./AtribuirArrays";
export { default as gerarAuth } from "./Auth";
export * from "./SaveRequestAndResponseFiles";
export * from "./ParseValue";
export * from "./ReplaceScenario";
export * from "./FindKeyCaseInsensitive";
export * from "./EnsureCodigoOperacao";
export * from "./DeepClone";
export * from "./FindKeyCI";
import * as _all from "./";

const FuncoesRequests = {
    ExcluirCamposJsonFuncoes,
    GerarDataMesSeguinteFuncoes,
    GerarNomesAleatoriosFuncoes,
    RepetirRequisicaoFuncoes,
    SobrescreverCamposJsonFuncoes,
    gerarAuth,
    ExecutarCaso,
    SalvarJsonUnico,
    GerarParcelas,
    setPropostaEnv,
    AtribuirArraysDTO,
    fillPessoaDTO,
    setNested,
    VerificarParcelasConsultarDetalhes,
    ..._all
}

export default FuncoesRequests;