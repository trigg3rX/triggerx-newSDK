import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { getChainAddresses } from '../config';

export const topupTg = async (tgAmount: number, signer: ethers.Signer) => {
    const network = await signer.provider?.getNetwork();
    const chainId = network?.chainId ? network.chainId.toString() : undefined;
    const { gasRegistry } = getChainAddresses(chainId);
    const gasRegistryContractAddress = gasRegistry;
    const contract = new ethers.Contract(gasRegistryContractAddress, gasRegistryAbi, signer);

    // Each TG costs 0.001 ETH, so calculate the ETH required for the given TG amount
    const amountInEthWei = tgAmount;
    // const amountInEthWei = ethers.parseEther(amountInEth.toString());
    const tx = await contract.purchaseTG(
        amountInEthWei,
        { value: amountInEthWei}
    );
    await tx.wait();
    return tx;
};
