import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { getChainAddresses } from '../config';
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
        const network = await signer.provider?.getNetwork();
        const chainId = network?.chainId ? network.chainId.toString() : undefined;
        const { gasRegistry } = getChainAddresses(chainId);
        const gasRegistryContractAddress = gasRegistry;
        
        if (!gasRegistryContractAddress) {
            return createErrorResponse(
                new ConfigurationError(`GasRegistry address not configured for chain ID: ${chainId}`),
                'Configuration error'
            );
        }

        const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, signer);

        // Assumes the contract has a function: claimEthForTg(uint256 amount)
        const amountTGWei = ethers.parseEther(amountTG.toString());
        const tx = await contract.claimETHForTG(amountTGWei);
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
