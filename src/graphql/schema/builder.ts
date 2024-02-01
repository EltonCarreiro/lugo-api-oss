import { AuthUseCases } from '@/usuario/useCases/AuthUseCases';
import SchemaBuilder from '@pothos/core';

export interface Usuario {
  codigo: string;
  email: string;
}

interface UseCases {
  auth: AuthUseCases;
}

export interface SchemaType {
  Context: {
    useCases: UseCases;
    usuarioLogado: Usuario | undefined;
  };
}

export const builder = new SchemaBuilder<SchemaType>({});
