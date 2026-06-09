'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BrowserProvider, Contract, ContractFactory, ZeroAddress,
  formatEther, id, isAddress, parseEther,
} from 'ethers';
import { ExternalLink, Link2, LoaderCircle, Rocket, WalletCards } from 'lucide-react';
import vaultArtifact from '@/contracts/EscrowBetVault.json';
import { useLocale, type Locale } from './LocaleProvider';

type NetworkKey = 'sepolia' | 'amoy';
const NETWORKS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    chainHex: '0xaa36a7',
    symbol: 'ETH',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    faucet: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
  },
  amoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    chainHex: '0x13882',
    symbol: 'POL',
    rpc: 'https://polygon-amoy.drpc.org',
    explorer: 'https://amoy.polygonscan.com',
    faucet: 'https://faucets.chain.link/polygon-amoy',
  },
} as const;

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
    subtitle: 'Deploy and fund a real EVM vault using test assets only.', connect: 'Connect wallet',
    deploy: 'Deploy vault', deploying: 'Deploying vault...', network: 'Test network',
    stake: 'Test stake', invite: 'Invite wallet (optional)', placeholder: '0x... or leave open',
    fund: 'Fund challenge', faucet: 'Get test funds', shared: 'Shared vault challenge',
    verify: 'Verify deposit', accept: 'Accept', install: 'Open this page inside Rabby or install an EIP-1193 wallet.',
    connected: 'Wallet connected.', deployed: 'Vault deployed and ready.', configured: 'Vault ready',
    pending: 'Deploy the vault once, then create wallet-signed challenges.', select: 'Select a World Cup match first.',
    funded: 'Challenge funded on-chain. Share link copied.', missing: 'Deploy or open a shared vault first.',
    notFound: 'Shared challenge not found.', accepted: 'Accepted. Both deposits are locked in the vault.',
    verified: 'Verified deposit', failed: 'Wallet transaction failed.', official: 'Contract',
  },
  es: {
    kicker: 'Demo tecnológica en vivo', title: 'Escrow on-chain en testnet',
    subtitle: 'Despliega y fondea un vault EVM real usando únicamente activos de prueba.', connect: 'Conectar billetera',
    deploy: 'Desplegar vault', deploying: 'Desplegando vault...', network: 'Red de prueba',
    stake: 'Depósito de prueba', invite: 'Invitar billetera (opcional)', placeholder: '0x... o dejar abierto',
    fund: 'Fondear challenge', faucet: 'Obtener fondos de prueba', shared: 'Challenge compartido del vault',
    verify: 'Verificar depósito', accept: 'Aceptar', install: 'Abre esta página dentro de Rabby o instala una billetera EIP-1193.',
    connected: 'Billetera conectada.', deployed: 'Vault desplegado y listo.', configured: 'Vault listo',
    pending: 'Despliega el vault una vez y luego crea challenges firmados con billetera.', select: 'Selecciona primero un partido del Mundial.',
    funded: 'Challenge fondeado on-chain. Enlace copiado.', missing: 'Primero despliega o abre un vault compartido.',
    notFound: 'No se encontró el challenge compartido.', accepted: 'Aceptado. Ambos depósitos están bloqueados en el vault.',
    verified: 'Depósito verificado', failed: 'Falló la transacción de la billetera.', official: 'Contrato',
  },
  pt: {
    kicker: 'Demo tecnológica ao vivo', title: 'Escrow on-chain em testnet',
    subtitle: 'Implante e financie um vault EVM real usando somente ativos de teste.', connect: 'Conectar carteira',
    deploy: 'Implantar vault', deploying: 'Implantando vault...', network: 'Rede de teste',
    stake: 'Depósito de teste', invite: 'Convidar carteira (opcional)', placeholder: '0x... ou deixar aberto',
    fund: 'Financiar challenge', faucet: 'Obter fundos de teste', shared: 'Challenge compartilhado do vault',
    verify: 'Verificar depósito', accept: 'Aceitar', install: 'Abra esta página dentro da Rabby ou instale uma carteira EIP-1193.',
    connected: 'Carteira conectada.', deployed: 'Vault implantado e pronto.', configured: 'Vault pronto',
    pending: 'Implante o vault uma vez e depois crie challenges assinados pela carteira.', select: 'Selecione primeiro um jogo da Copa.',
    funded: 'Challenge financiado on-chain. Link copiado.', missing: 'Primeiro implante ou abra um vault compartilhado.',
    notFound: 'Challenge compartilhado não encontrado.', accepted: 'Aceito. Ambos os depósitos estão bloqueados no vault.',
    verified: 'Depósito verificado', failed: 'Falha na transação da carteira.', official: 'Contrato',
  },
  fr: {
    kicker: 'Démo technologique en direct', title: 'Escrow on-chain sur testnet',
    subtitle: 'Déployez et financez un vault EVM réel avec des actifs de test uniquement.', connect: 'Connecter le portefeuille',
    deploy: 'Déployer le vault', deploying: 'Déploiement du vault...', network: 'Réseau de test',
    stake: 'Dépôt de test', invite: 'Inviter un portefeuille (optionnel)', placeholder: '0x... ou laisser ouvert',
    fund: 'Financer le challenge', faucet: 'Obtenir des fonds de test', shared: 'Challenge partagé du vault',
    verify: 'Vérifier le dépôt', accept: 'Accepter', install: 'Ouvrez cette page dans Rabby ou installez un portefeuille EIP-1193.',
    connected: 'Portefeuille connecté.', deployed: 'Vault déployé et prêt.', configured: 'Vault prêt',
    pending: 'Déployez le vault une fois, puis créez des challenges signés par portefeuille.', select: 'Sélectionnez d’abord un match de la Coupe.',
    funded: 'Challenge financé on-chain. Lien copié.', missing: 'Déployez ou ouvrez d’abord un vault partagé.',
    notFound: 'Challenge partagé introuvable.', accepted: 'Accepté. Les deux dépôts sont bloqués dans le vault.',
    verified: 'Dépôt vérifié', failed: 'La transaction du portefeuille a échoué.', official: 'Contrat',
  },
};

