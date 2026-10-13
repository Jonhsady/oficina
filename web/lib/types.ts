export type Role = 'admin' | 'tecnico';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type OrderStatus =
  | 'aberto'
  | 'em_diagnostico'
  | 'aguardando_peca'
  | 'pronto'
  | 'entregue';

export type Order = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: OrderStatus;
  allowedTransitions: OrderStatus[];
  customer: { id: string; name: string; phone: string | null };
  equipment: { id: string; brand: string; model: string; serial: string | null };
  assignee: { id: string; name: string } | null;
  photos: { id: string; contentType: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

export type Equipment = {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  serial: string | null;
};

export const STATUS_ORDER: OrderStatus[] = [
  'aberto',
  'em_diagnostico',
  'aguardando_peca',
  'pronto',
  'entregue',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aberto: 'Aberto',
  em_diagnostico: 'Em diagnóstico',
  aguardando_peca: 'Aguardando peça',
  pronto: 'Pronto',
  entregue: 'Entregue',
};
