import { Pessoa, TipoPessoaEmpresa } from '../Pessoa';

describe('Pessoa testes', () => {
  describe('ao criar uma pessoa', () => {
    it('não deve permitir criar pessoa com código vazio', () => {
      expect(() => criarPessoaFake({ codigo: '' })).toThrow(
        'Código é obrigatório.'
      );
    });

    it('não deve permitir criar pessoa com nome vazio', () => {
      expect(() => criarPessoaFake({ nome: '' })).toThrow(
        'Nome é obrigatório.'
      );
    });

    it('não deve permitir criar pessoa com sobrenome vazio', () => {
      expect(() => criarPessoaFake({ sobrenome: '' })).toThrow(
        'Sobrenome é obrigatório.'
      );
    });

    it('não deve permitir criar pessoa com código da empresa vazio', () => {
      expect(() => criarPessoaFake({ codigoEmpresa: '' })).toThrow(
        'Código da empresa inválido.'
      );
    });

    it('deve criar pessoa com dados corretos', () => {
      const args = criarArgumentosPessoaFake({
        tipoPessoaEmpresa: undefined
      });
      const pessoa = criarPessoaFake(args);

      expect(pessoa.codigo).toBe(args.codigo);
      expect(pessoa.codigoEmpresa).toBe(args.codigoEmpresa);
      expect(pessoa.cpf.value).toBe(args.cpf);
      expect(pessoa.nome).toBe(args.nome);
      expect(pessoa.sobrenome).toBe(args.sobrenome);
      expect(pessoa.tipoPessoaEmpresa).toBe(undefined);
    });
  });
});

interface PessoaConstructorArgs {
  codigo: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  codigoEmpresa?: string;
  tipoPessoaEmpresa: TipoPessoaEmpresa;
}

// create args
const criarArgumentosPessoaFake = (
  args: Partial<PessoaConstructorArgs>
): PessoaConstructorArgs => ({
  codigo: 'fake_cod',
  codigoEmpresa: undefined,
  cpf: '12345678901',
  nome: 'john',
  sobrenome: 'dow',
  tipoPessoaEmpresa: 'cliente',
  ...args
});

// create entity
const criarPessoaFake = (args: Partial<PessoaConstructorArgs>) => {
  const { codigo, nome, sobrenome, cpf, codigoEmpresa, tipoPessoaEmpresa } =
    criarArgumentosPessoaFake(args);
  return new Pessoa(
    codigo,
    nome,
    sobrenome,
    cpf,
    codigoEmpresa,
    tipoPessoaEmpresa
  );
};
