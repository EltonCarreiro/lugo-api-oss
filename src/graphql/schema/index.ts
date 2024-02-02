import { builder } from './builder';
import { Usuario } from './usuario';

import './authentication';
import './errors';

export const buildSchema = () => {
  builder.queryType({
    fields: (t) => ({
      usuario: t.field({
        type: Usuario,
        nullable: true,
        resolve: (_parent, _args, ctx) => {
          return ctx.usuarioLogado;
        }
      })
    })
  });

  builder.mutationType({});

  return builder.toSchema();
};
