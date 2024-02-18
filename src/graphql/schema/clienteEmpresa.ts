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
        args: {
          codigoDono: t.arg.string({ required: true })
        },
        resolve: async (_, args, ctx) => {
          const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

          if (!codigoUsuarioSolicitante) {
            throw new Error('Usuário não autenticado');
          }

          return ctx.useCases.imovel.obterImoveisDono({
            codigoUsuarioSolicitante,
            codigoDono: args.codigoDono
          });
        }
      })
    })
  });
