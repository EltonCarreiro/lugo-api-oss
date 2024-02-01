import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { buildSchema } from './schema';
import { AuthUseCases } from '@/usuario/useCases/AuthUseCases';
import { SchemaType } from './schema/builder';
import { UsuarioUseCases } from '@/usuario/useCases/UsuarioUseCases';

export const setup = () => {
  const authUseCases = new AuthUseCases();
  const usuarioUseCases = new UsuarioUseCases();

  const yoga = createYoga({
    schema: buildSchema(),
    context: async ({ request }): Promise<SchemaType['Context']> => {
      const authToken = request.headers.get('auth-token');

      return {
        useCases: {
          auth: authUseCases,
          usuario: usuarioUseCases
        },
        usuarioLogado:
          authToken === null
            ? undefined
            : await authUseCases.obterUsuarioLogado(authToken)
      };
    }
  });

  const server = createServer(yoga);

  const port = process.env.PORT ?? 3000;

  server.listen(port, () => {
    console.log(`Visit http://localhost:${port}/graphql`);
  });
};
