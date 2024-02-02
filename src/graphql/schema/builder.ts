import { AuthUseCases } from '@/useCases/AuthUseCases';
import { UsuarioPessoaUseCases } from '@/useCases/UsuarioPessoaUseCases';
import { UsuarioUseCases } from '@/useCases/UsuarioUseCases';
import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';

export interface Usuario {
  codigo: string;
  email: string;
}

interface UseCases {
  auth: AuthUseCases;
  usuario: UsuarioUseCases;
  usuarioPessoa: UsuarioPessoaUseCases;
}

export interface SchemaType {
  Context: {
    useCases: UseCases;
    jwt: string | undefined;
    usuarioLogado: Usuario | undefined;
  };
}

export const builder = new SchemaBuilder<SchemaType>({
  plugins: [ErrorsPlugin]
});
