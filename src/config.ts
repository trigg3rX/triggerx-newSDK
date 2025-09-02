// import dotenv from 'dotenv';
// dotenv.config();

export interface SDKConfig {
  apiKey: string;
  apiUrl: string;
  contractAddress: string;
}

export function getConfig(): SDKConfig {
  return {
    apiKey: process.env.API_KEY || '',
    apiUrl: process.env.API_URL || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
  };
} 