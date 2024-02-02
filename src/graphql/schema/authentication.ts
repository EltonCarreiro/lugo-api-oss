import { BusinessError } from '@/shared/errors/BusinessError';
import { builder } from './builder';
import { YogaInitialContext } from 'graphql-yoga';

builder.mutationField('login', (t) =>
  t.field({
    type: 'String',
    args: {
      email: t.arg.string({ required: true }),
      senha: t.arg.string({ required: true })
    },
    errors: {
      types: [Error, BusinessError]
    },
    resolve: async (_, { email, senha }, context) => {
      const jwt = await context.useCases.auth.login({ email, senha });

      (context as unknown as YogaInitialContext).request.cookieStore?.set({
        name: 'z',
        value: jwt,
        secure: true,
        domain: null,
        expires: null,
        httpOnly: true
      });

      return 'OK';
    }
  })
);

builder.mutationField('logout', (t) =>
  t.field({
    type: 'String',
    resolve: async (_parent, _args, context) => {
      const jwt = context.jwt;
      if (jwt !== undefined) {
        await context.useCases.auth.logout(jwt);
      }

      (context as unknown as YogaInitialContext).request.cookieStore?.delete(
        'z'
      );

      return 'OK';
    }
  })
);
