// sdk-triggerx/src/api/deleteJob.ts

import { TriggerXClient } from '../client';
import JobRegistryABI from '../contracts/abi/JobRegistry.json';
import { deleteJobOnChain } from '../contracts/JobRegistry';
import { CONTRACT_ADDRESSES_BY_CHAIN } from '../config';
import { Signer } from 'ethers';
import { 
  ValidationError, 
  NetworkError, 
  AuthenticationError, 
  ContractError, 
  ApiError, 
  ConfigurationError,
  createErrorResponse,
  extractHttpStatusCode,
  determineErrorCode
} from '../utils/errors';

export const deleteJob = async (client: TriggerXClient, jobId: string, signer: Signer, chainId: string): Promise<{ success: boolean; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
  // Validate inputs
  if (!jobId || typeof jobId !== 'string') {
    return createErrorResponse(
      new ValidationError('jobId', 'Job ID is required and must be a string'),
      'Validation error'
    );
  }

  if (!chainId || typeof chainId !== 'string') {
    return createErrorResponse(
      new ValidationError('chainId', 'Chain ID is required and must be a string'),
      'Validation error'
    );
  }

  const apiKey = client.getApiKey();
  if (!apiKey) {
    return createErrorResponse(
      new AuthenticationError('API key is required but not provided'),
      'Authentication error'
    );
  }

  const { jobRegistry: jobRegistryAddress } = CONTRACT_ADDRESSES_BY_CHAIN[chainId];

  if (!jobRegistryAddress) {
    return createErrorResponse(
      new ConfigurationError(`No contract address found for chain ID: ${chainId}`),
      'Configuration error'
    );
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting job:', error);
    
    // Determine error type based on the error
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return createErrorResponse(
          new NetworkError('Network error during job deletion', { originalError: error, jobId, chainId }, httpStatusCode),
          'Network error'
        );
      } else if (error.message.includes('contract') || error.message.includes('transaction')) {
        return createErrorResponse(
          new ContractError('Contract error during job deletion', { originalError: error, jobId, chainId }, httpStatusCode),
          'Contract error'
        );
      } else if (error.message.includes('API') || error.message.includes('response')) {
        return createErrorResponse(
          new ApiError('API error during job deletion', { originalError: error, jobId, chainId }, httpStatusCode),
          'API error'
        );
      }
    }
    
    return createErrorResponse(
      error,
      'Failed to delete job'
    );
  }
};
