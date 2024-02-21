import { builder } from './builder';
import { Imovel, ImovelType } from './imovel';

export interface ClienteEmpresaType {
  codigo: string;
  nome: string;
  sobrenome: string;
  imoveis: ImovelType[];
}

export const ClienteEmpresa = builder
  .objectRef<ClienteEmpresaType>('ClienteEmpresa')
  .implement({
    description: 'Informações de um cliente.',
    fields: (t) => ({
      codigo: t.exposeString('codigo'),
      nome: t.exposeString('nome'),
      sobrenome: t.exposeString('sobrenome'),
      imoveis: t.field({
        type: [Imovel],
        resolve: async (parent, args, ctx) => {
          const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

          if (!codigoUsuarioSolicitante) {
            throw new Error('Usuário não autenticado');
          }

          const imoveis = await ctx.useCases.imovel.obterImoveisDono({
            codigoUsuarioSolicitante,
            codigoDono: parent.codigo
          });

          return imoveis.map((imovel) => ({ ...imovel, anuncio: undefined }));
        }
      })
    })
  });
