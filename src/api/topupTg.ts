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
        // Try to get chainId from signer's provider if not provided
        // If signer's provider fails, we'll use the provided chainId or return error
        let resolvedChainId: string | undefined;
        
        try {
            const network = await signer.provider?.getNetwork();
            resolvedChainId = network?.chainId ? network.chainId.toString() : undefined;
        } catch (providerError) {
            // If user's RPC fails, we can't get chainId from it
            // This is expected in cases where user's RPC is down
            console.warn('Could not get network from signer provider:', providerError);
        }
        
        if (!resolvedChainId) {
            return createErrorResponse(
                new ConfigurationError('Chain ID is required. Please ensure signer has a working provider.'),
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

        // Use SDK-provided RPC provider for contract connection
        // This ensures we can interact with the contract even if user's RPC fails
        const rpcProvider = getRpcProvider(resolvedChainId);
        
        if (!rpcProvider) {
            return createErrorResponse(
                new ConfigurationError(`RPC URL not configured for chain ID: ${resolvedChainId}. Cannot top up TG without RPC provider.`),
                'Configuration error'
            );
        }

        // Create contract instance with our RPC provider
        const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, rpcProvider);
        
        // Connect user's signer to the contract (this uses user's signer for transactions)
        const contractWithSigner = contract.connect(signer);

        // Each TG costs 0.001 ETH, so calculate the ETH required for the given TG amount
        const amountInEthWei = tgAmount;
        // const amountInEthWei = ethers.parseEther(amountInEth.toString());
        const tx = await (contractWithSigner as any).purchaseTG(
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
