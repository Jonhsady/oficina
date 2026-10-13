'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Customer, Equipment, Order } from '@/lib/types';

type Props = { onCreated: (order: Order) => void };

export function OrderForm({ onCreated }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customerId, setCustomerId] = useState('new');
  const [equipmentId, setEquipmentId] = useState('new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void api<Customer[]>('/api/v1/customers').then(setCustomers).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    if (customerId === 'new') {
      setEquipment([]);
      setEquipmentId('new');
      return;
    }
    void api<Equipment[]>(`/api/v1/equipment?customerId=${customerId}`)
      .then(setEquipment)
      .catch(() => setEquipment([]));
  }, [customerId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      let nextCustomerId = customerId;
      if (nextCustomerId === 'new') {
        const created = await api<Customer>('/api/v1/customers', {
          method: 'POST',
          body: JSON.stringify({ name, phone: phone || undefined }),
        });
        nextCustomerId = created.id;
        setCustomers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }

      let nextEquipmentId = customerId === 'new' ? 'new' : equipmentId;
      if (nextEquipmentId === 'new') {
        const created = await api<Equipment>('/api/v1/equipment', {
          method: 'POST',
          body: JSON.stringify({ customerId: nextCustomerId, brand, model }),
        });
        nextEquipmentId = created.id;
      }

      const order = await api<Order>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: nextCustomerId,
          equipmentId: nextEquipmentId,
          title,
          description: description || undefined,
        }),
      });
      onCreated(order);
      setTitle('');
      setDescription('');
      setName('');
      setPhone('');
      setBrand('');
      setModel('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao abrir a ordem');
    } finally {
      setPending(false);
    }
  }

  const creatingCustomer = customerId === 'new';
  const creatingEquipment = creatingCustomer || equipmentId === 'new';

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Nova ordem</h2>
      <div className="grid">
        <label className="field">
          Cliente
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="new">Novo cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </label>
        {creatingCustomer ? (
          <>
            <label className="field">
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="field">
              Telefone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </>
        ) : (
          <label className="field">
            Equipamento
            <select value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)}>
              <option value="new">Novo equipamento</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>{item.brand} {item.model}</option>
              ))}
            </select>
          </label>
        )}
        {creatingEquipment ? (
          <>
            <label className="field">
              Marca
              <input value={brand} onChange={(event) => setBrand(event.target.value)} required />
            </label>
            <label className="field">
              Modelo
              <input value={model} onChange={(event) => setModel(event.target.value)} required />
            </label>
          </>
        ) : null}
        <label className="field wide">
          Defeito
          <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
        </label>
        <label className="field wide">
          Observação
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? 'Abrindo…' : 'Abrir ordem'}
        </button>
      </div>
    </form>
  );
}
