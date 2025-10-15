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

export const checkTgBalance = async (signer: ethers.Signer): Promise<{ success: boolean; data?: { tgBalanceWei: bigint; tgBalance: string }; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
    // Validate inputs
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
        const address = await signer.getAddress();
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