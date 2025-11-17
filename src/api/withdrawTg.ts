import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { 
  createContractWithSdkRpcAndSigner,
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
 * Withdraw ETH in exchange for TG tokens.
 * @param signer ethers.Signer instance
 * @param amountTG The amount of TG tokens to withdraw (as a string or BigNumberish)
 * @returns The transaction object or error response
 */
export const withdrawTg = async (
    signer: ethers.Signer,
    amountTG: string | ethers.BigNumberish
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
    if (!signer) {
        return createErrorResponse(
            new ValidationError('signer', 'Signer is required'),
            'Validation error'
        );
    }

    if (!amountTG || (typeof amountTG === 'string' && amountTG.trim() === '') || Number(amountTG) <= 0) {
        return createErrorResponse(
            new ValidationError('amountTG', 'Amount must be a positive number'),
            'Validation error'
        );
    }

    try {
        // Resolve chain ID and create contract instances with SDK RPC provider
        let resolvedChainId: string;
        let contractWithSigner: ethers.BaseContract;
        
        try {
            // Resolve chain ID from signer
            resolvedChainId = await resolveChainId(signer);
            
            // Get contract address
            const gasRegistryContractAddress = getContractAddress(resolvedChainId, 'gasRegistry');
            
            // Create contract instances with SDK RPC provider
            const contractInstances = await createContractWithSdkRpcAndSigner(
                gasRegistryContractAddress,
                gasRegistryAbi,
                signer,
                resolvedChainId
            );
            contractWithSigner = contractInstances.contractWithSigner;
        } catch (configError) {
            if (configError instanceof ConfigurationError) {
                return createErrorResponse(configError, 'Configuration error');
            }
            return createErrorResponse(
                new ConfigurationError('Failed to initialize contract', { originalError: configError }),
                'Configuration error'
            );
        }

        // Assumes the contract has a function: claimEthForTg(uint256 amount)
        const amountTGWei = ethers.parseEther(amountTG.toString());
        const tx = await (contractWithSigner as any).claimETHForTG(amountTGWei);
        await tx.wait();
        return { success: true, data: tx };
    } catch (error) {
        console.error('Error withdrawing TG:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
                return createErrorResponse(
                    new NetworkError('Network error during TG withdrawal', { originalError: error, amountTG }),
                    'Network error'
                );
            } else if (error.message.includes('contract') || error.message.includes('transaction')) {
                return createErrorResponse(
                    new ContractError('Contract error during TG withdrawal', { originalError: error, amountTG }),
                    'Contract error'
                );
            } else if (error.message.includes('insufficient') || error.message.includes('balance')) {
                return createErrorResponse(
                    new ValidationError('balance', 'Insufficient TG balance for withdrawal', { originalError: error, amountTG }),
                    'Validation error'
                );
            }
        }
        
        return createErrorResponse(
            error,
            'Failed to withdraw TG'
        );
    }
};
