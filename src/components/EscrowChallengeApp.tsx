'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import OnChainWalletPanel from './OnChainWalletPanel';
import {
  ArrowRight, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign,
  Clock3, FileCheck2, LockKeyhole, MapPin, Pause, Play, QrCode, Search, Share2,
  ShieldCheck, Trophy, UserRound, WalletCards, X,
} from 'lucide-react';
import { useLocale, type Locale } from './LocaleProvider';
import { clearAccount, readAccount, saveAccount, type Account } from '@/lib/account';

type Match = {
  matchId: string; stage?: string; groupCode?: string; homeTeam: string; awayTeam: string;
  kickoffUtc?: string; stadium?: string; city?: string; status?: string;
  homeScore?: number | null; awayScore?: number | null;
};
type Prediction = { homeScore: number; awayScore: number };
type Party = { email: string; prediction: Prediction; accountId: string };
type Agreement = {
  challengeId: string; match: Match; creator: Party; opponent?: Party;
  stakePerPlayer: number; pot: number; status: string;
  settlement?: { outcome?: string; receiptHash?: string };
};
type Wallet = { available: number; locked: number; total: number };
type Leader = { _id: string; wins: number; escrowCoinsWon: number };

const API_URL = (process.env.NEXT_PUBLIC_UDOCHAIN_API_URL || 'https://api.udochain.com').replace(/\/$/, '');
const BET_API_URL = (process.env.NEXT_PUBLIC_BET_API_URL || 'https://bet2back-production.up.railway.app').replace(/\/$/, '');
const copy: Record<Locale, Record<string, string>> = {
  en: {
    welcome: 'Welcome', available: 'Available', locked: 'Locked', total: 'Total',
    matches: 'World Cup matches', filter: 'Search team, group, city or stage',
    signIn: 'Sign in', register: 'Create account', logout: 'Log out', email: 'Email', password: 'Password',
    prediction: 'Your prediction', stake: 'EscrowCoins per player', publish: 'Publish P2P agreement',
    open: 'Open challenges', mine: 'My agreements', accept: 'Accept challenge',
    settle: 'Verify result and settle', leaderboard: 'Leaderboard', receipt: 'Receipt',
    empty: 'Nothing here yet.', loginRequired: 'Sign in to continue.',
    worldCup: 'World Cup 2026', conditional: 'Conditional escrow', loading: 'Loading the World Cup fixture...',
    how: 'P2P escrow infrastructure', heroTitle: 'P2P agreements with verifiable settlement.',
    heroText: 'Two people agree on an outcome, lock equal value in a neutral escrow, and let verified data trigger settlement and a final receipt.',
    useCase: 'The World Cup is the live demo. The infrastructure can support any agreement with an objective, verifiable outcome.',
    virtualCredits: 'Agree on the condition', automaticLock: 'Both parties lock value', evidenceReceipt: 'Verify and settle',
    qr: 'Open by QR', createChallenge: 'Create challenge', scoreHelp: 'Set the exact full-time score.',
    stakeHelp: 'Both players lock the same virtual amount.', pool: 'Conditional escrow pool',
    continueGoogle: 'Continue with Google', continueApple: 'Continue with Apple', orEmail: 'or email',
    openPhone: 'Open on your phone', scanQr: 'Scan with your phone camera. No App Store required. Then choose Add to Home Screen.',
    sessionVerified: 'Verified UDoChain session', guestHint: 'Explore freely. Sign in only when creating an agreement.',
    flowKicker: 'What investors are seeing', flowTitle: 'A complete conditional escrow lifecycle',
    flowText: 'EscrowBet.cool demonstrates the UDoChain protocol through a simple World Cup challenge between two peers.',
    visualKicker: 'Peer-to-peer by design', visualTitle: 'Two people. One neutral agreement layer.',
    visualText: 'Neither participant controls the other party’s locked value. UDoChain coordinates the condition, evidence, settlement and receipt.',
    stepAgree: '1. Agreement', stepAgreeText: 'Party A defines the match, prediction and amount. Party B reviews and accepts the same terms.',
    stepLock: '2. Neutral lock', stepLockText: 'Equal value from both parties is reserved and unavailable while the agreement is active.',
    stepVerify: '3. Objective verification', stepVerifyText: 'The final match result becomes the external evidence used to resolve the condition.',
    stepSettle: '4. Settlement + receipt', stepSettleText: 'Value is released under the agreed rule and a verifiable receipt records the outcome.',
    reusable: 'Reusable beyond sports', demoLayer: 'Virtual-credit demo + live EVM testnet',
    marketKicker: 'World Cup demo scenario', events: 'matches', all: 'All', groups: 'Groups',
    round32: 'Round of 32', round16: 'Round of 16', quarters: 'Quarterfinals', semis: 'Semifinals', final: 'Final',
    group: 'Group', match: 'Match', venueTba: 'Venue TBA', challenge: 'Create agreement',
    sharedChallenge: 'Shared P2P agreement', invites: 'invites you to an escrow pool of', viewChallenge: 'Review agreement',
    share: 'Share', linkCopied: 'Agreement link copied.', verifiedSettlements: 'Verified settlements', wins: 'wins',
    predictionLabel: 'Prediction', stakeLabel: 'Locked per party', poolLabel: 'Escrow pool', close: 'Close',
    navMatches: 'Matches', navVault: 'Vault', navChallenges: 'Agreements', navRanking: 'Ranking', navQr: 'QR',
    techKicker: 'UDoChain infrastructure', techTitle: 'One protocol, multiple escrow use cases',
    tech1Title: 'Conditional Escrow', tech1Text: 'Lock value until independently verifiable conditions are completed.',
    tech2Title: 'Evidence Layer', tech2Text: 'Preserve structured evidence and its integrity through cryptographic hashes.',
    tech3Title: 'Programmable Agreements', tech3Text: 'Turn peer commitments into traceable execution workflows.',
    tech4Title: 'Verifiable Receipts', tech4Text: 'Produce final proof for every conditional settlement.',
    reelEyebrow: 'Technology partner spotlight', reelTitle: 'Behind the trust layer',
    reelSponsor: 'Technology partner message',
    reel1Title: 'Digital Trust Infrastructure', reel1Text: 'A neutral foundation for trusted operations across organizations, systems and jurisdictions.',
    reel2Title: 'Verifiable Evidence', reel2Text: 'Create auditable evidence trails with integrity, provenance and controlled access.',
    reel3Title: 'Dispute Resolution', reel3Text: 'Give legal and compliance teams a shared, traceable record for faster resolution.',
    reel4Title: 'Smart Traceability', reel4Text: 'Connect operational events from origin to outcome across complex enterprise workflows.',
    reel5Title: 'Real World Assets (RWA)', reel5Text: 'Link physical assets, documents and business events to verifiable digital records.',
    reelScene: 'Scene', reelPause: 'Pause reel', reelPlay: 'Play reel',
    disclaimer1: 'No real money.', disclaimer2: 'EscrowCoins are virtual credits.',
    disclaimer3: 'This is a technology demo for conditional escrow.', disclaimer4: 'UDoChain does not operate betting or gambling.',
  },
  es: {
    welcome: 'Bienvenido', available: 'Disponible', locked: 'Bloqueado', total: 'Total',
    matches: 'Partidos del Mundial', filter: 'Buscar equipo, grupo, ciudad o fase',
    signIn: 'Ingresar', register: 'Crear cuenta', logout: 'Salir', email: 'Email', password: 'Contrasena',
    prediction: 'Tu pronostico', stake: 'EscrowCoins por jugador', publish: 'Publicar acuerdo P2P',
    open: 'Challenges abiertos', mine: 'Mis acuerdos', accept: 'Aceptar challenge',
    settle: 'Verificar resultado y liquidar', leaderboard: 'Ranking', receipt: 'Receipt',
    empty: 'Todavía no hay elementos.', loginRequired: 'Ingresa para continuar.',
    worldCup: 'Mundial 2026', conditional: 'Escrow condicional', loading: 'Cargando el fixture del Mundial...',
    how: 'Infraestructura de escrow P2P', heroTitle: 'Acuerdos P2P con liquidación verificable.',
    heroText: 'Dos personas acuerdan un resultado, bloquean el mismo valor en un escrow neutral y un dato verificado activa la liquidación y el recibo final.',
    useCase: 'El Mundial es la demostración en vivo. La infraestructura puede aplicarse a cualquier acuerdo con un resultado objetivo y verificable.',
    virtualCredits: 'Acordar la condición', automaticLock: 'Ambas partes bloquean valor', evidenceReceipt: 'Verificar y liquidar',
    qr: 'Abrir por QR', createChallenge: 'Crear challenge', scoreHelp: 'Coloca el marcador exacto al finalizar el partido.',
    stakeHelp: 'Ambos jugadores bloquean el mismo monto virtual.', pool: 'Pool de escrow condicional',
    continueGoogle: 'Continuar con Google', continueApple: 'Continuar con Apple', orEmail: 'o con email',
    openPhone: 'Abrir en tu teléfono', scanQr: 'Escanea con la cámara del teléfono. No requiere App Store. Luego elige Agregar a pantalla de inicio.',
    sessionVerified: 'Sesión verificada por UDoChain', guestHint: 'Explora libremente. Solo debes ingresar para crear un acuerdo.',
    flowKicker: 'Lo que está viendo el inversor', flowTitle: 'Un ciclo completo de escrow condicional',
    flowText: 'EscrowBet.cool demuestra el protocolo UDoChain mediante un challenge simple del Mundial entre dos personas.',
    visualKicker: 'Diseñado para acuerdos entre personas', visualTitle: 'Dos personas. Una capa neutral de acuerdo.',
    visualText: 'Ningún participante controla el valor bloqueado por la otra parte. UDoChain coordina la condición, evidencia, liquidación y recibo.',
    stepAgree: '1. Acuerdo', stepAgreeText: 'La parte A define partido, pronóstico y monto. La parte B revisa y acepta exactamente las mismas condiciones.',
    stepLock: '2. Bloqueo neutral', stepLockText: 'El mismo valor de ambas partes queda reservado y no puede utilizarse mientras el acuerdo está activo.',
    stepVerify: '3. Verificación objetiva', stepVerifyText: 'El resultado final del partido se convierte en la evidencia externa que resuelve la condición.',
    stepSettle: '4. Liquidación + recibo', stepSettleText: 'El valor se libera según la regla acordada y un recibo verificable registra el resultado.',
    reusable: 'Reutilizable más allá del deporte', demoLayer: 'Demo con créditos virtuales + testnet EVM en vivo',
    marketKicker: 'Escenario demo del Mundial', events: 'partidos', all: 'Todos', groups: 'Grupos',
    round32: 'Dieciseisavos', round16: 'Octavos', quarters: 'Cuartos', semis: 'Semifinales', final: 'Final',
    group: 'Grupo', match: 'Partido', venueTba: 'Sede por confirmar', challenge: 'Crear acuerdo',
    sharedChallenge: 'Acuerdo P2P compartido', invites: 'te invita a un pool de escrow de', viewChallenge: 'Revisar acuerdo',
    share: 'Compartir', linkCopied: 'Enlace del acuerdo copiado.', verifiedSettlements: 'Liquidaciones verificadas', wins: 'aciertos',
    predictionLabel: 'Pronóstico', stakeLabel: 'Bloqueado por parte', poolLabel: 'Pool de escrow', close: 'Cerrar',
    navMatches: 'Partidos', navVault: 'Vault', navChallenges: 'Acuerdos', navRanking: 'Ranking', navQr: 'QR',
    techKicker: 'Infraestructura UDoChain', techTitle: 'Un protocolo, múltiples usos de escrow',
    tech1Title: 'Escrow condicional', tech1Text: 'Bloquea valor hasta que se cumplan condiciones verificables de forma independiente.',
    tech2Title: 'Capa de evidencia', tech2Text: 'Preserva evidencia estructurada y su integridad mediante hashes criptográficos.',
    tech3Title: 'Acuerdos programables', tech3Text: 'Convierte compromisos entre personas en flujos de ejecución trazables.',
    tech4Title: 'Recibos verificables', tech4Text: 'Genera una prueba final para cada liquidación condicional.',
    reelEyebrow: 'Espacio del socio tecnológico', reelTitle: 'Detrás de la capa de confianza',
    reelSponsor: 'Mensaje del socio tecnológico',
    reel1Title: 'Infraestructura de confianza digital', reel1Text: 'Una base neutral para operaciones confiables entre empresas, sistemas y jurisdicciones.',
    reel2Title: 'Evidencia verificable', reel2Text: 'Crea trazas de evidencia auditables con integridad, procedencia y acceso controlado.',
    reel3Title: 'Resolución de disputas', reel3Text: 'Ofrece a equipos legales y de compliance un registro compartido y trazable para resolver más rápido.',
    reel4Title: 'Trazabilidad inteligente', reel4Text: 'Conecta eventos operativos desde su origen hasta el resultado en flujos empresariales complejos.',
    reel5Title: 'Activos del mundo real (RWA)', reel5Text: 'Vincula activos físicos, documentos y eventos de negocio con registros digitales verificables.',
    reelScene: 'Escena', reelPause: 'Pausar reel', reelPlay: 'Reproducir reel',
    disclaimer1: 'No utiliza dinero real.', disclaimer2: 'Los EscrowCoins son créditos virtuales.',
    disclaimer3: 'Esta es una demo tecnológica de escrow condicional.', disclaimer4: 'UDoChain no opera apuestas ni juegos de azar.',
  },
  pt: {
    welcome: 'Bem-vindo', available: 'Disponivel', locked: 'Bloqueado', total: 'Total',
    matches: 'Jogos da Copa', filter: 'Buscar equipe, grupo, cidade ou fase',
    signIn: 'Entrar', register: 'Criar conta', logout: 'Sair', email: 'Email', password: 'Senha',
    prediction: 'Seu palpite', stake: 'EscrowCoins por jogador', publish: 'Publicar acordo P2P',
    open: 'Challenges abertos', mine: 'Meus acordos', accept: 'Aceitar challenge',
    settle: 'Verificar resultado e liquidar', leaderboard: 'Ranking', receipt: 'Receipt',
    empty: 'Ainda não há itens.', loginRequired: 'Entre para continuar.',
    worldCup: 'Copa do Mundo 2026', conditional: 'Escrow condicional', loading: 'Carregando os jogos da Copa...',
    how: 'Infraestrutura de escrow P2P', heroTitle: 'Acordos P2P com liquidação verificável.',
    heroText: 'Duas pessoas concordam com um resultado, bloqueiam o mesmo valor em um escrow neutro e um dado verificado ativa a liquidação e o recibo final.',
    useCase: 'A Copa do Mundo é a demonstração ao vivo. A infraestrutura pode atender qualquer acordo com resultado objetivo e verificável.',
    virtualCredits: 'Definir a condição', automaticLock: 'Ambas as partes bloqueiam valor', evidenceReceipt: 'Verificar e liquidar',
    qr: 'Abrir por QR', createChallenge: 'Criar challenge', scoreHelp: 'Defina o placar exato ao final da partida.',
    stakeHelp: 'Os dois jogadores bloqueiam o mesmo valor virtual.', pool: 'Pool de escrow condicional',
    continueGoogle: 'Continuar com Google', continueApple: 'Continuar com Apple', orEmail: 'ou por email',
    openPhone: 'Abrir no celular', scanQr: 'Escaneie com a câmera do celular. Não requer App Store. Depois escolha Adicionar à tela inicial.',
    sessionVerified: 'Sessão verificada pela UDoChain', guestHint: 'Explore livremente. Entre apenas quando quiser criar um acordo.',
    flowKicker: 'O que o investidor está vendo', flowTitle: 'Um ciclo completo de escrow condicional',
    flowText: 'EscrowBet.cool demonstra o protocolo UDoChain através de um desafio simples da Copa entre duas pessoas.',
    visualKicker: 'Criado para acordos entre pessoas', visualTitle: 'Duas pessoas. Uma camada neutra de acordo.',
    visualText: 'Nenhum participante controla o valor bloqueado pela outra parte. A UDoChain coordena condição, evidência, liquidação e recibo.',
    stepAgree: '1. Acordo', stepAgreeText: 'A parte A define jogo, palpite e valor. A parte B revisa e aceita exatamente os mesmos termos.',
    stepLock: '2. Bloqueio neutro', stepLockText: 'O mesmo valor de ambas as partes fica reservado e indisponível enquanto o acordo estiver ativo.',
    stepVerify: '3. Verificação objetiva', stepVerifyText: 'O resultado final do jogo se torna a evidência externa usada para resolver a condição.',
    stepSettle: '4. Liquidação + recibo', stepSettleText: 'O valor é liberado conforme a regra acordada e um recibo verificável registra o resultado.',
    reusable: 'Reutilizável além dos esportes', demoLayer: 'Demo com créditos virtuais + testnet EVM ao vivo',
    marketKicker: 'Cenário demo da Copa', events: 'jogos', all: 'Todos', groups: 'Grupos',
    round32: 'Fase de 32', round16: 'Oitavas', quarters: 'Quartas', semis: 'Semifinais', final: 'Final',
    group: 'Grupo', match: 'Jogo', venueTba: 'Local a confirmar', challenge: 'Criar acordo',
    sharedChallenge: 'Acordo P2P compartilhado', invites: 'convida você para um pool de escrow de', viewChallenge: 'Revisar acordo',
    share: 'Compartilhar', linkCopied: 'Link do acordo copiado.', verifiedSettlements: 'Liquidações verificadas', wins: 'acertos',
    predictionLabel: 'Palpite', stakeLabel: 'Bloqueado por parte', poolLabel: 'Pool de escrow', close: 'Fechar',
    navMatches: 'Jogos', navVault: 'Vault', navChallenges: 'Acordos', navRanking: 'Ranking', navQr: 'QR',
    techKicker: 'Infraestrutura UDoChain', techTitle: 'Um protocolo, múltiplos usos de escrow',
    tech1Title: 'Escrow condicional', tech1Text: 'Bloqueia valor até que condições verificáveis de forma independente sejam concluídas.',
    tech2Title: 'Camada de evidência', tech2Text: 'Preserva evidências estruturadas e sua integridade por meio de hashes criptográficos.',
    tech3Title: 'Acordos programáveis', tech3Text: 'Transforma compromissos entre pessoas em fluxos de execução rastreáveis.',
    tech4Title: 'Recibos verificáveis', tech4Text: 'Produz uma prova final para cada liquidação condicional.',
    reelEyebrow: 'Espaço do parceiro tecnológico', reelTitle: 'Por trás da camada de confiança',
    reelSponsor: 'Mensagem do parceiro tecnológico',
    reel1Title: 'Infraestrutura de confiança digital', reel1Text: 'Uma base neutra para operações confiáveis entre empresas, sistemas e jurisdições.',
    reel2Title: 'Evidência verificável', reel2Text: 'Cria trilhas de evidência auditáveis com integridade, procedência e acesso controlado.',
    reel3Title: 'Resolução de disputas', reel3Text: 'Oferece às equipes jurídicas e de compliance um registro compartilhado e rastreável para decisões mais rápidas.',
    reel4Title: 'Rastreabilidade inteligente', reel4Text: 'Conecta eventos operacionais da origem ao resultado em fluxos empresariais complexos.',
    reel5Title: 'Ativos do mundo real (RWA)', reel5Text: 'Vincula ativos físicos, documentos e eventos de negócio a registros digitais verificáveis.',
    reelScene: 'Cena', reelPause: 'Pausar reel', reelPlay: 'Reproduzir reel',
    disclaimer1: 'Não utiliza dinheiro real.', disclaimer2: 'EscrowCoins são créditos virtuais.',
    disclaimer3: 'Esta é uma demo tecnológica de escrow condicional.', disclaimer4: 'A UDoChain não opera apostas nem jogos de azar.',
  },
  fr: {
    welcome: 'Bienvenue', available: 'Disponible', locked: 'Bloque', total: 'Total',
    matches: 'Matchs de la Coupe', filter: 'Rechercher equipe, groupe, ville ou phase',
    signIn: 'Connexion', register: 'Creer un compte', logout: 'Deconnexion', email: 'Email', password: 'Mot de passe',
    prediction: 'Votre pronostic', stake: 'EscrowCoins par joueur', publish: 'Publier accord P2P',
    open: 'Challenges ouverts', mine: 'Mes accords', accept: 'Accepter le challenge',
    settle: 'Verifier et regler', leaderboard: 'Classement', receipt: 'Receipt',
    empty: 'Aucun élément pour le moment.', loginRequired: 'Connectez-vous pour continuer.',
    worldCup: 'Coupe du Monde 2026', conditional: 'Escrow conditionnel', loading: 'Chargement des matchs de la Coupe...',
    how: 'Infrastructure d’escrow P2P', heroTitle: 'Des accords P2P au règlement vérifiable.',
    heroText: 'Deux personnes conviennent d’un résultat, bloquent la même valeur dans un escrow neutre, puis une donnée vérifiée déclenche le règlement et le reçu final.',
    useCase: 'La Coupe du Monde est la démonstration en direct. L’infrastructure peut servir tout accord fondé sur un résultat objectif et vérifiable.',
    virtualCredits: 'Définir la condition', automaticLock: 'Les deux parties bloquent la valeur', evidenceReceipt: 'Vérifier et régler',
    qr: 'Ouvrir par QR', createChallenge: 'Créer un challenge', scoreHelp: 'Indiquez le score exact à la fin du match.',
    stakeHelp: 'Les deux joueurs bloquent le même montant virtuel.', pool: 'Pool d’escrow conditionnel',
    continueGoogle: 'Continuer avec Google', continueApple: 'Continuer avec Apple', orEmail: 'ou par email',
    openPhone: 'Ouvrir sur votre téléphone', scanQr: 'Scannez avec la caméra du téléphone. Aucun App Store requis. Puis choisissez Ajouter à l’écran d’accueil.',
    sessionVerified: 'Session vérifiée par UDoChain', guestHint: 'Explorez librement. Connectez-vous uniquement pour créer un accord.',
    flowKicker: 'Ce que voit l’investisseur', flowTitle: 'Un cycle complet d’escrow conditionnel',
    flowText: 'EscrowBet.cool démontre le protocole UDoChain à travers un défi simple de Coupe du Monde entre deux personnes.',
    visualKicker: 'Conçu pour les accords entre pairs', visualTitle: 'Deux personnes. Une couche d’accord neutre.',
    visualText: 'Aucun participant ne contrôle la valeur bloquée par l’autre. UDoChain coordonne la condition, la preuve, le règlement et le reçu.',
    stepAgree: '1. Accord', stepAgreeText: 'La partie A définit le match, le pronostic et le montant. La partie B examine et accepte les mêmes conditions.',
    stepLock: '2. Blocage neutre', stepLockText: 'La même valeur de chaque partie est réservée et reste indisponible tant que l’accord est actif.',
    stepVerify: '3. Vérification objective', stepVerifyText: 'Le résultat final du match devient la preuve externe utilisée pour résoudre la condition.',
    stepSettle: '4. Règlement + reçu', stepSettleText: 'La valeur est libérée selon la règle convenue et un reçu vérifiable enregistre le résultat.',
    reusable: 'Réutilisable au-delà du sport', demoLayer: 'Démo en crédits virtuels + testnet EVM en direct',
    marketKicker: 'Scénario démo de la Coupe', events: 'matchs', all: 'Tous', groups: 'Groupes',
    round32: 'Tour des 32', round16: 'Huitièmes', quarters: 'Quarts', semis: 'Demi-finales', final: 'Finale',
    group: 'Groupe', match: 'Match', venueTba: 'Lieu à confirmer', challenge: 'Créer un accord',
    sharedChallenge: 'Accord P2P partagé', invites: 'vous invite à un pool d’escrow de', viewChallenge: 'Examiner l’accord',
    share: 'Partager', linkCopied: 'Lien de l’accord copié.', verifiedSettlements: 'Règlements vérifiés', wins: 'réussites',
    predictionLabel: 'Pronostic', stakeLabel: 'Bloqué par partie', poolLabel: 'Pool d’escrow', close: 'Fermer',
    navMatches: 'Matchs', navVault: 'Vault', navChallenges: 'Accords', navRanking: 'Classement', navQr: 'QR',
    techKicker: 'Infrastructure UDoChain', techTitle: 'Un protocole, plusieurs usages d’escrow',
    tech1Title: 'Escrow conditionnel', tech1Text: 'Bloque la valeur jusqu’à l’accomplissement de conditions vérifiables indépendamment.',
    tech2Title: 'Couche de preuve', tech2Text: 'Préserve les preuves structurées et leur intégrité grâce aux empreintes cryptographiques.',
    tech3Title: 'Accords programmables', tech3Text: 'Transforme les engagements entre personnes en workflows d’exécution traçables.',
    tech4Title: 'Reçus vérifiables', tech4Text: 'Produit une preuve finale pour chaque règlement conditionnel.',
    reelEyebrow: 'Espace du partenaire technologique', reelTitle: 'Derrière la couche de confiance',
    reelSponsor: 'Message du partenaire technologique',
    reel1Title: 'Infrastructure de confiance numérique', reel1Text: 'Une base neutre pour des opérations fiables entre entreprises, systèmes et juridictions.',
    reel2Title: 'Preuve vérifiable', reel2Text: 'Crée des pistes de preuve auditables avec intégrité, provenance et accès contrôlé.',
    reel3Title: 'Résolution des litiges', reel3Text: 'Fournit aux équipes juridiques et conformité un dossier partagé et traçable pour décider plus vite.',
    reel4Title: 'Traçabilité intelligente', reel4Text: 'Relie les événements opérationnels de leur origine à leur résultat dans des workflows complexes.',
    reel5Title: 'Actifs du monde réel (RWA)', reel5Text: 'Relie les actifs physiques, documents et événements métier à des registres numériques vérifiables.',
    reelScene: 'Scène', reelPause: 'Mettre le reel en pause', reelPlay: 'Lire le reel',
    disclaimer1: 'Aucun argent réel.', disclaimer2: 'Les EscrowCoins sont des crédits virtuels.',
    disclaimer3: 'Ceci est une démo technologique d’escrow conditionnel.', disclaimer4: 'UDoChain n’opère ni paris ni jeux d’argent.',
  },
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

function normalizeBetMatch(match: Record<string, unknown>): Match {
  return {
    matchId: String(match.id ?? match.match_id ?? match.matchId ?? ''),
    stage: String(match.stage ?? match.phase ?? match.round ?? ''),
    groupCode: String(match.group_code ?? match.group ?? match.groupCode ?? ''),
    homeTeam: String(match.home_team ?? match.homeTeam ?? match.team_home ?? 'TBD'),
    awayTeam: String(match.away_team ?? match.awayTeam ?? match.team_away ?? 'TBD'),
    kickoffUtc: String(match.kickoff_utc ?? match.kickoffUtc ?? match.match_date ?? ''),
    stadium: String(match.stadium ?? match.venue ?? ''),
    city: String(match.city ?? match.host_city ?? ''),
    status: String(match.status ?? 'scheduled'),
    homeScore: match.home_score == null ? null : Number(match.home_score),
    awayScore: match.away_score == null ? null : Number(match.away_score),
  };
}

export default function EscrowChallengeApp() {
  const { locale } = useLocale();
  const t = copy[locale];
  const disclaimers = [t.disclaimer1, t.disclaimer2, t.disclaimer3, t.disclaimer4];
  const [account, setAccount] = useState<Account | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [openAgreements, setOpenAgreements] = useState<Agreement[]>([]);
  const [myAgreements, setMyAgreements] = useState<Agreement[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authOpen, setAuthOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sharedAgreement, setSharedAgreement] = useState<Agreement | null>(null);

  const loadPublic = useCallback(async () => {
    try {
      const data = await request<{ matches: Match[] }>('/api/escrow-challenges/matches');
      setMatches(data.matches);
    } catch {
      const response = await fetch(`${BET_API_URL}/api/matches`);
      if (!response.ok) throw new Error('The World Cup fixture is temporarily unavailable');
      const payload = await response.json();
      const source = Array.isArray(payload) ? payload : payload.matches || payload.data || [];
      setMatches(source.map(normalizeBetMatch));
    }
    request<{ leaderboard: Leader[] }>('/api/escrow-challenges/leaderboard')
      .then((data) => setLeaders(data.leaderboard)).catch(() => setLeaders([]));
  }, []);

  const loadPrivate = useCallback(async (session: Account) => {
    const [walletData, openData, mineData] = await Promise.all([
      request<{ wallet: Wallet }>('/api/escrow-challenges/wallet', {}, session.token),
      request<{ agreements: Agreement[] }>('/api/escrow-challenges/agreements/open', {}, session.token),
      request<{ agreements: Agreement[] }>('/api/escrow-challenges/agreements/me', {}, session.token),
    ]);
    setWallet(walletData.wallet);
    setOpenAgreements(openData.agreements);
    setMyAgreements(mineData.agreements);
  }, []);

  useEffect(() => {
    const saved = readAccount();
    setAccount(saved);
    loadPublic().catch((error) => setNotice(error.message));
    if (saved) loadPrivate(saved).catch(() => { clearAccount(); setAccount(null); });
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (challengeId) {
      request<{ agreement: Agreement }>(`/api/escrow-challenges/agreements/${encodeURIComponent(challengeId)}/public`)
        .then((data) => setSharedAgreement(data.agreement)).catch((error) => setNotice(error.message));
    }
    QRCode.toDataURL(window.location.origin, {
      width: 320, margin: 2, color: { dark: '#06101d', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => undefined);
  }, [loadPrivate, loadPublic]);

  const filteredMatches = useMemo(() => {
    const value = search.trim().toLowerCase();
    return matches.filter((match) =>
      (stageFilter === 'all' || matchStageKey(match) === stageFilter) &&
      (!value || [match.homeTeam, match.awayTeam, match.groupCode, match.stage, match.city, match.stadium]
        .filter(Boolean).join(' ').toLowerCase().includes(value))
    );
  }, [matches, search, stageFilter]);

  const featuredMatch = filteredMatches[0] || matches[0] || null;

  function requireAuth(action?: () => void) {
    if (!account) {
      setNotice(t.loginRequired);
      setAuthOpen(true);
      return;
    }
    action?.();
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    setBusy(true);
    setNotice('');
    try {
      if (authMode === 'register') {
        await request('/api/auth/register', {
          method: 'POST', body: JSON.stringify({ email, password, source: 'escrow-challenge' }),
        });
        setNotice('Account created. Verify your email, then sign in.');
        setAuthMode('login');
      } else {
        const data = await request<{ token: string; user: { id: string; email: string; username?: string } }>(
          '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
        );
        const session = { ...data.user, token: data.token };
        saveAccount(session);
        setAccount(session);
        setAuthOpen(false);
        await loadPrivate(session);
        setNotice(`${t.welcome}, ${session.email}`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !selected) return requireAuth();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request('/api/escrow-challenges/agreements', {
        method: 'POST',
        body: JSON.stringify({
          matchId: selected.matchId,
          stake: Number(form.get('stake')),
          prediction: { homeScore: Number(form.get('homeScore')), awayScore: Number(form.get('awayScore')) },
        }),
      }, account.token);
      setSelected(null);
      await loadPrivate(account);
      setNotice('P2P agreement published.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not create agreement');
    } finally {
      setBusy(false);
    }
  }

  async function acceptAgreement(event: FormEvent<HTMLFormElement>, agreement: Agreement) {
    event.preventDefault();
    if (!account) return requireAuth();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request(`/api/escrow-challenges/agreements/${agreement.challengeId}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          prediction: { homeScore: Number(form.get('homeScore')), awayScore: Number(form.get('awayScore')) },
        }),
      }, account.token);
      await loadPrivate(account);
      setNotice('Agreement accepted. EscrowCoins are now locked.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not accept agreement');
    } finally {
      setBusy(false);
    }
  }

  async function settle(agreement: Agreement) {
    if (!account) return requireAuth();
    setBusy(true);
    try {
      await request(`/api/escrow-challenges/agreements/${agreement.challengeId}/settle`, { method: 'POST' }, account.token);
      await Promise.all([loadPrivate(account), loadPublic()]);
      setNotice('Verified result settled. Receipt and evidence created.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Result is not ready');
    } finally {
      setBusy(false);
    }
  }

  async function shareAgreement(agreement: Agreement) {
    const url = `${window.location.origin}/?challenge=${encodeURIComponent(agreement.challengeId)}`;
    if (navigator.share) {
      await navigator.share({
        title: `${agreement.match.homeTeam} vs ${agreement.match.awayTeam}`,
        text: `Accept my EscrowBet.cool challenge for ${agreement.stakePerPlayer} EscrowCoins.`,
        url,
      }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setNotice(t.linkCopied);
  }

  return (
    <div className="escrow-surface min-h-screen">
      <section className="sports-hero">
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
          <div className="hero-account-bar">
            <div className="flex min-w-0 items-center gap-3">
              <div className="user-orb"><UserRound size={19} /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {account ? `${t.welcome}, ${account.email}` : 'EscrowBet.cool World Cup'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {account ? t.sessionVerified : t.guestHint}
                </p>
              </div>
            </div>
            <div className="hero-balance"><span>{t.available}</span><strong>{wallet?.available ?? 1000} <small>EC</small></strong></div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.28fr_.72fr]">
            <div className="featured-market">
              <div className="featured-overlay">
                <div className="flex items-center justify-between gap-3">
                  <span className="live-badge"><span /> {t.worldCup}</span>
                  <span className="protocol-badge"><ShieldCheck size={13} /> {t.conditional}</span>
                </div>
                {featuredMatch ? (
                  <>
                    <div className="featured-kickoff">
                      <CalendarDays size={14} />{formatKickoff(featuredMatch.kickoffUtc, locale)}
                      {featuredMatch.city && <><span>·</span><MapPin size={14} />{featuredMatch.city}</>}
                    </div>
                    <div className="featured-teams">
                      <TeamCrest name={featuredMatch.homeTeam} />
                      <div className="featured-versus">
                        <span>{featuredMatch.groupCode ? `GROUP ${featuredMatch.groupCode}` : featuredMatch.stage || 'MATCH'}</span>
                        <strong>VS</strong>
                      </div>
                      <TeamCrest name={featuredMatch.awayTeam} />
                    </div>
                    <button onClick={() => requireAuth(() => setSelected(featuredMatch))} className="hero-cta">
                      {t.createChallenge} <ArrowRight size={18} />
                    </button>
                  </>
                ) : <div className="py-14 text-center text-sm text-slate-400">{t.loading}</div>}
              </div>
            </div>

            <div className="quick-panel">
              <div>
                <p className="section-kicker">{t.how}</p>
                <h1 className="mt-2 text-2xl font-black leading-tight text-white md:text-3xl">{t.heroTitle}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">{t.heroText}</p>
                <p className="hero-use-case">{t.useCase}</p>
              </div>
              <div className="quick-steps">
                <QuickStep icon={<CircleDollarSign size={18} />} label={t.virtualCredits} />
                <QuickStep icon={<LockKeyhole size={18} />} label={t.automaticLock} />
                <QuickStep icon={<FileCheck2 size={18} />} label={t.evidenceReceipt} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {account ? (
                  <button onClick={() => { clearAccount(); setAccount(null); setWallet(null); }} className="secondary-button">{t.logout}</button>
                ) : (
                  <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }} className="primary-button">{t.signIn}</button>
                )}
                <button onClick={() => setQrOpen(true)} className="secondary-button"><QrCode size={17} /> {t.qr}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="p2p-visual-section" aria-labelledby="p2p-visual-title">
        <Image
          src="/escrowbet-p2p-hero.png"
          alt="Two football supporters using EscrowBet on their phones during a match"
          fill
          priority
          sizes="100vw"
        />
        <div className="p2p-visual-scrim" />
        <div className="p2p-visual-content">
          <p className="section-kicker">{t.visualKicker}</p>
          <h2 id="p2p-visual-title">{t.visualTitle}</h2>
          <p>{t.visualText}</p>
          <a href="#onchain" className="primary-button">{t.navVault} <ArrowRight size={17} /></a>
        </div>
      </section>

      {notice && <div className="mx-auto max-w-7xl px-4 pt-4"><div className="app-notice" role="status"><CheckCircle2 size={17} />{notice}</div></div>}

      <EscrowLifecycle t={t} />

      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="wallet-strip">
          <WalletStat icon={<WalletCards size={19} />} label={t.available} value={wallet?.available ?? '—'} accent="green" />
          <WalletStat icon={<LockKeyhole size={19} />} label={t.locked} value={wallet?.locked ?? '—'} accent="orange" />
          <WalletStat icon={<CircleDollarSign size={19} />} label={t.total} value={wallet?.total ?? 1000} accent="blue" />
        </div>
        <OnChainWalletPanel match={featuredMatch} />
      </section>

      {sharedAgreement && (
        <section className="mx-auto max-w-7xl px-4 pb-2">
          <div className="shared-challenge">
            <div>
              <p className="section-kicker">{t.sharedChallenge}</p>
              <h2 className="mt-2 text-xl font-black text-white">{sharedAgreement.match.homeTeam} vs {sharedAgreement.match.awayTeam}</h2>
              <p className="mt-2 text-sm text-slate-300">{sharedAgreement.creator.email} {t.invites} {sharedAgreement.pot} EscrowCoins.</p>
            </div>
            <button onClick={() => requireAuth(() => document.getElementById('agreements')?.scrollIntoView({ behavior: 'smooth' }))} className="primary-button">{t.viewChallenge} <ChevronRight size={17} /></button>
          </div>
        </section>
      )}

      <section id="matches" className="mx-auto max-w-7xl px-4 py-7">
        <div className="section-heading">
          <div><p className="section-kicker">{t.marketKicker}</p><h2 className="section-title">{t.matches}</h2></div>
          <span className="match-count">{filteredMatches.length} {t.events}</span>
        </div>
        <div className="search-control mt-4"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.filter} /></div>
        <div className="filter-scroll" aria-label="Match stage filters">
          {[
            ['all', t.all], ['group', t.groups], ['round32', t.round32],
            ['round16', t.round16], ['quarters', t.quarters], ['semis', t.semis], ['final', t.final],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setStageFilter(value)} className={stageFilter === value ? 'active' : ''}>{label}</button>
          ))}
        </div>
        <div className="match-grid">
          {filteredMatches.slice(0, 104).map((match) => (
            <button key={match.matchId} onClick={() => requireAuth(() => setSelected(match))} className="market-card text-left">
              <div className="market-meta">
                <span className="market-stage">{match.groupCode ? `${t.group} ${match.groupCode}` : match.stage || t.match}</span>
                <span className="flex items-center gap-1"><Clock3 size={12} />{formatKickoff(match.kickoffUtc, locale)}</span>
              </div>
              <div className="market-team"><TeamDot name={match.homeTeam} /><strong>{match.homeTeam}</strong><span>—</span></div>
              <div className="market-team"><TeamDot name={match.awayTeam} /><strong>{match.awayTeam}</strong><span>—</span></div>
              <div className="market-footer">
                <span className="truncate">{[match.stadium, match.city].filter(Boolean).join(' · ') || t.venueTba}</span>
                <span className="market-action">{t.challenge} <ChevronRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="agreements" className="agreements-band">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 lg:grid-cols-2">
          <AgreementList title={t.open} agreements={openAgreements} empty={t.empty} labels={t}>
            {(agreement) => (
              <form onSubmit={(event) => acceptAgreement(event, agreement)} className="agreement-action-row">
                <ScoreFields />
                <button disabled={busy} className="primary-button">{t.accept}</button>
              </form>
            )}
          </AgreementList>
          <AgreementList title={t.mine} agreements={myAgreements} empty={t.empty} labels={t}>
            {(agreement) => (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {agreement.status === 'awaiting_result' && <button disabled={busy} onClick={() => settle(agreement)} className="primary-button">{t.settle}</button>}
                {agreement.status === 'open' && <button onClick={() => shareAgreement(agreement)} className="secondary-button"><Share2 size={16} /> {t.share}</button>}
                {agreement.settlement?.receiptHash && <code className="truncate text-xs text-[#73f7ae]">{t.receipt}: {agreement.settlement.receiptHash}</code>}
              </div>
            )}
          </AgreementList>
        </div>
      </section>

      <section id="leaderboard" className="mx-auto max-w-7xl px-4 py-9">
        <div className="section-heading">
          <div><p className="section-kicker">{t.verifiedSettlements}</p><h2 className="section-title">{t.leaderboard}</h2></div>
          <Trophy className="text-[#ffad42]" size={26} />
        </div>
        <div className="leaderboard-board">
          {leaders.length ? leaders.map((leader, index) => (
            <div key={leader._id} className="leader-row">
              <strong className={index < 3 ? 'leader-rank top' : 'leader-rank'}>#{index + 1}</strong>
              <div className="user-orb small"><UserRound size={15} /></div>
              <code className="truncate text-sm text-slate-300">{leader._id}</code>
              <span className="text-sm text-white">{leader.wins} {t.wins}</span>
              <strong className="text-[#73f7ae]">{leader.escrowCoinsWon} EC</strong>
            </div>
          )) : <p className="p-5 text-sm text-slate-400">{t.empty}</p>}
        </div>
      </section>

      <TechnologyReel t={t} />

      <div className="disclaimer-band">
        <div className="mx-auto grid max-w-7xl gap-2 px-4 py-5 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          {disclaimers.map((item) => <p key={item}><ShieldCheck size={13} />{item}</p>)}
        </div>
      </div>

      {selected && (
        <Modal title={`${selected.homeTeam} vs ${selected.awayTeam}`} closeLabel={t.close} onClose={() => setSelected(null)}>
          <form onSubmit={createAgreement} className="challenge-form">
            <div className="sheet-match-summary"><TeamCrest name={selected.homeTeam} compact /><span>VS</span><TeamCrest name={selected.awayTeam} compact /></div>
            <div className="form-section">
              <label className="form-label">{t.prediction}</label>
              <p className="form-helper">{t.scoreHelp}</p>
              <div className="mt-3"><ScoreFields large /></div>
            </div>
            <div className="form-section">
              <label className="form-label">{t.stake}</label>
              <div className="stake-input"><CircleDollarSign size={20} /><input name="stake" type="number" min="1" max="1000" defaultValue="50" /><span>EC</span></div>
              <p className="form-helper">{t.stakeHelp}</p>
            </div>
            <div className="settlement-preview"><LockKeyhole size={18} /><span>{t.pool}</span><strong>2 x stake</strong></div>
            <button disabled={busy} className="primary-button w-full">{t.publish} <ArrowRight size={18} /></button>
          </form>
        </Modal>
      )}

      {authOpen && (
        <Modal title={authMode === 'login' ? t.signIn : t.register} closeLabel={t.close} onClose={() => setAuthOpen(false)}>
          <form onSubmit={handleAuth} className="space-y-4">
            <a href={`${API_URL}/api/auth/google?source=escrow-challenge`} className="social-button bg-white text-slate-950"><strong>G</strong> {t.continueGoogle}</a>
            {process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true' && (
              <a href={`${API_URL}/api/auth/apple?source=escrow-challenge`} className="social-button bg-black text-white">{t.continueApple}</a>
            )}
            <div className="form-divider"><span />{t.orEmail}<span /></div>
            <div><label className="form-label">{t.email}</label><input name="email" type="email" autoComplete="email" required className="form-field mt-2 w-full" /></div>
            <div><label className="form-label">{t.password}</label><input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={6} required className="form-field mt-2 w-full" /></div>
            <button disabled={busy} className="primary-button w-full">{authMode === 'login' ? t.signIn : t.register}</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="auth-switch">{authMode === 'login' ? t.register : t.signIn}</button>
          </form>
        </Modal>
      )}

      {qrOpen && (
        <Modal title={t.openPhone} closeLabel={t.close} onClose={() => setQrOpen(false)}>
          <div className="text-center">
            {qrDataUrl && <Image src={qrDataUrl} width={280} height={280} unoptimized alt="QR code to open EscrowBet.cool" className="mx-auto w-full max-w-[280px] rounded-md bg-white p-3" />}
            <p className="mt-4 text-sm leading-6 text-slate-300">{t.scanQr}</p>
          </div>
        </Modal>
      )}

      <MobileNav t={t} onQr={() => setQrOpen(true)} />
    </div>
  );
}

function EscrowLifecycle({ t }: { t: Record<string, string> }) {
  const steps = [
    { icon: <UserRound />, title: t.stepAgree, text: t.stepAgreeText },
    { icon: <LockKeyhole />, title: t.stepLock, text: t.stepLockText },
    { icon: <ShieldCheck />, title: t.stepVerify, text: t.stepVerifyText },
    { icon: <FileCheck2 />, title: t.stepSettle, text: t.stepSettleText },
  ];

  return (
    <section className="escrow-lifecycle">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="lifecycle-heading">
          <div>
            <p className="section-kicker">{t.flowKicker}</p>
            <h2 className="section-title">{t.flowTitle}</h2>
            <p>{t.flowText}</p>
          </div>
          <div className="lifecycle-proof">
            <span><CheckCircle2 size={14} />{t.reusable}</span>
            <span><CheckCircle2 size={14} />{t.demoLayer}</span>
          </div>
        </div>
        <div className="lifecycle-grid">
          {steps.map((step, index) => (
            <article className="lifecycle-step" key={step.title}>
              <div className="lifecycle-step-top">
                <span>{step.icon}</span>
                <strong>0{index + 1}</strong>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileNav({ onQr, t }: { onQr: () => void; t: Record<string, string> }) {
  return (
    <nav className="mobile-app-nav">
      <a href="#matches"><CalendarDays /><small>{t.navMatches}</small></a>
      <a href="#onchain"><WalletCards /><small>{t.navVault}</small></a>
      <a href="#agreements"><ShieldCheck /><small>{t.navChallenges}</small></a>
      <a href="#leaderboard"><Trophy /><small>{t.navRanking}</small></a>
      <button onClick={onQr}><QrCode /><small>{t.navQr}</small></button>
    </nav>
  );
}

function TechnologyReel({ t }: { t: Record<string, string> }) {
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scenes = [
    { image: '/udochain-reel-digital-trust.png', title: t.reel1Title, text: t.reel1Text },
    { image: '/udochain-reel-evidence.png', title: t.reel2Title, text: t.reel2Text },
    { image: '/udochain-reel-disputes.png', title: t.reel3Title, text: t.reel3Text },
    { image: '/udochain-reel-traceability.png', title: t.reel4Title, text: t.reel4Text },
    { image: '/udochain-reel-rwa.png', title: t.reel5Title, text: t.reel5Text },
  ];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActiveScene((scene) => (scene + 1) % scenes.length), 4000);
    return () => window.clearInterval(timer);
  }, [playing, scenes.length]);

  return (
    <section className="enterprise-reel-section">
      <div className="enterprise-reel-heading">
        <div>
          <span className="reel-sponsor-label">{t.reelSponsor}</span>
          <p className="section-kicker">{t.reelEyebrow}</p>
          <h2 className="section-title">{t.reelTitle}</h2>
        </div>
        <button
          type="button"
          className="reel-play-control"
          aria-label={playing ? t.reelPause : t.reelPlay}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      </div>

      <div className="enterprise-reel" aria-live="polite">
        {scenes.map((scene, index) => (
          <article key={scene.image} className={`enterprise-scene ${activeScene === index ? 'active' : ''}`}>
            <Image
              src={scene.image}
              alt=""
              fill
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 767px) 100vw, 540px"
            />
            <div className="enterprise-scene-scrim" />
            <div className="enterprise-scene-copy">
              <span>{String(index + 1).padStart(2, '0')} / 05</span>
              <h3>{scene.title}</h3>
              <p>{scene.text}</p>
            </div>
            <div className="udochain-reel-brand">
              <Image src="/udochain-logo.png" alt="" width={28} height={28} />
              <strong>udochain.com</strong>
            </div>
          </article>
        ))}

        <div className="enterprise-reel-nav">
          {scenes.map((scene, index) => (
            <button
              type="button"
              key={scene.image}
              className={activeScene === index ? 'active' : ''}
              aria-label={`${t.reelScene} ${index + 1}: ${scene.title}`}
              onClick={() => {
                setActiveScene(index);
                setPlaying(false);
              }}
            >
              <span />
              <strong>{String(index + 1).padStart(2, '0')}</strong>
            </button>
          ))}
        </div>
      </div>

    </section>
  );
}

function TeamCrest({ name, compact = false }: { name: string; compact?: boolean }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase();
  return (
    <div className={compact ? 'team-crest compact' : 'team-crest'}>
      <div className="crest-circle">{initials}</div>
      <strong>{name}</strong>
    </div>
  );
}

function TeamDot({ name }: { name: string }) {
  return <span className="team-dot">{name.slice(0, 2).toUpperCase()}</span>;
}

function QuickStep({ icon, label }: { icon: ReactNode; label: string }) {
  return <div><span>{icon}</span><strong>{label}</strong><CheckCircle2 size={15} /></div>;
}

function ScoreFields({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? 'score-fields large' : 'score-fields'}>
      <input aria-label="Home score" inputMode="numeric" name="homeScore" type="number" min="0" max="30" defaultValue="1" />
      <span>:</span>
      <input aria-label="Away score" inputMode="numeric" name="awayScore" type="number" min="0" max="30" defaultValue="0" />
    </div>
  );
}

function WalletStat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className={`wallet-stat wallet-${accent}`}>
      <span className="wallet-icon">{icon}</span>
      <div><p>{label}</p><strong>{value}</strong><small>EscrowCoins</small></div>
    </div>
  );
}

function AgreementList({ title, agreements, empty, labels, children }: { title: string; agreements: Agreement[]; empty: string; labels: Record<string, string>; children: (agreement: Agreement) => ReactNode }) {
  return (
    <div>
      <div className="section-heading"><h2 className="section-title">{title}</h2><span className="match-count">{agreements.length}</span></div>
      <div className="mt-5 space-y-3">
        {agreements.length ? agreements.map((agreement) => (
          <article key={agreement.challengeId} className="agreement-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="agreement-id">{agreement.challengeId.slice(0, 14)}</span>
                <strong className="mt-2 block text-white">{agreement.match.homeTeam} vs {agreement.match.awayTeam}</strong>
                <p className="mt-1 truncate text-xs text-slate-500">{agreement.creator.email}</p>
              </div>
              <span className="status-chip">{agreement.status.replace('_', ' ')}</span>
            </div>
            <div className="agreement-numbers">
              <div><span>{labels.predictionLabel}</span><strong>{agreement.creator.prediction.homeScore}:{agreement.creator.prediction.awayScore}</strong></div>
              <div><span>{labels.stakeLabel}</span><strong>{agreement.stakePerPlayer} EC</strong></div>
              <div><span>{labels.poolLabel}</span><strong>{agreement.pot} EC</strong></div>
            </div>
            {children(agreement)}
          </article>
        )) : <p className="empty-state">{empty}</p>}
      </div>
    </div>
  );
}

function Modal({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="app-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header"><h2>{title}</h2><button onClick={onClose} aria-label={closeLabel}><X size={21} /></button></div>
        {children}
      </div>
    </div>
  );
}

function matchStageKey(match: Match) {
  const value = `${match.stage || ''} ${match.groupCode || ''}`.toLowerCase();
  if (match.groupCode || value.includes('group')) return 'group';
  if (value.includes('32')) return 'round32';
  if (value.includes('16')) return 'round16';
  if (value.includes('quarter')) return 'quarters';
  if (value.includes('semi')) return 'semis';
  if (value.includes('final') && !value.includes('semi')) return 'final';
  return 'group';
}

function formatKickoff(value: string | undefined, locale: Locale) {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
