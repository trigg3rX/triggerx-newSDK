// sdk-triggerx/src/api/deleteJob.ts

import { TriggerXClient } from '../client';
import JobRegistryABI from '../contracts/abi/JobRegistry.json';
import { deleteJobOnChain } from '../contracts/JobRegistry';
import { CONTRACT_ADDRESSES_BY_CHAIN } from '../config';
import { Signer } from 'ethers';

export const deleteJob = async (client: TriggerXClient, jobId: string, signer: Signer, chainId: string): Promise<void> => {
  const apiKey = client.getApiKey(); // Assuming you have a method to get the API key

  const { jobRegistry: jobRegistryAddress } = CONTRACT_ADDRESSES_BY_CHAIN[chainId];

  if (!jobRegistryAddress) {
    throw new Error(`No contract address found for chain ID: ${chainId}`);
  }

  try {
    console.log(`Deleting job ${jobId} on chain ${chainId}...`);
    
    // First delete on-chain
    await deleteJobOnChain({
      jobId,
      contractAddress: jobRegistryAddress,
      abi: JobRegistryABI,
      signer,
    });
    
    console.log('On-chain deletion successful, updating API...');
    
    // Then update the API
    await client.put<void>(
      `api/jobs/delete/${jobId}`, {}, 
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        timeout: 30000, // 30 second timeout
      }
    );
    
    console.log('API update successful');
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
