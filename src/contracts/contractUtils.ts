import { ethers, Contract, Signer } from 'ethers';
import { getRpcProvider, getChainAddresses } from '../config';
import { ConfigurationError } from '../utils/errors';

/**
 * Get SDK RPC provider for a given chain ID
 * This ensures reliable connection even if user's RPC fails
 * @param chainId - Chain ID as string or number
 * @returns ethers.JsonRpcProvider instance
 * @throws ConfigurationError if RPC provider is not available
 */
export function getSdkRpcProvider(chainId: string | number | undefined): ethers.JsonRpcProvider {
    if (!chainId) {
        throw new ConfigurationError('Chain ID is required to get RPC provider');
    }

    const rpcProvider = getRpcProvider(chainId);
    
    if (!rpcProvider) {
        throw new ConfigurationError(`RPC URL not configured for chain ID: ${chainId}`);
    }

    return rpcProvider;
}

/**
 * Resolve chain ID from signer's provider or use provided chainId
 * @param signer - ethers.Signer instance
 * @param chainId - Optional chain ID (takes precedence if provided)
 * @returns Resolved chain ID as string
 * @throws ConfigurationError if chain ID cannot be resolved
 */
export async function resolveChainId(
    signer: ethers.Signer,
    chainId?: string | number
): Promise<string> {
    // If chainId is provided, use it
    if (chainId) {
        return chainId.toString();
    }

    // Try to get chainId from signer's provider
    try {
        const network = await signer.provider?.getNetwork();
        if (network?.chainId) {
            return network.chainId.toString();
        }
    } catch (providerError) {
        // If user's RPC fails, we can't get chainId from it
        console.warn('Could not get network from signer provider:', providerError);
    }

    throw new ConfigurationError('Chain ID is required. Please provide chainId parameter or ensure signer has a working provider.');
}

/**
 * Create a contract instance with SDK RPC provider for read operations and gas estimation
 * This ensures reliable contract interaction even if user's RPC fails
 * @param contractAddress - Contract address
 * @param abi - Contract ABI
 * @param chainId - Chain ID (will be resolved if not provided)
 * @param signer - Optional signer (used to resolve chainId if not provided)
 * @returns Contract instance connected to SDK RPC provider
 */
export async function createContractWithSdkRpc(
    contractAddress: string,
    abi: any,
    chainId: string | number | undefined,
    signer?: ethers.Signer
): Promise<Contract> {
    // Resolve chain ID
    let resolvedChainId: string;
    if (chainId) {
        resolvedChainId = chainId.toString();
    } else if (signer) {
        resolvedChainId = await resolveChainId(signer);
    } else {
        throw new ConfigurationError('Chain ID or signer is required to create contract');
    }

    // Get SDK RPC provider
    const rpcProvider = getSdkRpcProvider(resolvedChainId);

    // Create contract instance with SDK RPC provider
    return new ethers.Contract(contractAddress, abi, rpcProvider);
}

/**
 * Create a contract instance with SDK RPC provider and connect signer for transactions
 * This pattern is used for operations that need:
 * - SDK RPC for reads/estimations (reliable even if user's RPC fails)
 * - User's signer for transaction signing
 * @param contractAddress - Contract address
 * @param abi - Contract ABI
 * @param signer - Signer instance (used for signing transactions)
 * @param chainId - Optional chain ID (will be resolved from signer if not provided)
 * @returns Object containing:
 *   - contract: Contract instance with SDK RPC (for reads/estimations)
 *   - contractWithSigner: Contract instance connected to signer (for transactions)
 *   - chainId: Resolved chain ID
 */
export async function createContractWithSdkRpcAndSigner(
    contractAddress: string,
    abi: any,
    signer: ethers.Signer,
    chainId?: string | number
): Promise<{
    contract: Contract;
    contractWithSigner: Contract;
    chainId: string;
}> {
    // Resolve chain ID
    const resolvedChainId = await resolveChainId(signer, chainId);

    // Get SDK RPC provider
    const rpcProvider = getSdkRpcProvider(resolvedChainId);

    // Create contract instance with SDK RPC provider (for reads/estimations)
    const contract = new ethers.Contract(contractAddress, abi, rpcProvider);

    // Connect signer to contract (for transactions)
    const contractWithSigner = contract.connect(signer) as Contract;

    return {
        contract,
        contractWithSigner,
        chainId: resolvedChainId,
    };
}

/**
 * Get contract address for a given chain ID
 * @param chainId - Chain ID as string or number
 * @param contractType - Type of contract ('gasRegistry' | 'jobRegistry')
 * @returns Contract address
 * @throws ConfigurationError if contract address is not configured
 */
export function getContractAddress(
    chainId: string | number | undefined,
    contractType: 'gasRegistry' | 'jobRegistry'
): string {
    if (!chainId) {
        throw new ConfigurationError('Chain ID is required to get contract address');
    }

    const addresses = getChainAddresses(chainId);
    const address = contractType === 'gasRegistry' ? addresses.gasRegistry : addresses.jobRegistry;

    if (!address) {
        throw new ConfigurationError(`${contractType} address not configured for chain ID: ${chainId}`);
    }

    return address;
}

