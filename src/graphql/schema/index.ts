import { builder } from './builder';
import { Usuario } from './usuario';

export const buildSchema = () => {
  builder.queryType({
    fields: (t) => ({
      hello: t.string({
        args: {
          name: t.arg.string()
        },
        resolve: (_parent, { name }) => `hello, ${name || 'World'}`
      }),
      usuario: t.field({
        type: Usuario,
        nullable: true,
        resolve: (_parent, _ars, ctx) => {
          return ctx.usuarioLogado;
        }
      })
    })
  });

  builder.mutationType({});

  return builder.toSchema();
};
