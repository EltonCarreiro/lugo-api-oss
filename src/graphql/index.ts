import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { buildSchema } from './schema';
import { AuthUseCases } from '@/useCases/AuthUseCases';
import { SchemaType } from './schema/builder';
import { UsuarioUseCases } from '@/useCases/UsuarioUseCases';
import { UsuarioPessoaUseCases } from '@/useCases/UsuarioPessoaUseCases';

export const setup = () => {
  const authUseCases = new AuthUseCases();
  const usuarioUseCases = new UsuarioUseCases();
  const usuarioPessoaUseCases = new UsuarioPessoaUseCases();

  const yoga = createYoga({
    schema: buildSchema(),
    context: async ({ request }): Promise<SchemaType['Context']> => {
      const authToken = request.headers.get('auth-token');

      return {
        useCases: {
          auth: authUseCases,
          usuario: usuarioUseCases,
          usuarioPessoa: usuarioPessoaUseCases
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
