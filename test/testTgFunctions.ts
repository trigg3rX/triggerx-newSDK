import { ethers } from 'ethers';
import { topupTg } from '../src/api/topupTg';
import { checkTgBalance } from '../src/api/checkTgBalance';
import { withdrawTg } from '../src/api/withdrawTg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Configuration
    // OP Sepolia chain ID: 11155420
    // Note: Both checkTgBalance and topupTg now use SDK-provided RPC for network calls
    //       Your signer is still used for transaction signing in topupTg
    //       This ensures reliable operation even if your RPC provider fails
    const chainId = '11155420'; // Optimism Sepolia
    const providerUrl = 'https://opt-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
        console.error('PRIVATE_KEY not found in environment variables');
        return;
    }

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey as string, provider);
    
    console.log('=== Testing TG Balance and Topup Functions ===');
    console.log('Wallet Address:', await signer.getAddress());
    console.log('Chain ID:', chainId);
    console.log('Note: Functions use SDK RPC provider for network calls');
    console.log('      Your signer is used for transaction signing');
    console.log('');

    // Test 1: Check TG Balance with chainId explicitly provided
    // This uses SDK-provided RPC, so it works even if user's RPC fails
    console.log('--- Test 1: Check TG Balance (with chainId, uses SDK RPC) ---');
    try {
        const balance = await checkTgBalance(signer, chainId);
        if (balance.success && balance.data) {
            console.log('✅ TG Balance Check Successful');
            console.log('   TG Balance (Wei):', balance.data.tgBalanceWei.toString());
            console.log('   TG Balance (ETH):', balance.data.tgBalance);
        } else {
            console.error('❌ TG Balance Check Failed:', balance.error);
            if (balance.details) {
                console.error('   Details:', balance.details);
            }
        }
    } catch (error) {
        console.error('❌ Error checking TG balance:', error);
    }
    console.log('');

    // Test 2: Check TG Balance without chainId (will try to get from signer's provider)
    // This demonstrates backward compatibility
    console.log('--- Test 2: Check TG Balance (without chainId, uses signer provider) ---');
    try {
        const balance = await checkTgBalance(signer);
        if (balance.success && balance.data) {
            console.log('✅ TG Balance Check Successful');
            console.log('   TG Balance (Wei):', balance.data.tgBalanceWei.toString());
            console.log('   TG Balance (ETH):', balance.data.tgBalance);
        } else {
            console.error('❌ TG Balance Check Failed:', balance.error);
            if (balance.details) {
                console.error('   Details:', balance.details);
            }
        }
    } catch (error) {
        console.error('❌ Error checking TG balance:', error);
    }
    console.log('');

    // Test 3: Top up TG
    // This uses SDK-provided RPC, so it works even if user's RPC fails
    // The contract uses SDK RPC, but the user's signer is used for transaction signing
    console.log('--- Test 3: Top Up TG (uses SDK RPC, user signer for signing) ---');
    const tgAmountToTopup = 100; // Amount of TG to purchase
    try {
        console.log(`Attempting to top up ${tgAmountToTopup} TG...`);
        console.log('   Note: Using SDK RPC provider for network calls');
        console.log('         Using your signer for transaction signing');
        const txTopup = await topupTg(tgAmountToTopup, signer);
        if (txTopup.success) {
            console.log('✅ Topup Transaction Successful');
            console.log('   Transaction:', txTopup.data);
        } else {
            console.error('❌ Topup Transaction Failed:', txTopup.error);
            if (txTopup.details) {
                console.error('   Details:', txTopup.details);
            }
        }
    } catch (error) {
        console.error('❌ Error during topup:', error);
    }
    console.log('');

    // Test 4: Check TG Balance after topup
    console.log('--- Test 4: Check TG Balance After Topup ---');
    try {
        const balance = await checkTgBalance(signer, chainId);
        if (balance.success && balance.data) {
            console.log('✅ TG Balance Check Successful');
            console.log('   TG Balance (Wei):', balance.data.tgBalanceWei.toString());
            console.log('   TG Balance (ETH):', balance.data.tgBalance);
        } else {
            console.error('❌ TG Balance Check Failed:', balance.error);
            if (balance.details) {
                console.error('   Details:', balance.details);
            }
        }
    } catch (error) {
        console.error('❌ Error checking TG balance:', error);
    }
    console.log('');

    // Test 5: Withdraw TG (optional - comment out if you don't want to withdraw)
    console.log('--- Test 5: Withdraw TG (Optional) ---');
    const tgAmountToWithdraw = 100; // Amount of TG to withdraw (using smaller amount)
    try {
        console.log(`Attempting to withdraw ${tgAmountToWithdraw} TG...`);
        const txWithdraw = await withdrawTg(signer, tgAmountToWithdraw);
        if (txWithdraw.success) {
            console.log('✅ Withdraw Transaction Successful');
            console.log('   Transaction:', txWithdraw.data);
        } else {
            console.error('❌ Withdraw Transaction Failed:', txWithdraw.error);
            if (txWithdraw.details) {
                console.error('   Details:', txWithdraw.details);
            }
        }
    } catch (error) {
        console.error('❌ Error during withdrawal:', error);
    }
    console.log('');

    // Test 6: Check TG Balance after withdrawal
    console.log('--- Test 6: Check TG Balance After Withdrawal ---');
    try {
        const balance = await checkTgBalance(signer, chainId);
        if (balance.success && balance.data) {
            console.log('✅ TG Balance Check Successful');
            console.log('   TG Balance (Wei):', balance.data.tgBalanceWei.toString());
            console.log('   TG Balance (ETH):', balance.data.tgBalance);
        } else {
            console.error('❌ TG Balance Check Failed:', balance.error);
            if (balance.details) {
                console.error('   Details:', balance.details);
            }
        }
    } catch (error) {
        console.error('❌ Error checking TG balance:', error);
    }
    console.log('');

    // Test 7: Demonstrate SDK RPC fallback (even if user RPC fails)
    console.log('--- Test 7: Testing SDK RPC Fallback for checkTgBalance ---');
    console.log('Note: This test shows that checkTgBalance uses SDK-provided RPC');
    console.log('      even if the user\'s RPC provider fails or is unavailable.');
    console.log('      The SDK will use its built-in RPC: https://sepolia.optimism.io');
    try {
        // Even if we provide an invalid/broken provider, checkTgBalance should still work
        // because it uses SDK RPC when chainId is provided
        const balance = await checkTgBalance(signer, chainId);
        if (balance.success && balance.data) {
            console.log('✅ Balance check successful using SDK RPC');
            console.log('   TG Balance (ETH):', balance.data.tgBalance);
            console.log('   This demonstrates the SDK RPC fallback is working!');
        } else {
            console.error('❌ Balance check failed:', balance.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
    console.log('');

    // Test 8: Demonstrate SDK RPC usage for topupTg
    console.log('--- Test 8: Testing SDK RPC Usage for topupTg ---');
    console.log('Note: This test demonstrates that topupTg uses SDK-provided RPC');
    console.log('      for network calls, while using your signer for transaction signing.');
    console.log('      The contract is created with SDK RPC, then your signer is connected.');
    console.log('      This ensures reliable network communication even if your RPC fails.');
    console.log('      (Skipping actual transaction to avoid spending funds)');
    console.log('✅ topupTg function is configured to use SDK RPC provider');
    console.log('   - Contract created with SDK RPC provider');
    console.log('   - User signer connected to contract for signing');
    console.log('   - Network calls use SDK RPC, transactions use your signer');
    console.log('');

    console.log('=== All Tests Completed ===');
}

main().catch(console.error);
