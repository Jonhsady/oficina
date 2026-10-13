export const ORDER_STATUSES = [
  'aberto',
  'em_diagnostico',
  'aguardando_peca',
  'pronto',
  'entregue',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  aberto: ['em_diagnostico'],
  em_diagnostico: ['aguardando_peca', 'pronto'],
  aguardando_peca: ['em_diagnostico', 'pronto'],
  pronto: ['entregue'],
  entregue: [],
};

export class InvalidOrderTransition extends Error {
  readonly from: OrderStatus;
  readonly to: OrderStatus;

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Transição inválida: ${from} → ${to}`);
    this.name = 'InvalidOrderTransition';
    this.from = from;
    this.to = to;
  }
}

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[from]];
}

export function assertCanTransition(from: OrderStatus, to: OrderStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new InvalidOrderTransition(from, to);
  }
}
