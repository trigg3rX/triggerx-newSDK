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
 * Check ETH balance for a given signer using SDK-provided RPC
 * This function uses our own RPC provider to ensure reliable connection
 * even if the user's RPC fails
 * @param signer - ethers.Signer instance (used to get wallet address)
 * @param chainId - Optional chain ID. If not provided, will try to get from signer's provider
 * @returns Balance information or error response
 */
export const checkEthBalance = async (
    userAddress: string,
    chainId: string | number
): Promise<{ success: boolean; data?: { ethBalanceWei: bigint; ethBalance: string }; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
    if (!userAddress || typeof userAddress !== 'string') {
        return createErrorResponse(
            new ValidationError('userAddress', 'User address is required and must be a string'),
            'Validation error'
        );
    }

    if (!chainId) {
        return createErrorResponse(
            new ValidationError('chainId', 'Chain ID is required'),
            'Validation error'
        );
    }

    try {
        // Resolve chain ID
        const resolvedChainId = chainId.toString();

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
            resolvedChainId
        );

        // Read balance using our RPC provider
        const ethBalanceWei = await (contract as any).getBalance(userAddress);

        // Convert from wei to ETH
        const ethBalance = ethers.formatEther(ethBalanceWei);
        console.log('ethBalance', ethBalance);
        return { success: true, data: { ethBalanceWei, ethBalance } };
    } catch (error) {
        console.error('Error checking ETH balance:', error);

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
            'Failed to check ETH balance'
        );
    }
};

/**
 * @deprecated Use checkEthBalance instead. This is an alias for backward compatibility.
 */
export const checkTgBalance = checkEthBalance;