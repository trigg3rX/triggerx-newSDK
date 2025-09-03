import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';

export const topupTg = async (tgAmount: number, signer: ethers.Signer) => {
    const gasRegistryContractAddress = process.env.GAS_REGISTRY_CONTRACT_ADDRESS as string || '0x204F9278D6BB7714D7A40842423dFd5A27cC1b88';
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
