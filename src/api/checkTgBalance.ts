import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { getChainAddresses, getRpcProvider } from '../config';
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
        // Try to get chainId from signer's provider if not provided
        // If signer's provider fails, we'll use the provided chainId or return error
        let resolvedChainId: string | undefined = chainId?.toString();
        
        if (!resolvedChainId) {
            try {
                const network = await signer.provider?.getNetwork();
                resolvedChainId = network?.chainId ? network.chainId.toString() : undefined;
            } catch (providerError) {
                // If user's RPC fails, we can't get chainId from it
                // This is expected in cases where user's RPC is down
                console.warn('Could not get network from signer provider, using provided chainId or will fail:', providerError);
            }
        }
        
        if (!resolvedChainId) {
            return createErrorResponse(
                new ConfigurationError('Chain ID is required. Please provide chainId parameter or ensure signer has a working provider.'),
                'Configuration error'
            );
        }

        const { gasRegistry } = getChainAddresses(resolvedChainId);
        const gasRegistryContractAddress = gasRegistry;
        
        if (!gasRegistryContractAddress) {
            return createErrorResponse(
                new ConfigurationError(`GasRegistry address not configured for chain ID: ${resolvedChainId}`),
                'Configuration error'
            );
        }

        // Use SDK-provided RPC provider instead of user's provider
        // This ensures we can read balance even if user's RPC fails
        const rpcProvider = getRpcProvider(resolvedChainId);
        
        if (!rpcProvider) {
            return createErrorResponse(
                new ConfigurationError(`RPC URL not configured for chain ID: ${resolvedChainId}. Cannot check balance without RPC provider.`),
                'Configuration error'
            );
        }

        // Create contract instance with our RPC provider (read-only)
        const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, rpcProvider);
        
        // Get address from signer (this doesn't require provider)
        const address = await signer.getAddress();
        
        // Read balance using our RPC provider
        const balance = await contract.balances(address);
        
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