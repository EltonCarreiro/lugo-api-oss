import { Usuario as UsuarioType, builder } from './builder';

export const Usuario = builder.objectRef<UsuarioType>('Usuario').implement({
  description: 'Informações do usuário',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    email: t.exposeString('email')
  })
});
