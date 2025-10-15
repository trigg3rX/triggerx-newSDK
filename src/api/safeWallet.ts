import { Signer } from 'ethers';
import { getChainAddresses } from '../config';
import { createSafeWalletForUser } from '../contracts/safe/SafeFactory';
import { enableSafeModule } from '../contracts/safe/SafeWallet';


/**
 * Creates a new Safe wallet for the user on the signer's network.
 * @param signer ethers.Signer (must be connected to the correct network)
 * @returns Promise<string> - the new Safe wallet address
 * @throws If cannot resolve SafeFactory address from config, or provider/chain/network errors.
 */
export async function createSafeWallet(
    signer: Signer
): Promise<string> {
    if (!signer.provider) throw new Error('Signer must have a provider');
    const network = await signer.provider.getNetwork();
    if (!network?.chainId) throw new Error('Could not get chainId from signer provider');
    const chainId = network.chainId.toString();
    const { safeFactory } = getChainAddresses(chainId);
    if (!safeFactory) throw new Error(`SafeFactory not configured for chain ${chainId}`);
    const userAddr = await signer.getAddress();
    const safeAddress = await createSafeWalletForUser(safeFactory, signer, userAddr);
    const { safeModule } = getChainAddresses(chainId);
    if (!safeModule) {
        throw new Error(`SafeModule not configured for chain ${chainId}`);
    }
    await enableSafeModule(
        safeAddress,
        signer,
        safeModule
    );
    return safeAddress;
}
