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

export const topupTg = async (tgAmount: number, signer: ethers.Signer): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
    if (!tgAmount || tgAmount <= 0) {
        return createErrorResponse(
            new ValidationError('tgAmount', 'TG amount must be a positive number'),
            'Validation error'
        );
    }

    if (!signer) {
        return createErrorResponse(
            new ValidationError('signer', 'Signer is required'),
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

        // Each TG costs 0.001 ETH, so calculate the ETH required for the given TG amount
        const amountInEthWei = tgAmount;
        // const amountInEthWei = ethers.parseEther(amountInEth.toString());
        const tx = await contract.purchaseTG(
            amountInEthWei,
            { value: amountInEthWei}
        );
        await tx.wait();
        return { success: true, data: tx };
    } catch (error) {
        console.error('Error topping up TG:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
                return createErrorResponse(
                    new NetworkError('Network error during TG top-up', { originalError: error, tgAmount }),
                    'Network error'
                );
            } else if (error.message.includes('contract') || error.message.includes('transaction')) {
                return createErrorResponse(
                    new ContractError('Contract error during TG top-up', { originalError: error, tgAmount }),
                    'Contract error'
                );
            } else if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
                return createErrorResponse(
                    new ValidationError('balance', 'Insufficient funds for TG top-up', { originalError: error, tgAmount }),
                    'Validation error'
                );
            }
        }
        
        return createErrorResponse(
            error,
            'Failed to top up TG'
        );
    }
};
