interface CriarAnuncioArgs {
  codigoUsuarioSolicitante: string;
  codigoImovel: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

export class AnuncioUseCases {
  public criarAnuncio(_args: CriarAnuncioArgs) {
    // buscar imóvel, caso não encontre, reportar erro
    // criar anúncio e associar ao imóvel
    // retornar código do anúncio
  }
}
