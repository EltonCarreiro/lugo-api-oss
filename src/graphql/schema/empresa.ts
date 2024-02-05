import { BusinessError } from '@/shared/errors/BusinessError';
import { builder } from './builder';

interface ClienteEmpresa {
  codigo: string;
  nome: string;
  sobrenome: string;
}

export interface Empresa {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  clientes: ClienteEmpresa[];
}

export const ClienteEmpresa = builder
  .objectRef<ClienteEmpresa>('ClienteEmpresa')
  .implement({
    description: 'Informações de um cliente.',
    fields: (t) => ({
      codigo: t.exposeString('codigo'),
      nome: t.exposeString('nome'),
      sobrenome: t.exposeString('sobrenome')
    })
  });

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
      resolve: (parent, _args, ctx) => {
        return ctx.useCases.empresa.listarClientes(parent.codigo);
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

      return {
        codigo: result.codigo,
        nome: result.nome,
        sobrenome: result.sobrenome
      };
    }
  })
);
