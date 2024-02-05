import { BusinessError } from '@/shared/errors/BusinessError';
import { Usuario as UsuarioBase, builder } from './builder';
import { Empresa } from './empresa';

interface UsuarioType extends UsuarioBase {
  empresa: Empresa | undefined;
}

export const Usuario = builder.objectRef<UsuarioType>('Usuario').implement({
  description: 'Informações do usuário',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    email: t.exposeString('email'),
    empresa: t.field({
      type: Empresa,
      nullable: true,
      description: 'Empresa na qual o usuário está associado.',
      resolve: async (parent, _args, ctx) => {
        const empresaAssociada =
          await ctx.useCases.usuario.obterEmpresaAssociada(parent.codigo);

        if (empresaAssociada === undefined) {
          return undefined;
        }

        return {
          codigo: empresaAssociada.codigo,
          nomeFantasia: empresaAssociada.nomeFantasia,
          razaoSocial: empresaAssociada.razaoSocial,
          cnpj: empresaAssociada.cnpj,
          clientes: []
        };
      }
    })
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
        email: criarPessoaEUsuarioResult.email,
        empresa: undefined
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
    resolve: async (_parent, { email, senha, confirmacaoSenha }, context) => {
      const result = await context.useCases.usuario.alterarSenha({
        email,
        senha,
        confirmacaoSenha
      });

      return { ...result, empresa: undefined };
    }
  })
);
