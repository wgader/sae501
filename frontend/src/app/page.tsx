'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        setIsConnected(true);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsConnected(false);
  };

  return (
    <main className="home-page">
      <header className="home-header">
        <Link href="/" aria-label="Accueil Feytiat">
          <Image className="home-logo" src="/assets/logo-feytiat.svg" alt="Logo Feytiat" width={112} height={48} priority />
        </Link>
        
        {isConnected ? (
          <div className="home-account">
            <Link href="/profile">Profil</Link>
            <button type="button" onClick={handleLogout}>Déconnexion</button>
          </div>
        ) : (
          <div className="home-auth">
            <Link href="/login">Connexion</Link>
            <Link className="home-auth-active" href="/signup/step1">Inscription</Link>
          </div>
        )}
      </header>

      <section className="home-content" aria-labelledby="home-title">
        <p className="home-welcome">Accueil</p>
        <h1 id="home-title">Bienvenue</h1>
        
        <div className="home-actions">
          <Link href="/subvention">Demande de subvention</Link>
          <Link href="/salle">Demande de salle</Link>
          <Link href="/materiel">Demande de matériel</Link>
        </div>
      </section>

      <button className="home-preview" type="button" onClick={() => setIsConnected((value) => !value)}>
        Aperçu : {isConnected ? 'connecté' : 'non connecté'}
      </button>
    </main>
  );
}