import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { getChainAddresses } from '../config';

/**
 * Withdraw ETH in exchange for TG tokens.
 * @param signer ethers.Signer instance
 * @param amountTG The amount of TG tokens to withdraw (as a string or BigNumberish)
 * @returns The transaction object
 */
export const withdrawTg = async (
    signer: ethers.Signer,
    amountTG: string | ethers.BigNumberish
) => {
    const network = await signer.provider?.getNetwork();
    const chainId = network?.chainId ? network.chainId.toString() : undefined;
    const { gasRegistry } = getChainAddresses(chainId);
    const gasRegistryContractAddress = gasRegistry;
    if (!gasRegistryContractAddress) {
        throw new Error('GasRegistry address not configured for this chain. Update config mapping.');
    }
    const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, signer);

    // Assumes the contract has a function: claimEthForTg(uint256 amount)
    const amountTGWei = ethers.parseEther(amountTG.toString());
    const tx = await contract.claimETHForTG(amountTGWei);
    await tx.wait();
    return tx;
};
