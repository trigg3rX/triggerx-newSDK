// import dotenv from 'dotenv';
// dotenv.config();

import { ethers } from 'ethers';

export interface SDKConfig {
  apiKey: string;
  apiUrl: string;
}

// Contract addresses per chain
// Keyed by chainId as string to avoid bigint conversions throughout the SDK
export const CONTRACT_ADDRESSES_BY_CHAIN: Record<string, {
  gasRegistry: string;
  jobRegistry: string;
  safeFactory?: string;
  safeModule?: string;
  safeSingleton?: string;
  multisendCallOnly?: string;
  rpcUrl?: string;
}> = {
  // TESTNET CONFIGURATIONS
  // OP Sepolia (11155420) - Optimism Sepolia Testnet
  '11155420': {
    gasRegistry: '0x248E9f1B99F1AC8068254233D1F271ed0e0903D6',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
    safeFactory: '0x04359eDC46Cd6C6BD7F6359512984222BE10F8Be',
    safeModule:  '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
    multisendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    rpcUrl: 'https://sepolia.optimism.io',
  },
  // Ethereum Sepolia (11155111) - Ethereum Sepolia Testnet
  '11155111': {
    gasRegistry: '0x248E9f1B99F1AC8068254233D1F271ed0e0903D6',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
    safeFactory: '0xdf76E2A796a206D877086c717979054544B1D9Bc',
    safeModule:  '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
    multisendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    rpcUrl: 'https://rpc.sepolia.org',
  },
  // Arbitrum Sepolia (421614) - Arbitrum Sepolia Testnet
  '421614': {
    gasRegistry: '0x248E9f1B99F1AC8068254233D1F271ed0e0903D6',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
    safeFactory: '0x04359eDC46Cd6C6BD7F6359512984222BE10F8Be',
    safeModule:  '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
    multisendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    // safeSingleton can be provided per deployment (Safe or SafeL2)
  },
  // Base Sepolia (84532) - Base Sepolia Testnet
  '84532': {
    gasRegistry: '0x248E9f1B99F1AC8068254233D1F271ed0e0903D6',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
    safeFactory: '0x04359eDC46Cd6C6BD7F6359512984222BE10F8Be',
    safeModule:  '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
    multisendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    rpcUrl: 'https://sepolia.base.org',
  },

  // MAINNET CONFIGURATIONS
  // Arbitrum One (42161) - Mainnet
  '42161': {
    gasRegistry: '0xe2AC670F7D66c69D547A44D08F9bA1Fc0Fc0f991',
    jobRegistry: '0xAf1189aFd1F1880F09AeC3Cbc32cf415c735C710',
    safeFactory: '0x93528Df5984231059Cf5c5f2CE9b85c59250D096',
    safeModule: '0x100656372C821539651f5905Ca39b7C95f9AA433',
    multisendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  // Default/fallbacks can be extended as needed for other networks
};

export function getConfig(): SDKConfig {
  return {
    apiKey: '',
    apiUrl: '',
  };
}

/**
 * Get RPC provider for a given chain ID using SDK-configured RPC URLs
 * This ensures reliable connection even if user's RPC fails
 * @param chainId - Chain ID as string or number
 * @returns ethers.JsonRpcProvider instance or null if chain not supported
 */
export function getRpcProvider(chainId: string | number | undefined): ethers.JsonRpcProvider | null {
  const { rpcUrl } = getChainAddresses(chainId);
  if (!rpcUrl) {
    return null;
  }
  
  // Convert chainId to number for network configuration
  const chainIdNum = chainId ? Number(chainId) : undefined;
  
  if (!chainIdNum) {
    // If no chainId, create provider without network (will auto-detect)
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  
  // Create a Network object with the chainId to explicitly set the network
  // This prevents the provider from trying to auto-detect the network,
  // which can cause timeouts when the RPC is slow or unresponsive
  const network = ethers.Network.from(chainIdNum);
  
  // Create provider with explicit network to skip network detection
  // This prevents timeout issues when RPC is slow or unresponsive
  return new ethers.JsonRpcProvider(rpcUrl, network);
}

export function getChainAddresses(chainId: string | number | undefined) {
  const chainKey = String(chainId ?? '');
  const mapped = CONTRACT_ADDRESSES_BY_CHAIN[chainKey];
  return {
    gasRegistry: mapped ? mapped.gasRegistry : '',
    jobRegistry: mapped ? mapped.jobRegistry : '',
    safeFactory: mapped ? mapped.safeFactory : '',
    safeModule: mapped ? mapped.safeModule : '',
    safeSingleton: mapped ? mapped.safeSingleton : '',
    multisendCallOnly: mapped ? mapped.multisendCallOnly : '',
    rpcUrl: mapped ? mapped.rpcUrl : '',
  };
}