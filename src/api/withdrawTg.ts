import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';

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
    const gasRegistryContractAddress = process.env.GAS_REGISTRY_CONTRACT_ADDRESS as string || '0x85ea3eB894105bD7e7e2A8D34cf66C8E8163CD2a';
    if (!gasRegistryContractAddress) {
        throw new Error('GAS_REGISTRY_CONTRACT_ADDRESS is not set in the environment variables');
    }
    const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, signer);

    // Assumes the contract has a function: claimEthForTg(uint256 amount)
    const amountTGWei = ethers.parseEther(amountTG.toString());
    const tx = await contract.claimETHForTG(amountTGWei);
    await tx.wait();
    return tx;
};
