import { BusinessError } from '@/errors/BusinessError';
import { Usuario as UsuarioType, builder } from './builder';

export const Usuario = builder.objectRef<UsuarioType>('Usuario').implement({
  description: 'Informações do usuário',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    email: t.exposeString('email')
  })
});

builder.mutationField('criarPessoaEUsuario', (t) =>
  t.field({
    type: Usuario,
    errors: {
      types: [Error, BusinessError]
    },
    args: {
      nome: t.arg.string({ required: true }),
      sobrenome: t.arg.string({ required: true }),
      cpf: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
      senha: t.arg.string({ required: true }),
      confirmacaoSenha: t.arg.string({ required: true })
    },
    resolve: async (
      _parent,
      { nome, sobrenome, cpf, email, senha, confirmacaoSenha },
      context
    ) => {
      const criarPessoaEUsuarioResult =
        await context.useCases.usuarioPessoa.criarPessoaEUsuario({
          nome,
          sobrenome,
          cpf,
          email,
          senha,
          confirmacaoSenha
        });

      return {
        codigo: criarPessoaEUsuarioResult.codigoUsuario,
        email: criarPessoaEUsuarioResult.email
      };
    }
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
