'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderForm } from '@/components/OrderForm';
import { api, connectBoard } from '@/lib/api';
import { clearSession, getAccess, getUser } from '@/lib/session';
import { STATUS_LABEL, STATUS_ORDER, type Order } from '@/lib/types';

function mergeOrder(current: Order[], order: Order) {
  const index = current.findIndex((item) => item.id === order.id);
  if (index === -1) return [order, ...current];
  const next = current.slice();
  next[index] = order;
  return next;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const user = getUser();

  useEffect(() => {
    if (!getAccess()) {
      router.replace('/login');
      return;
    }
    void api<Order[]>('/api/v1/orders')
      .then(setOrders)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Falha ao carregar'));

    const socket = connectBoard((order) => setOrders((current) => mergeOrder(current, order)));
    return () => {
      socket.close();
    };
  }, [router]);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <strong>Oficina</strong>
          <span>Bancada de ordens</span>
        </div>
        <div className="topbar-actions">
          <div className="who">
            <b>{user?.name ?? 'Técnico'}</b>
            <span>{user?.role === 'admin' ? 'Admin' : 'Técnico'}</span>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
          >
            Sair
          </button>
        </div>
      </header>
      <main className="layout">
        <OrderForm onCreated={(order) => setOrders((current) => mergeOrder(current, order))} />
        {error ? <p className="error">{error}</p> : null}
        <section className="board">
          {STATUS_ORDER.map((status) => {
            const items = orders.filter((order) => order.status === status);
            return (
              <article className="column" key={status}>
                <header>
                  <span className={`tone tone-${status}`}>{STATUS_LABEL[status]}</span>
                  <span className="count">{items.length}</span>
                </header>
                {items.length === 0 ? <p className="empty">Nenhuma ordem</p> : null}
                {items.map((order) => (
                  <Link className="card" href={`/ordens/${order.id}`} key={order.id}>
                    <em>OS {String(order.number).padStart(4, '0')}</em>
                    <h3>{order.title}</h3>
                    <p>{order.customer.name}</p>
                    <p>{order.equipment.brand} {order.equipment.model}</p>
                  </Link>
                ))}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
