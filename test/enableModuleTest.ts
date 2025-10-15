import { TriggerXClient } from '../src';
import { enableSafeModule } from '../src/contracts/safe/SafeWallet';
import { getChainAddresses } from '../src/config';
import { ethers } from 'ethers';

async function main() {
    // Set up your wallet and provider
    const privateKey = '';
    const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'; // Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const safeAddress = '0xe5138B538d4717b89c3DEcCe497EfBd52c17650B'; // New Safe address
    const chainId = '421614';
    const { safeModule } = getChainAddresses(chainId);
    
    console.log('Testing module enabling...');
    console.log('Safe address:', safeAddress);
    console.log('Signer address:', await signer.getAddress());
    console.log('Safe module address:', safeModule);
    
    try {
        await enableSafeModule(safeAddress, signer, safeModule as string);
        console.log('✅ Module enabled successfully!');
    } catch (error) {
        console.error('❌ Error enabling module:', error);
    }
}

main().catch(console.error);