export default function OnChainWalletPanel({ match }: { match?: MatchSummary | null }) {
  const { locale } = useLocale();
  const t = walletCopy[locale];
  const [networkKey, setNetworkKey] = useState<NetworkKey>('sepolia');
  const network = NETWORKS[networkKey];
  const [address, setAddress] = useState('');
  const [vaultAddress, setVaultAddress] = useState('');
  const [stake, setStake] = useState('0.001');
  const [invite, setInvite] = useState('');
  const [sharedId, setSharedId] = useState('');
  const [sharedStake, setSharedStake] = useState('');
  const [busy, setBusy] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedNetwork = params.get('chain') as NetworkKey | null;
    const nextNetwork = sharedNetwork && sharedNetwork in NETWORKS ? sharedNetwork : 'sepolia';
    const sharedVault = params.get('vault') || '';
    setNetworkKey(nextNetwork);
    setSharedId(params.get('onchain') || '');
    setVaultAddress(
      isAddress(sharedVault)
        ? sharedVault
        : localStorage.getItem(`escrowbet-vault-${NETWORKS[nextNetwork].chainId}`) || '',
    );
  }, []);

  const explorerUrl = useMemo(
    () => vaultAddress ? `${network.explorer}/address/${vaultAddress}` : network.explorer,
    [network, vaultAddress],
  );

  async function getWallet() {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) throw new Error(t.install);
    await ethereum.request({ method: 'eth_requestAccounts' });
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: network.chainHex }] });
    } catch {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: network.chainHex,
          chainName: network.name,
          nativeCurrency: { name: network.symbol, symbol: network.symbol, decimals: 18 },
          rpcUrls: [network.rpc],
          blockExplorerUrls: [network.explorer],
        }],
      });
    }
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    setAddress(await signer.getAddress());
    return signer;
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
    setNotice(`${t.connected} ${network.name}.`);
  });

  const deployVault = () => run(async () => {
    setDeploying(true);
    try {
      const signer = await getWallet();
      const owner = await signer.getAddress();
      const factory = new ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, signer);
      const vault = await factory.deploy(owner, owner);
      await vault.waitForDeployment();
      const deployedAddress = await vault.getAddress();
      setVaultAddress(deployedAddress);
      localStorage.setItem(`escrowbet-vault-${network.chainId}`, deployedAddress);
      setNotice(`${t.deployed} ${deployedAddress}`);
    } finally {
      setDeploying(false);
    }
  });

  const createChallenge = () => run(async () => {
    if (!vaultAddress) throw new Error(t.missing);
    if (!match) throw new Error(t.select);
    const signer = await getWallet();
    const contract = new Contract(vaultAddress, vaultArtifact.abi, signer);
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
    url.searchParams.set('chain', networkKey);
    url.searchParams.set('vault', vaultAddress);
    url.searchParams.set('onchain', challengeKey);
    await navigator.clipboard.writeText(url.toString());
    setSharedId(challengeKey);
    setNotice(t.funded);
  });

  const loadShared = () => run(async () => {
    if (!vaultAddress || !sharedId) throw new Error(t.notFound);
    const challenge = await new Contract(vaultAddress, vaultArtifact.abi, await getWallet()).challenges(sharedId);
    setSharedStake(formatEther(challenge.stake));
    setNotice(`${t.verified}: ${formatEther(challenge.stake)} ${network.symbol}.`);
  });

  const acceptShared = () => run(async () => {
    if (!vaultAddress || !sharedId) throw new Error(t.notFound);
    const contract = new Contract(vaultAddress, vaultArtifact.abi, await getWallet());
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

      <div className="onchain-network-row">
        <label>
          <span className="form-label">{t.network}</span>
          <select
            className="form-field"
            value={networkKey}
            onChange={(event) => {
              const next = event.target.value as NetworkKey;
              setNetworkKey(next);
              setVaultAddress(localStorage.getItem(`escrowbet-vault-${NETWORKS[next].chainId}`) || '');
              setNotice('');
            }}
          >
            <option value="sepolia">Ethereum Sepolia</option>
            <option value="amoy">Polygon Amoy</option>
          </select>
        </label>
        <div className="onchain-contract-state">
          <span>{t.official}</span>
          {vaultAddress ? <a href={explorerUrl} target="_blank" rel="noreferrer">{vaultAddress.slice(0, 10)}...{vaultAddress.slice(-6)} <ExternalLink size={13} /></a> : <strong>Not deployed</strong>}
        </div>
      </div>

      {!vaultAddress && (
        <div className="onchain-deploy">
          <p>{t.pending}</p>
          <button className="primary-button" onClick={deployVault} disabled={busy}>
            {deploying ? <LoaderCircle className="animate-spin" size={17} /> : <Rocket size={17} />}
            {deploying ? t.deploying : t.deploy}
          </button>
        </div>
      )}

      <div className="onchain-grid">
        <div>
          <label className="form-label">{t.stake} ({network.symbol})</label>
          <input className="form-field mt-2 w-full" value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="form-label">{t.invite}</label>
          <input className="form-field mt-2 w-full" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder={t.placeholder} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="primary-button" onClick={createChallenge} disabled={busy || !vaultAddress}>
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Link2 size={17} />} {t.fund}
        </button>
        <a className="secondary-button" href={network.faucet} target="_blank" rel="noreferrer">
          {t.faucet} <ExternalLink size={15} />
        </a>
      </div>

      {sharedId && (
        <div className="onchain-shared">
          <p className="form-label">{t.shared}</p>
          <code>{sharedId.slice(0, 18)}...{sharedId.slice(-8)}</code>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={loadShared} disabled={busy}>{t.verify}</button>
            <button className="primary-button" onClick={acceptShared} disabled={busy}>{t.accept} {sharedStake ? `${sharedStake} ${network.symbol}` : ''}</button>
          </div>
        </div>
      )}

      <p className="onchain-notice">{notice || (vaultAddress ? t.configured : t.pending)}</p>
    </section>
  );
}
