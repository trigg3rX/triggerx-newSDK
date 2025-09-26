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
  // OP Sepolia? (used in examples) 11155420 - preserves previous defaults
  '11155420': {
    gasRegistry: '0x204F9278D6BB7714D7A40842423dFd5A27cC1b88',
    jobRegistry: '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b',
  },
  // Arbitrum One (42161)
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