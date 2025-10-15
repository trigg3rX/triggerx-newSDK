import { TriggerXClient } from '../src';
import { createSafeWallet } from '../src/api/safeWallet';
import { ethers } from 'ethers';

async function main() {
    // Initialize the TriggerX client
    const apiKey = 'TGRX-3c6ec268-0cba-431e-bf1f-a16374c39576';
    const client = new TriggerXClient(apiKey);
    
    // Set up your wallet and provider
    const privateKey = '';
    const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'; // Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    console.log('Creating Safe wallet...');
    console.log('Signer address:', await signer.getAddress());
    
    try {
        // Create a Safe wallet for the user
        // This will deploy a Safe wallet contract on Arbitrum Sepolia by default
        const safeAddress = await createSafeWallet(signer);
        
        console.log('✅ Safe wallet created successfully!');
        console.log('Safe address:', safeAddress);
        console.log('Network: Arbitrum Sepolia');
        console.log('You can now use this Safe address for job creation and other operations.');
        
    } catch (error) {
        console.error('❌ Failed to create Safe wallet:', error);
    }
}

// Run the example
main().catch(console.error);
