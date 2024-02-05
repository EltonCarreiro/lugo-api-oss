import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { buildSchema } from './schema';
import { AuthUseCases, JWTConfig } from '@/useCases/AuthUseCases';
import { SchemaType } from './schema/builder';
import { UsuarioUseCases } from '@/useCases/UsuarioUseCases';
import { UsuarioPessoaUseCases } from '@/useCases/UsuarioPessoaUseCases';
import { useCookies } from '@whatwg-node/server-plugin-cookies';
import { getRedisClient } from '@/data/redis';
import { EmpresaUseCases } from '@/useCases/EmpresaUseCases';
import { PessoaUseCases } from '@/useCases/PessoaUseCases';

export const setup = async (
  jwtConfig: JWTConfig,
  sessionDurationInSeconds: number
) => {
  const redis = await getRedisClient();

  const authUseCases = new AuthUseCases(
    jwtConfig,
    sessionDurationInSeconds,
    redis
  );
  const usuarioUseCases = new UsuarioUseCases();
  const usuarioPessoaUseCases = new UsuarioPessoaUseCases();
  const pessoaUseCases = new PessoaUseCases();
  const empresaUseCases = new EmpresaUseCases(pessoaUseCases);

  const yoga = createYoga({
    schema: buildSchema(),
    context: async ({ request }): Promise<SchemaType['Context']> => {
      const jwt = (await request.cookieStore?.get('z'))?.value ?? '';

      return {
        useCases: {
          auth: authUseCases,
          usuario: usuarioUseCases,
          usuarioPessoa: usuarioPessoaUseCases,
          empresa: empresaUseCases
        },
        jwt,
        usuarioLogado:
          jwt === undefined
            ? undefined
            : await authUseCases.obterUsuarioLogado(jwt)
      };
    },
    plugins: [useCookies()]
  });

  const server = createServer(yoga);

  const port = process.env.PORT ?? 3000;

  server.listen(port, () => {
    console.log(`Visit http://localhost:${port}/graphql`);
  });
};
