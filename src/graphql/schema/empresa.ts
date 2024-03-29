import { BusinessError } from '@/shared/errors/BusinessError';
import { builder } from './builder';
import { ClienteEmpresa, ClienteEmpresaType } from './clienteEmpresa';

export interface Empresa {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  clientes: ClienteEmpresaType[];
}

export const Empresa = builder.objectRef<Empresa>('Empresa').implement({
  description: 'Informações da empresa e seus respectivos dados',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    nomeFantasia: t.exposeString('nomeFantasia'),
    razaoSocial: t.exposeString('razaoSocial'),
    cnpj: t.exposeString('cnpj'),
    clientes: t.field({
      type: [ClienteEmpresa],
      description: 'Todos os clientes da empresa.',
      resolve: async (parent, _args, ctx) => {
        const usuario = ctx.usuarioLogado;

        if (usuario === undefined) {
          throw new Error('Não autenticado.');
        }

        const clientes = await ctx.useCases.empresa.listarClientes({
          codigoEmpresa: parent.codigo,
          codigoUsuarioSolicitante: usuario.codigo
        });

        return clientes.map((cliente) => ({ ...cliente, imoveis: [] }));
      }
    })
  })
});

builder.mutationField('criarEmpresa', (t) =>
  t.field({
    type: Empresa,
    description: 'Cria uma empresa e associa o usuário criado a mesma.',
    args: {
      nomeFantasia: t.arg.string({ required: true }),
      razaoSocial: t.arg.string({ required: true }),
      cnpj: t.arg.string({ required: true })
    },
    errors: {
      types: [Error, BusinessError]
    },
    resolve: async (_parent, { nomeFantasia, razaoSocial, cnpj }, ctx) => {
      const usuarioLogado = ctx.usuarioLogado;

      if (usuarioLogado === undefined) {
        throw new Error('Usuário não autenticado.');
      }

      const result = await ctx.useCases.empresa.criarEmpresa({
        nomeFantasia,
        razaoSocial,
        cnpj,
        codigoUsuarioCriador: usuarioLogado.codigo
      });

      return {
        codigo: result.codigo,
        nomeFantasia: result.nomeFantasia,
        razaoSocial: result.razaoSocial,
        cnpj: result.cnpj,
        clientes: []
      };
    }
  })
);

builder.mutationField('alterarEmpresa', (t) =>
  t.field({
    type: Empresa,
    description: 'Permite alterar informações da empresa',
    errors: {
      types: [Error, BusinessError]
    },
    args: {
      codigo: t.arg.string({ required: true }),
      nomeFantasia: t.arg.string({ required: true }),
      razaoSocial: t.arg.string({ required: true }),
      cnpj: t.arg.string({ required: true })
    },
    resolve: async (_parent, args, ctx) => {
      const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

      if (codigoUsuarioSolicitante === undefined) {
        throw new Error('Usuário não autenticado.');
      }

      const result = await ctx.useCases.empresa.alterarEmpresa({
        codigoUsuarioSolicitante,
        codigo: args.codigo,
        cnpj: args.cnpj,
        nomeFantasia: args.nomeFantasia,
        razaoSocial: args.razaoSocial
      });

      return { ...result, clientes: [] };
    }
  })
);

builder.mutationField('cadastrarCliente', (t) =>
  t.field({
    description: 'Cadastrar um novo cliente na empresa',
    args: {
      cpf: t.arg.string({ required: true }),
      nome: t.arg.string({ required: true }),
      sobrenome: t.arg.string({ required: true })
    },
    errors: {
      types: [Error, BusinessError]
    },
    type: ClienteEmpresa,
    resolve: async (_parent, { cpf, nome, sobrenome }, ctx) => {
      const usuarioLogado = ctx.usuarioLogado;

      if (usuarioLogado === undefined) {
        throw new Error('Usuário não autenticado.');
      }

      const result = await ctx.useCases.empresa.cadastrarCliente({
        codigoUsuarioRequisitante: usuarioLogado.codigo,
        cpf,
        nome,
        sobrenome
      });

      return { ...result, imoveis: [] };
    }
  })
);

builder.mutationField('alterarCliente', (t) =>
  t.field({
    type: ClienteEmpresa,
    description: 'Permite alterar informações do cliente da empresa',
    args: {
      codigo: t.arg.string({ required: true }),
      cpf: t.arg.string({ required: true }),
      nome: t.arg.string({ required: true }),
      sobrenome: t.arg.string({ required: true })
    },
    errors: {
      types: [Error, BusinessError]
    },
    resolve: async (_parent, args, ctx) => {
      const usuarioLogado = ctx.usuarioLogado;

      if (usuarioLogado === undefined) {
        throw new Error('Usuário não autenticado.');
      }

      const result = await ctx.useCases.empresa.alterarCliente({
        codigoUsuarioRequisitante: usuarioLogado.codigo,
        codigo: args.codigo,
        cpf: args.cpf,
        nome: args.nome,
        sobrenome: args.sobrenome
      });

      return { ...result, imoveis: [] };
    }
  })
);
