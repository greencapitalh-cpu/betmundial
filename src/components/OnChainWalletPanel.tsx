'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, ZeroAddress, formatEther, id, parseEther } from 'ethers';
import { ExternalLink, Link2, LoaderCircle, WalletCards } from 'lucide-react';
import { useLocale, type Locale } from './LocaleProvider';

const AMOY_CHAIN_ID = '0x13882';
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_VAULT_ADDRESS || '';
const VAULT_ABI = [
  'function createNativeChallenge(bytes32,address,uint64,uint64) payable',
  'function acceptNativeChallenge(bytes32) payable',
  'function challenges(bytes32) view returns (address creator,address opponent,address invitedOpponent,address asset,uint256 stake,uint64 resolveAfter,uint64 refundAfter,uint8 state,bytes32 evidenceHash)',
];

type EthereumWindow = Window & {
  ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
};

type MatchSummary = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc?: string | null;
};

const walletCopy: Record<Locale, Record<string, string>> = {
  en: {
    kicker: 'Live technology demo', title: 'On-chain testnet escrow',
    subtitle: 'Wallet-signed deposits on Polygon Amoy. Test assets only.',
    connect: 'Connect wallet', connected: 'Wallet connected to Polygon Amoy.',
    stake: 'Stake in test POL', invite: 'Invite wallet (optional)', invitePlaceholder: '0x... or leave open',
    fund: 'Fund challenge', faucet: 'Get test POL', shared: 'Shared vault challenge',
    verify: 'Verify deposit', accept: 'Accept', pending: 'Vault verified locally; Polygon Amoy deployment pending.',
    configured: 'Vault configured.', install: 'Install MetaMask or another EIP-1193 wallet.',
    selectMatch: 'Select a World Cup match first.', deploymentPending: 'Testnet vault deployment is pending.',
    funded: 'On-chain challenge funded. Share link copied.', notFound: 'Shared challenge not found.',
    verified: 'Verified deposit', accepted: 'Accepted. Both deposits are locked in the vault.',
    failed: 'Wallet transaction failed.',
  },
  es: {
    kicker: 'Demo tecnológica en vivo', title: 'Escrow on-chain en testnet',
    subtitle: 'Depósitos firmados con billetera en Polygon Amoy. Solo activos de prueba.',
    connect: 'Conectar billetera', connected: 'Billetera conectada a Polygon Amoy.',
    stake: 'Depósito en POL de prueba', invite: 'Invitar billetera (opcional)', invitePlaceholder: '0x... o dejar abierto',
    fund: 'Fondear challenge', faucet: 'Obtener POL de prueba', shared: 'Challenge compartido del vault',
    verify: 'Verificar depósito', accept: 'Aceptar', pending: 'Vault verificado localmente; falta desplegarlo en Polygon Amoy.',
    configured: 'Vault configurado.', install: 'Instala MetaMask u otra billetera EIP-1193.',
    selectMatch: 'Selecciona primero un partido del Mundial.', deploymentPending: 'El despliegue del vault en testnet está pendiente.',
    funded: 'Challenge fondeado on-chain. Enlace copiado.', notFound: 'No se encontró el challenge compartido.',
    verified: 'Depósito verificado', accepted: 'Aceptado. Ambos depósitos están bloqueados en el vault.',
    failed: 'Falló la transacción de la billetera.',
  },
  pt: {
    kicker: 'Demo tecnológica ao vivo', title: 'Escrow on-chain em testnet',
    subtitle: 'Depósitos assinados pela carteira na Polygon Amoy. Somente ativos de teste.',
    connect: 'Conectar carteira', connected: 'Carteira conectada à Polygon Amoy.',
    stake: 'Depósito em POL de teste', invite: 'Convidar carteira (opcional)', invitePlaceholder: '0x... ou deixar aberto',
    fund: 'Financiar challenge', faucet: 'Obter POL de teste', shared: 'Challenge compartilhado do vault',
    verify: 'Verificar depósito', accept: 'Aceitar', pending: 'Vault verificado localmente; implantação na Polygon Amoy pendente.',
    configured: 'Vault configurado.', install: 'Instale a MetaMask ou outra carteira EIP-1193.',
    selectMatch: 'Selecione primeiro um jogo da Copa.', deploymentPending: 'A implantação do vault na testnet está pendente.',
    funded: 'Challenge financiado on-chain. Link copiado.', notFound: 'Challenge compartilhado não encontrado.',
    verified: 'Depósito verificado', accepted: 'Aceito. Ambos os depósitos estão bloqueados no vault.',
    failed: 'Falha na transação da carteira.',
  },
  fr: {
    kicker: 'Démo technologique en direct', title: 'Escrow on-chain sur testnet',
    subtitle: 'Dépôts signés par portefeuille sur Polygon Amoy. Actifs de test uniquement.',
    connect: 'Connecter le portefeuille', connected: 'Portefeuille connecté à Polygon Amoy.',
    stake: 'Dépôt en POL de test', invite: 'Inviter un portefeuille (optionnel)', invitePlaceholder: '0x... ou laisser ouvert',
    fund: 'Financer le challenge', faucet: 'Obtenir du POL de test', shared: 'Challenge partagé du vault',
    verify: 'Vérifier le dépôt', accept: 'Accepter', pending: 'Vault vérifié localement; déploiement Polygon Amoy en attente.',
    configured: 'Vault configuré.', install: 'Installez MetaMask ou un autre portefeuille EIP-1193.',
    selectMatch: 'Sélectionnez d’abord un match de la Coupe.', deploymentPending: 'Le déploiement du vault sur testnet est en attente.',
    funded: 'Challenge financé on-chain. Lien copié.', notFound: 'Challenge partagé introuvable.',
    verified: 'Dépôt vérifié', accepted: 'Accepté. Les deux dépôts sont bloqués dans le vault.',
    failed: 'La transaction du portefeuille a échoué.',
  },
};

