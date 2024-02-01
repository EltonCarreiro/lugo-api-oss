import { Usuario as UsuarioType, builder } from './builder';

export const Usuario = builder.objectRef<UsuarioType>('Usuario').implement({
  description: 'Informações do usuário',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    email: t.exposeString('email')
  })
});

builder.mutationField('criarUsuario', (t) =>
  t.field({
    type: Usuario,
    args: {
      codigoPessoa: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
      senha: t.arg.string({ required: true }),
      confirmacaoSenha: t.arg.string({ required: true })
    },
    resolve: (
      _parent,
      { codigoPessoa, email, senha, confirmacaoSenha },
      context
    ) =>
      context.useCases.usuario.criarUsuario({
        codigoPessoa,
        email,
        senha,
        confirmacaoSenha
      })
  })
);

builder.mutationField('alterarSenha', (t) =>
  t.field({
    type: Usuario,
    args: {
      email: t.arg.string({ required: true }),
      senha: t.arg.string({ required: true }),
      confirmacaoSenha: t.arg.string({ required: true })
    },
    resolve: (_parent, { email, senha, confirmacaoSenha }, context) =>
      context.useCases.usuario.alterarSenha({
        email,
        senha,
        confirmacaoSenha
      })
  })
);
