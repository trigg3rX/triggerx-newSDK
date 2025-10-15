import { TriggerXClient } from '../src';
import { isSafeModuleEnabled, ensureSingleOwnerAndMatchSigner } from '../src/contracts/safe/SafeWallet';
import { getChainAddresses } from '../src/config';
import { ethers } from 'ethers';

async function main() {
    // Set up your wallet and provider
    const privateKey = '';
    const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'; // Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const safeAddress = '0xEe611960FC1250eE885A487D981876b63373aa16';
    const chainId = '421614';
    const { safeModule } = getChainAddresses(chainId);
    
    console.log('Checking Safe wallet status...');
    console.log('Safe address:', safeAddress);
    console.log('Signer address:', await signer.getAddress());
    console.log('Safe module address:', safeModule);
    
    try {
        // Check if module is enabled
        if (!safeModule) {
            throw new Error('safeModule address is undefined or missing from chain config.');
        }
        const isEnabled = await isSafeModuleEnabled(safeAddress, provider, safeModule as string);
        console.log('Module enabled:', isEnabled);

        // Check Safe ownership
        await ensureSingleOwnerAndMatchSigner(safeAddress, provider, await signer.getAddress());
        console.log('✅ Safe ownership validation passed');
        
    } catch (error) {
        console.error('❌ Error checking Safe status:', error);
    }
}

main().catch(console.error);
