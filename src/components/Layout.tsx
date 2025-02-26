import React, { ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Head from 'next/head';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title = 'Prediction Market' }: LayoutProps) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Prediction Market Application" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <h1>Prediction Market</h1>
        </div>
        <div className={styles.connectButton}>
          <ConnectButton />
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>Prediction Market © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Layout; 