import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';

export const topupTg = async (tgAmount: number, signer: ethers.Signer) => {
    const gasRegistryContractAddress = process.env.GAS_REGISTRY_CONTRACT_ADDRESS as string || '0x85ea3eB894105bD7e7e2A8D34cf66C8E8163CD2a';
    const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, signer);

    // Each TG costs 0.001 ETH, so calculate the ETH required for the given TG amount
    const amountInEth = tgAmount * 0.001;
    const amountInEthWei = ethers.parseEther(amountInEth.toString());
    const tx = await contract.purchaseTG(
        amountInEthWei,
        { value: amountInEthWei }
    );
    await tx.wait();
    return tx;
};
