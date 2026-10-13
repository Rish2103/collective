import { PoolData, PoolState } from '../types';
import { getTokenConfig, CONTRACT_ADDRESSES } from '../contracts/config';
import { formatTokenAmount, shortenAddress } from './formatters';

export function generateReceiptCardDataUrl(pool: PoolData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const tokenConfig = getTokenConfig(pool.token);
  const isPaidOut = pool.state === PoolState.PaidOut;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = pool.deadline <= now;
  const isTargetMet = pool.totalContributed >= pool.targetAmount && pool.targetAmount > 0n;

  const targetFormatted = formatTokenAmount(pool.targetAmount, tokenConfig.decimals);
  const contributedFormatted = formatTokenAmount(pool.totalContributed, tokenConfig.decimals);

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#090c15');
  bgGrad.addColorStop(0.5, '#0e1322');
  bgGrad.addColorStop(1, '#141a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Subtle grid or glowing ambient circles
  const radGrad = ctx.createRadialGradient(1000, 100, 10, 1000, 100, 450);
  radGrad.addColorStop(0, isPaidOut ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.14)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // 3. Card Outer Border
  ctx.strokeStyle = '#222b40';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 570);

  // 4. Header Bar
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('COLLECTIVE 2.0', 60, 85);

  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 13px system-ui, -apple-system, monospace';
  ctx.fillText('VERIFIED ON-CHAIN OUTCOME RECEIPT', 270, 82);

  // Monad Network Tag (Top Right)
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('⚡ MONAD TESTNET (CHAIN 10143)', 850, 83);

  // Header Divider
  ctx.strokeStyle = '#222b40';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 110);
  ctx.lineTo(1140, 110);
  ctx.stroke();

  // 5. Pool Title & ID
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`POOL #${pool.id}`, 60, 150);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  const cleanTitle = pool.title.length > 42 ? pool.title.slice(0, 40) + '...' : pool.title;
  ctx.fillText(cleanTitle, 60, 195);

  // 6. Outcome Status Pill
  let statusText = 'GOAL SECURED & AWAITING SETTLEMENT';
  let pillBg = '#1e1b4b';
  let pillText = '#a5b4fc';
  let pillBorder = '#4338ca';

  if (isPaidOut) {
    statusText = 'SETTLED & DISBURSED TO RECIPIENT';
    pillBg = '#064e3b';
    pillText = '#34d399';
    pillBorder = '#059669';
  } else if (isExpired && !isTargetMet) {
    statusText = 'EXPIRED UNDER TARGET • 100% PULL REFUNDS ACTIVE';
    pillBg = '#4c0519';
    pillText = '#fb7185';
    pillBorder = '#e11d48';
  }

  // Draw pill
  ctx.fillStyle = pillBg;
  ctx.strokeStyle = pillBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(60, 220, 520, 36, [10]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = pillText;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`● ${statusText}`, 80, 243);

  // 7. Stat Cards (3 across)
  const drawStatBox = (x: number, y: number, w: number, h: number, label: string, value: string, sub: string, accentColor: string) => {
    ctx.fillStyle = '#0f1422';
    ctx.strokeStyle = '#222b40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [14]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(label.toUpperCase(), x + 20, y + 32);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(value, x + 20, y + 74);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(sub, x + 20, y + 102);
  };

  drawStatBox(60, 280, 340, 125, 'Total Raised', `${contributedFormatted} ${tokenConfig.symbol}`, `Target: ${targetFormatted} ${tokenConfig.symbol}`, isPaidOut ? '#34d399' : '#818cf8');
  drawStatBox(430, 280, 340, 125, 'Contributors', `${pool.contributors.length} Backers`, 'Non-custodial smart escrow', '#ffffff');
  drawStatBox(800, 280, 340, 125, 'Finality Speed', '~400ms Monad', 'Sub-cent gas fees (<$0.001)', '#38bdf8');

  // 8. On-Chain Settlement Verification Section
  ctx.fillStyle = '#0c0f18';
  ctx.strokeStyle = '#1e2436';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(60, 435, 1080, 100, [12]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`Recipient: ${pool.recipient}`, 80, 468);
  ctx.fillText(`Escrow Contract: ${CONTRACT_ADDRESSES.collectivePool} (Verified)`, 80, 498);
  ctx.fillText(`Settlement Network: Monad Testnet (Chain ID 10143) • 100% Non-Custodial`, 80, 522);

  // 9. Footer
  ctx.fillStyle = '#475569';
  ctx.font = '12px monospace';
  ctx.fillText('COLLECTIVE 2.0 • Built for Metropolis Hackathon (Consumer Products & Payments)', 60, 575);
  ctx.fillText(`Generated: ${new Date().toUTCString()}`, 830, 575);

  return canvas.toDataURL('image/png');
}

export function downloadReceiptPng(pool: PoolData): boolean {
  try {
    const dataUrl = generateReceiptCardDataUrl(pool);
    if (!dataUrl) return false;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `collective-receipt-pool-${pool.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to generate or download receipt PNG:', err);
    return false;
  }
}
