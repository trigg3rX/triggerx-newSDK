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

export const topupTg = async (tgAmount: number, signer: ethers.Signer): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    console.log('topping up TG balance', tgAmount);
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
        // Get contract address and create contract instances with SDK RPC provider
        // This ensures we can interact with the contract even if user's RPC fails
        let gasRegistryContractAddress: string;
        let contract: ethers.BaseContract;
        let contractWithSigner: ethers.BaseContract;
        let resolvedChainId: string;
        let signerAddress: string;

        try {
            // Get signer address (this doesn't require the signer's provider to work)
            signerAddress = await signer.getAddress();
            
            // Resolve chain ID from signer
            resolvedChainId = await resolveChainId(signer);
            
            // Get contract address
            gasRegistryContractAddress = getContractAddress(resolvedChainId, 'gasRegistry');
            
            // Create contract instances with SDK RPC provider
            const contractInstances = await createContractWithSdkRpcAndSigner(
                gasRegistryContractAddress,
                gasRegistryAbi,
                signer,
                resolvedChainId
            );
            contract = contractInstances.contract;
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

        // Each TG costs 0.001 ETH, so calculate the ETH required for the given TG amount
        console.log('tgAmount', tgAmount);
        const amountInEthWei = tgAmount;
        // const amountInEthWei = ethers.parseEther(amountInEth.toString());
        console.log('amountInEthWei', amountInEthWei);
        
        // Estimate gas for the transaction using SDK RPC provider
        // This ensures gas estimation works even if user's RPC fails
        let estimatedGas: bigint;
        try {
            console.log('Estimating gas using SDK RPC provider...');
            // Use contract instance with SDK RPC provider for estimation
            // Specify the signer's address in the estimation options
            estimatedGas = await (contract as any).purchaseTG.estimateGas(
                amountInEthWei,
                { 
                    value: amountInEthWei,
                    from: signerAddress  // Specify the sender address for accurate estimation
                }
            );
            console.log('Estimated gas (using SDK RPC):', estimatedGas.toString());
            
            // Add 10% buffer to ensure transaction doesn't fail
            const gasWithBuffer = (estimatedGas * BigInt(110)) / BigInt(100);
            console.log('Gas with 10% buffer:', gasWithBuffer.toString());
            
            // Execute transaction using signer (for signing)
            const tx = await (contractWithSigner as any).purchaseTG(
                amountInEthWei,
                { 
                    value: amountInEthWei,
                    gasLimit: gasWithBuffer
                }
            );
            await tx.wait();
            return { success: true, data: tx };
        } catch (gasEstimateError) {
            // If gas estimation fails, try without gas limit (let provider estimate)
            console.warn('Gas estimation failed (using SDK RPC), proceeding without gas limit:', gasEstimateError);
            const tx = await (contractWithSigner as any).purchaseTG(
                amountInEthWei,
                { value: amountInEthWei }
            );
            await tx.wait();
            return { success: true, data: tx };
        }
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
