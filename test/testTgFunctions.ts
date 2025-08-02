import { ethers } from 'ethers';
import { topupTg } from '../src/api/topupTg';
import { checkTgBalance } from '../src/api/checkTgBalance';
import { withdrawTg } from '../src/api/withdrawTg';

async function main() {
    // Replace with your actual provider URL and private key
    const providerUrl = 'https://opt-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';
    const privateKey = ''; // Replace with your private key
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Test the checkTgBalance function
    try {
        const balance = await checkTgBalance(signer);
        console.log('TG Balance:', balance);
    } catch (error) {
        console.error('Error checking TG balance:', error);
    }

    // Test the topupTg function
    const tgAmountToTopup = 1; // Amount of TG to purchase
    try {
        const txTopup = await topupTg(tgAmountToTopup, signer);
        console.log('Topup Transaction:', txTopup);
    } catch (error) {
        console.error('Error during topup:', error);
    }

    // Test the checkTgBalance function
    try {
        const balance = await checkTgBalance(signer);
        console.log('TG Balance:', balance);
    } catch (error) {
        console.error('Error checking TG balance:', error);
    }

    // Test the withdrawTg function
    const tgAmountToWithdraw = '1'; // Amount of TG to withdraw
    try {
        const txWithdraw = await withdrawTg(signer, tgAmountToWithdraw);
        console.log('Withdraw Transaction:', txWithdraw);
    } catch (error) {
        console.error('Error during withdrawal:', error);
    }

     // Test the checkTgBalance function
     try {
        const balance = await checkTgBalance(signer);
        console.log('TG Balance:', balance);
    } catch (error) {
        console.error('Error checking TG balance:', error);
    }
}

main().catch(console.error);
