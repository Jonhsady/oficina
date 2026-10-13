'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, connectBoard, photoUrl } from '@/lib/api';
import { getAccess } from '@/lib/session';
import { STATUS_LABEL, type Order } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!getAccess()) {
      router.replace('/login');
      return;
    }
    void api<Order>(`/api/v1/orders/${params.id}`)
      .then(setOrder)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Ordem não encontrada'));

    const socket = connectBoard((next) => {
      if (next.id === params.id) setOrder(next);
    });
    return () => {
      socket.close();
    };
  }, [params.id, router]);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    void Promise.all(
      order.photos.map(async (photo) => {
        const url = await photoUrl(order.id, photo.id);
        return [photo.id, url] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setImages(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [order]);

  async function move(status: Order['status']) {
    if (!order) return;
    setPending(true);
    setError('');
    try {
      setOrder(await api<Order>(`/api/v1/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao mudar o status');
    } finally {
      setPending(false);
    }
  }

  async function upload(file: File) {
    if (!order) return;
    const body = new FormData();
    body.set('file', file);
    setPending(true);
    setError('');
    try {
      setOrder(await api<Order>(`/api/v1/orders/${order.id}/photos`, { method: 'POST', body }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha no upload');
    } finally {
      setPending(false);
    }
  }

  if (!order) {
    return (
      <main className="layout">
        <Link href="/ordens">Voltar para a bancada</Link>
        {error ? <p className="error">{error}</p> : <p className="muted">Carregando ordem…</p>}
      </main>
    );
  }

  return (
    <main className="layout">
      <p><Link href="/ordens">← Bancada</Link></p>
      <section className="detail">
        <article className="panel">
          <p className="muted">OS {String(order.number).padStart(4, '0')}</p>
          <h2>{order.title}</h2>
          <p>{order.description || 'Sem observação.'}</p>
          <p className="muted">{order.customer.name} · {order.equipment.brand} {order.equipment.model}</p>
          <p><span className={`tone tone-${order.status}`}>{STATUS_LABEL[order.status]}</span></p>
          <div className="actions">
            {order.allowedTransitions.map((status) => (
              <button className="btn primary" disabled={pending} key={status} onClick={() => void move(status)} type="button">
                Mover para {STATUS_LABEL[status].toLowerCase()}
              </button>
            ))}
            {order.allowedTransitions.length === 0 ? <span className="muted">Ordem encerrada.</span> : null}
          </div>
          {error ? <p className="error">{error}</p> : null}
          {order.assignee ? <p className="muted">Responsável: {order.assignee.name}</p> : null}
        </article>
        <aside className="panel">
          <h2>Fotos</h2>
          <label className="field">
            Anexar imagem
            <input
              accept="image/png,image/jpeg,image/webp"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          <div className="photo-grid">
            {order.photos.map((photo) => (
              images[photo.id] ? <img alt="Foto da ordem" key={photo.id} src={images[photo.id]} /> : null
            ))}
          </div>
          {order.photos.length === 0 ? <p className="empty">Nenhuma foto ainda.</p> : null}
        </aside>
      </section>
    </main>
  );
}
