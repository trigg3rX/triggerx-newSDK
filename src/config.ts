// import dotenv from 'dotenv';
// dotenv.config();

export interface SDKConfig {
  apiKey: string;
  apiUrl: string;
}

// Contract addresses per chain
// Keyed by chainId as string to avoid bigint conversions throughout the SDK
export const CONTRACT_ADDRESSES_BY_CHAIN: Record<string, {
  gasRegistry: string;
  jobRegistry: string;
}> = {
  // TESTNET CONFIGURATIONS
  // OP Sepolia (11155420) - Optimism Sepolia Testnet
  '11155420': {
    gasRegistry: '0x664CB20BCEEc9416D290AC820e5446e61a5c75e4',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
  },
  // Ethereum Sepolia (11155111) - Ethereum Sepolia Testnet
  '11155111': {
    gasRegistry: '0x664CB20BCEEc9416D290AC820e5446e61a5c75e4',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
  },
  // Arbitrum Sepolia (421614) - Arbitrum Sepolia Testnet
  '421614': {
    gasRegistry: '0x664CB20BCEEc9416D290AC820e5446e61a5c75e4',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
  },
  // Base Sepolia (84532) - Base Sepolia Testnet
  '84532': {
    gasRegistry: '0x664CB20BCEEc9416D290AC820e5446e61a5c75e4',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
  },

  // MAINNET CONFIGURATIONS
  // Arbitrum One (42161) - Mainnet
  '42161': {
    gasRegistry: '0x93dDB2307F3Af5df85F361E5Cddd898Acd3d132d',
    jobRegistry: '0xAf1189aFd1F1880F09AeC3Cbc32cf415c735C710',
  },
  // Default/fallbacks can be extended as needed for other networks
};

export function getConfig(): SDKConfig {
  return {
    apiKey: '',
    apiUrl: '',
  };
}

export function getChainAddresses(chainId: string | number | undefined) {
  const chainKey = String(chainId ?? '');
  const mapped = CONTRACT_ADDRESSES_BY_CHAIN[chainKey];
  return {
    gasRegistry: mapped ? mapped.gasRegistry : '',
    jobRegistry: mapped ? mapped.jobRegistry : '',
  };
}