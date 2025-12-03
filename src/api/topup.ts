import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { 
  createContractWithSdkRpcAndSigner,
  getContractAddress,
  resolveChainId,
  waitForTransactionReceiptWithRpcFallback
} from '../contracts/contractUtils';
import { 
  ValidationError, 
  NetworkError, 
  ContractError, 
  ConfigurationError,
  createErrorResponse 
} from '../utils/errors';
export const depositEth = async (ethAmount: bigint, signer: ethers.Signer): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    console.log('depositing ETH balance', ethAmount);
    // Validate inputs
    if (!ethAmount || ethAmount <= 0n) {
        return createErrorResponse(
            new ValidationError('ethAmount', 'ETH amount must be a positive bigint'),
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
        let rpcProvider!: ethers.JsonRpcProvider;
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
            rpcProvider = contractInstances.rpcProvider;
        } catch (configError) {
            if (configError instanceof ConfigurationError) {
                return createErrorResponse(configError, 'Configuration error');
            }
            return createErrorResponse(
                new ConfigurationError('Failed to initialize contract', { originalError: configError }),
                'Configuration error'
            );
        }

        // Convert ethAmount to wei if needed
        console.log('ethAmount', ethAmount);
        const amountInEthWei = typeof ethAmount === 'bigint' ? ethAmount : BigInt(ethAmount);
        console.log('amountInEthWei', amountInEthWei);
        
        // Estimate gas for the transaction using SDK RPC provider
        // This ensures gas estimation works even if user's RPC fails
        let estimatedGas: bigint;
        try {
            console.log('Estimating gas using SDK RPC provider...');
            // Use contract instance with SDK RPC provider for estimation
            // Specify the signer's address in the estimation options
            estimatedGas = await (contract as any).depositETH.estimateGas(
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
            const tx = await (contractWithSigner as any).depositETH(
                amountInEthWei,
                { 
                    value: amountInEthWei,
                    gasLimit: gasWithBuffer
                }
            );
            await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);
            return { success: true, data: tx };
        } catch (gasEstimateError) {
            // If gas estimation fails, try without gas limit (let provider estimate)
            console.warn('Gas estimation failed (using SDK RPC), proceeding without gas limit:', gasEstimateError);
            const tx = await (contractWithSigner as any).depositETH(
                amountInEthWei,
                { value: amountInEthWei }
            );
            await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);
            return { success: true, data: tx };
        }
    } catch (error) {
        console.error('Error depositing ETH:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
                return createErrorResponse(
                    new NetworkError('Network error during ETH deposit', { originalError: error, ethAmount }),
                    'Network error'
                );
            } else if (error.message.includes('contract') || error.message.includes('transaction')) {
                return createErrorResponse(
                    new ContractError('Contract error during ETH deposit', { originalError: error, ethAmount }),
                    'Contract error'
                );
            } else if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
                return createErrorResponse(
                    new ValidationError('balance', 'Insufficient funds for ETH deposit', { originalError: error, ethAmount }),
                    'Validation error'
                );
            }
        }
        
        return createErrorResponse(
            error,
            'Failed to deposit ETH'
        );
    }
};

/**
 * @deprecated Use depositEth instead. This is an alias for backward compatibility.
 */
export const topupTg = depositEth;
