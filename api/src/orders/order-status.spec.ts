import { allowedTransitions, assertCanTransition, InvalidOrderTransition } from './order-status';

describe('máquina de estados da ordem', () => {
  it('aceita o diagnóstico a partir de uma ordem aberta', () => {
    expect(() => assertCanTransition('aberto', 'em_diagnostico')).not.toThrow();
  });

  it('recusa entregar uma ordem que ainda está aberta', () => {
    expect(() => assertCanTransition('aberto', 'entregue')).toThrow(InvalidOrderTransition);
  });

  it('permite pedir peça ou concluir o diagnóstico', () => {
    expect(allowedTransitions('em_diagnostico')).toEqual(['aguardando_peca', 'pronto']);
  });

  it('permite voltar da espera de peça para o diagnóstico', () => {
    expect(() => assertCanTransition('aguardando_peca', 'em_diagnostico')).not.toThrow();
  });

  it('só deixa a ordem pronta ir para entregue', () => {
    expect(allowedTransitions('pronto')).toEqual(['entregue']);
    expect(() => assertCanTransition('pronto', 'em_diagnostico')).toThrow(InvalidOrderTransition);
  });

  it('não aceita nenhuma saída depois da entrega', () => {
    expect(allowedTransitions('entregue')).toEqual([]);
    expect(() => assertCanTransition('entregue', 'aberto')).toThrow(InvalidOrderTransition);
  });

  it('recusa repetir o mesmo status', () => {
    expect(() => assertCanTransition('aberto', 'aberto')).toThrow(InvalidOrderTransition);
  });
});
