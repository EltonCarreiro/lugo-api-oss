import { AuthUseCases } from '@/usuario/useCases/AuthUseCases';
import { UsuarioUseCases } from '@/usuario/useCases/UsuarioUseCases';
import SchemaBuilder from '@pothos/core';

export interface Usuario {
  codigo: string;
  email: string;
}

interface UseCases {
  auth: AuthUseCases;
  usuario: UsuarioUseCases;
}

export interface SchemaType {
  Context: {
    useCases: UseCases;
    usuarioLogado: Usuario | undefined;
  };
}

export const builder = new SchemaBuilder<SchemaType>({});
