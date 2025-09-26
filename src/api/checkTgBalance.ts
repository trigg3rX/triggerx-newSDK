import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';
import { getChainAddresses } from '../config';

export const checkTgBalance = async (signer: ethers.Signer) => {
    const network = await signer.provider?.getNetwork();
    const chainId = network?.chainId ? network.chainId.toString() : undefined;
    const { gasRegistry } = getChainAddresses(chainId);
    const gasRegistryContractAddress = gasRegistry;
    if (!gasRegistryContractAddress) {
        throw new Error('GasRegistry address not configured for this chain. Update config mapping.');
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
        throw new Error('Unexpected balance format');
    }
    const tgBalance = ethers.formatEther(tgBalanceWei);
    console.log('tgBalanceEth', tgBalance);
    return { tgBalanceWei, tgBalance };
};