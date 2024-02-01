import { BusinessError } from '@/errors/BusinessError';
import { builder } from './builder';

const ErrorInterface = builder.interfaceRef<Error>('Error').implement({
  fields: (t) => ({
    message: t.exposeString('message')
  })
});

builder.objectType(Error, {
  name: 'GenericError',
  interfaces: [ErrorInterface]
});

builder.objectType(BusinessError, {
  name: 'BusinessError',
  interfaces: [ErrorInterface]
});
