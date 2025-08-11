import { ethers } from 'ethers';
import gasRegistryAbi from '../contracts/abi/GasRegistry.json';

export const checkTgBalance = async (signer: ethers.Signer) => {
    const gasRegistryContractAddress = process.env.GAS_REGISTRY_CONTRACT_ADDRESS as string || '0x85ea3eB894105bD7e7e2A8D34cf66C8E8163CD2a';
    if (!gasRegistryContractAddress) {
        throw new Error('GAS_REGISTRY_CONTRACT_ADDRESS is not set in the environment variables');
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