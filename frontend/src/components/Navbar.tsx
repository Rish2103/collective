import React from 'react';
import { ethers } from 'ethers';
import { Wallet, Droplets, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MONAD_TESTNET } from '../contracts/config';

interface NavbarProps {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  tokenBalance: bigint;
  tokenSymbol: string;
  isConnecting: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
  onOpenFaucet: () => void;
  onOpenCreatePool: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  isConnected,
  isCorrectNetwork,
  tokenBalance,
  tokenSymbol,
  isConnecting,
  onConnect,
  onSwitchNetwork,
  onOpenFaucet,
  onOpenCreatePool,
}) => {
  const formattedBalance = ethers.formatEther(tokenBalance);
  const displayBalance = parseFloat(formattedBalance).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : '';

  return (
    <header className="border-b border-purple-900/30 bg-[#0e1017]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-extrabold text-white text-xl tracking-wider">C</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">COLLECTIVE</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                MONAD TESTNET
              </span>
            </div>
            <p className="text-xs text-gray-400">Trustless Consumer Group Payments</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Network indicator */}
          {isConnected && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs bg-gray-900/80 border border-gray-800">
              {isCorrectNetwork ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-300 font-medium">{MONAD_TESTNET.name}</span>
                </>
              ) : (
                <button
                  onClick={onSwitchNetwork}
                  className="flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Switch to Monad</span>
                </button>
              )}
            </div>
          )}

          {/* Faucet button */}
          {isConnected && (
            <button
              onClick={onOpenFaucet}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 transition-colors shadow-sm"
              title="Mint test MockUSD tokens"
            >
              <Droplets className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Faucet:</span>
              <span className="mono font-bold text-white">{displayBalance} {tokenSymbol}</span>
            </button>
          )}

          {/* Create Pool CTA */}
          <button
            onClick={onOpenCreatePool}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + Create Pool
          </button>

          {/* Connect / Account */}
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white border border-gray-700/60 transition-colors"
            >
              <Wallet className="w-4 h-4 text-purple-400" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-900 border border-gray-800 text-gray-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="mono">{shortAddress}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
