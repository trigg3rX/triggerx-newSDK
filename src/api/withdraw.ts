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

/**
 * Withdraw ETH from the Gas Registry.
 * @param signer ethers.Signer instance
 * @param amountETH The amount of ETH to withdraw (as a string or BigNumberish)
 * @returns The transaction object or error response
 */
export const withdrawEth = async (
    signer: ethers.Signer,
    amountETHwei: string | ethers.BigNumberish
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
    if (!signer) {
        return createErrorResponse(
            new ValidationError('signer', 'Signer is required'),
            'Validation error'
        );
    }

    if (!amountETHwei || (typeof amountETHwei === 'string' && amountETHwei.trim() === '') || Number(amountETHwei) <= 0) {
        return createErrorResponse(
            new ValidationError('amountETHwei', 'Amount must be a positive number'),
            'Validation error'
        );
    }

    try {
        // Resolve chain ID and create contract instances with SDK RPC provider
        let resolvedChainId: string;
        let contract!: ethers.BaseContract;
        let contractWithSigner!: ethers.BaseContract;
        let rpcProvider!: ethers.JsonRpcProvider;
        let signerAddress: string;

        try {
            // Resolve chain ID from signer
            signerAddress = await signer.getAddress();
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

        let tx;
        try {
            console.log('Estimating gas for withdrawETHBalance using SDK RPC provider...');
            const estimatedGas: bigint = await (contract as any).withdrawETHBalance.estimateGas(amountETHwei, {
                from: signerAddress,
            });
            console.log('Estimated gas (withdrawETHBalance):', estimatedGas.toString());
            const gasWithBuffer = (estimatedGas * BigInt(110)) / BigInt(100);
            console.log('Gas with 10% buffer (withdrawETHBalance):', gasWithBuffer.toString());

            tx = await (contractWithSigner as any).withdrawETHBalance(amountETHwei, {
                gasLimit: gasWithBuffer,
            });
        } catch (gasEstimateError) {
            console.warn(
                'Gas estimation failed for withdrawETHBalance (using SDK RPC), proceeding without explicit gas limit:',
                gasEstimateError
            );
            tx = await (contractWithSigner as any).withdrawETHBalance(amountETHwei);
        }

        await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);
        return { success: true, data: tx };
    } catch (error) {
        console.error('Error withdrawing ETH:', error);

        if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
                return createErrorResponse(
                    new NetworkError('Network error during ETH withdrawal', { originalError: error, amountETHwei }),
                    'Network error'
                );
            } else if (error.message.includes('contract') || error.message.includes('transaction')) {
                return createErrorResponse(
                    new ContractError('Contract error during ETH withdrawal', { originalError: error, amountETHwei }),
                    'Contract error'
                );
            } else if (error.message.includes('insufficient') || error.message.includes('balance')) {
                return createErrorResponse(
                    new ValidationError('balance', 'Insufficient ETH balance for withdrawal', { originalError: error, amountETHwei }),
                    'Validation error'
                );
            }
        }

        return createErrorResponse(
            error,
            'Failed to withdraw ETH'
        );
    }
};

/**
 * @deprecated Use withdrawEth instead. This is an alias for backward compatibility.
 */
export const withdrawTg = withdrawEth;
