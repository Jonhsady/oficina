'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/session';
import type { SessionUser } from '@/lib/types';

const DEMO = { email: 'bruno.tecnico@oficina.local', password: 'oficina123' };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO.email);
  const [password, setPassword] = useState(DEMO.password);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const session = await api<{
        accessToken: string;
        refreshToken: string;
        user: SessionUser;
      }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveSession(session.accessToken, session.refreshToken, session.user);
      router.replace('/ordens');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha no login');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="ledger">
        <div>
          <p className="muted">Ordem de serviço</p>
          <h1>O que está na bancada agora.</h1>
        </div>
        <div className="slip">
          <div><span>OS 0001</span><span>Aberto</span></div>
          <div><span>Geladeira DF42</span><span>Marta Lopes</span></div>
          <div><span>OS 0002</span><span>Em diagnóstico</span></div>
        </div>
      </section>
      <section className="login-side">
        <form className="login-card stack" onSubmit={submit}>
          <div>
            <h1>Entrar na oficina</h1>
            <p className="muted">A conta de demonstração já está preenchida.</p>
          </div>
          <label className="field">
            E-mail
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label className="field">
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