export default function OnChainWalletPanel({ match }: { match?: MatchSummary | null }) {
  const { locale } = useLocale();
  const t = walletCopy[locale];
  const [address, setAddress] = useState('');
  const [stake, setStake] = useState('0.01');
  const [invite, setInvite] = useState('');
  const [sharedId, setSharedId] = useState('');
  const [sharedStake, setSharedStake] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSharedId(new URLSearchParams(window.location.search).get('onchain') || '');
  }, []);

  async function getWallet() {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) throw new Error(t.install);
    await ethereum.request({ method: 'eth_requestAccounts' });
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: AMOY_CHAIN_ID }] });
    } catch {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: AMOY_CHAIN_ID,
          chainName: 'Polygon Amoy',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: ['https://rpc-amoy.polygon.technology'],
          blockExplorerUrls: ['https://amoy.polygonscan.com'],
        }],
      });
    }
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    setAddress(await signer.getAddress());
    return new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice('');
    try {
      await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.failed);
    } finally {
      setBusy(false);
    }
  }

  const connect = () => run(async () => {
    await getWallet();
    setNotice(t.connected);
  });

  const createChallenge = () => run(async () => {
    if (!VAULT_ADDRESS) throw new Error(t.deploymentPending);
    if (!match) throw new Error(t.selectMatch);
    const contract = await getWallet();
    const challengeKey = id(`escrowbet:${match.matchId}:${Date.now()}`);
    const kickoff = Math.floor(new Date(match.kickoffUtc || Date.now() + 300_000).getTime() / 1000);
    const resolveAfter = Math.max(kickoff, Math.floor(Date.now() / 1000) + 120);
    const tx = await contract.createNativeChallenge(
      challengeKey,
      invite.trim() || ZeroAddress,
      resolveAfter,
      resolveAfter + 48 * 60 * 60,
      { value: parseEther(stake) },
    );
    await tx.wait();
    const url = new URL(window.location.href);
    url.searchParams.set('onchain', challengeKey);
    await navigator.clipboard.writeText(url.toString());
    setSharedId(challengeKey);
    setNotice(t.funded);
  });

  const loadShared = () => run(async () => {
    if (!VAULT_ADDRESS || !sharedId) throw new Error(t.notFound);
    const challenge = await (await getWallet()).challenges(sharedId);
    setSharedStake(formatEther(challenge.stake));
    setNotice(`${t.verified}: ${formatEther(challenge.stake)} POL.`);
  });

  const acceptShared = () => run(async () => {
    if (!VAULT_ADDRESS || !sharedId) throw new Error(t.notFound);
    const contract = await getWallet();
    const challenge = await contract.challenges(sharedId);
    const tx = await contract.acceptNativeChallenge(sharedId, { value: challenge.stake });
    await tx.wait();
    setSharedStake(formatEther(challenge.stake));
    setNotice(t.accepted);
  });

  return (
    <section className="onchain-panel">
      <div className="onchain-head">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h2 className="section-title">{t.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{t.subtitle}</p>
        </div>
        <button className="secondary-button" onClick={connect} disabled={busy}>
          <WalletCards size={17} /> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : t.connect}
        </button>
      </div>
      <div className="onchain-grid">
        <div>
          <label className="form-label">{t.stake}</label>
          <input className="form-field mt-2 w-full" value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="form-label">{t.invite}</label>
          <input className="form-field mt-2 w-full" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder={t.invitePlaceholder} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="primary-button" onClick={createChallenge} disabled={busy || !VAULT_ADDRESS}>
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Link2 size={17} />} {t.fund}
        </button>
        <a className="secondary-button" href="https://faucet.polygon.technology/" target="_blank" rel="noreferrer">
          {t.faucet} <ExternalLink size={15} />
        </a>
      </div>
      {sharedId && (
        <div className="onchain-shared">
          <p className="form-label">{t.shared}</p>
          <code>{sharedId.slice(0, 18)}...{sharedId.slice(-8)}</code>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={loadShared} disabled={busy}>{t.verify}</button>
            <button className="primary-button" onClick={acceptShared} disabled={busy}>{t.accept} {sharedStake ? `${sharedStake} POL` : ''}</button>
          </div>
        </div>
      )}
      <p className="onchain-notice">{notice || (VAULT_ADDRESS ? t.configured : t.pending)}</p>
    </section>
  );
}
