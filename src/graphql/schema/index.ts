import { builder } from './builder';
import { Usuario } from './usuario';

import './clienteEmpresa';
import './empresa';
import './authentication';
import './errors';
import './imovel';

export const buildSchema = () => {
  builder.queryType({
    fields: (t) => ({
      usuario: t.field({
        type: Usuario,
        nullable: true,
        resolve: (_parent, _args, ctx) => {
          const usuarioLogado = ctx.usuarioLogado;

          if (usuarioLogado === undefined) {
            return undefined;
          }

          return {
            codigo: usuarioLogado.codigo,
            email: usuarioLogado.email,
            empresa: undefined
          };
        }
      })
    })
  });

  builder.mutationType({});

  return builder.toSchema();
};
