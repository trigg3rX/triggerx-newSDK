import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { 
  createContractWithSdkRpc,
  getContractAddress,
  resolveChainId
} from '../contracts/contractUtils';
import { 
  ValidationError, 
  NetworkError, 
  ContractError, 
  ConfigurationError,
  createErrorResponse 
} from '../utils/errors';

/**
 * Check TG balance for a given signer using SDK-provided RPC
 * This function uses our own RPC provider to ensure reliable connection
 * even if the user's RPC fails
 * @param signer - ethers.Signer instance (used to get wallet address)
 * @param chainId - Optional chain ID. If not provided, will try to get from signer's provider
 * @returns Balance information or error response
 */
export const checkTgBalance = async (
    signer: ethers.Signer,
    chainId?: string | number
): Promise<{ success: boolean; data?: { tgBalanceWei: bigint; tgBalance: string }; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
    if (!signer) {
        return createErrorResponse(
            new ValidationError('signer', 'Signer is required'),
            'Validation error'
        );
    }

    try {
        // Resolve chain ID (use provided chainId or resolve from signer)
        let resolvedChainId: string;
        try {
            resolvedChainId = await resolveChainId(signer, chainId);
        } catch (configError) {
            if (configError instanceof ConfigurationError) {
                return createErrorResponse(configError, 'Configuration error');
            }
            return createErrorResponse(
                new ConfigurationError('Failed to resolve chain ID', { originalError: configError }),
                'Configuration error'
            );
        }

        // Get contract address
        let gasRegistryContractAddress: string;
        try {
            gasRegistryContractAddress = getContractAddress(resolvedChainId, 'gasRegistry');
        } catch (configError) {
            if (configError instanceof ConfigurationError) {
                return createErrorResponse(configError, 'Configuration error');
            }
            return createErrorResponse(
                new ConfigurationError('Failed to get contract address', { originalError: configError }),
                'Configuration error'
            );
        }

        // Create contract instance with SDK RPC provider (read-only)
        // This ensures we can read balance even if user's RPC fails
        const contract = await createContractWithSdkRpc(
            gasRegistryContractAddress,
            gasRegistryAbi,
            resolvedChainId,
            signer
        );
        
        // Get address from signer (this doesn't require provider)
        const address = await signer.getAddress();
        
        // Read balance using our RPC provider
        const balance = await (contract as any).balances(address);
        
        // balance is likely an array or object with ethSpent and TGbalance, both in wei
        // We'll convert TGbalance from wei to ETH
        // If balance is an array: [ethSpent, TGbalance]
        // If balance is an object: { ethSpent, TGbalance }
        let tgBalanceWei: bigint;
        if (Array.isArray(balance)) {
            tgBalanceWei = balance[1] as bigint;
        } else if (balance && balance.TGbalance !== undefined) {
            tgBalanceWei = balance.TGbalance as bigint;
        } else {
            return createErrorResponse(
                new ContractError('Unexpected balance format from contract', { balance }),
                'Contract error'
            );
        }
        
        const tgBalance = ethers.formatEther(tgBalanceWei);
        console.log('tgBalanceEth', tgBalance);
        return { success: true, data: { tgBalanceWei, tgBalance } };
    } catch (error) {
        console.error('Error checking TG balance:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
                return createErrorResponse(
                    new NetworkError('Network error during balance check', { originalError: error }),
                    'Network error'
                );
            } else if (error.message.includes('contract') || error.message.includes('transaction')) {
                return createErrorResponse(
                    new ContractError('Contract error during balance check', { originalError: error }),
                    'Contract error'
                );
            }
        }
        
        return createErrorResponse(
            error,
            'Failed to check TG balance'
        );
    }
};