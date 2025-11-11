import { TimeBasedJobInput, TriggerXClient } from '../src';
import { createJob } from '../src/api/jobs';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Initialize the TriggerX client
    const apiKey = 'TGRX-3c6ec268-0cba-431e-bf1f-a16374c39576';
    const client = new TriggerXClient(apiKey);
    
    // Set up your wallet and provider
    const privateKey = process.env.PRIVATE_KEY;
    const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'; // Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey as string, provider);
    
    // Example 1: Single Safe transaction (ETH transfer)
    const singleTxJobInput = {
        jobTitle: 'Safe ETH Transfer',
        timeFrame: 60,
        scheduleType: 'interval',
        timeInterval: 50,
        timezone: 'UTC',
        chainId: '421614',
        walletMode: 'safe',
        safeAddress: '0xEe611960FC1250eE885A487D981876b63373aa16',
        safeTransactions: [
            {
                to: '0xa76Cacba495CafeaBb628491733EB86f1db006dF',
                value: '10000000000000',
                data: '0x'
            }
        ],
        autotopupTG: true,
        argType: 1, // Static
        jobType: 1  // Time
    };

    try {
        const result1 = await createJob(client, { jobInput: singleTxJobInput as TimeBasedJobInput, signer });
        console.log('Single transaction job created:', result1);
    } catch (error) {
        console.error('Error creating single transaction job:', error);
    } finally {
        console.log('Single transaction encoded arguments:', (singleTxJobInput as any).arguments ?? 'arguments not set');
    }

    // Example 2: Batch Safe transactions (Uniswap swap)
    // Construct the Uniswap V3 swap transaction data
    const tokenIn = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';  // USDC (Arbitrum Sepolia)
    const tokenOut = '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73'; // WETH (Arbitrum Sepolia)
    const router = '0x101F443B4d1b059569D643917553c771E1b9663E';  // Uniswap V3 SwapRouter
    const safeAddress = '0xEe611960FC1250eE885A487D981876b63373aa16';
    const amountIn = '10000'; // 0.01 USDC (6 decimals)
    const fee = 3000; // 0.3%
    const minOut = '0'; // Minimum output (set to 0 for this example)

    // Step 1: Encode approve(router, amountIn) for USDC token
    const erc20Interface = new ethers.Interface([
        'function approve(address spender, uint256 amount) returns (bool)'
    ]);
    const approveData = erc20Interface.encodeFunctionData('approve', [router, amountIn]);

    // Step 2: Encode exactInputSingle for Uniswap V3 SwapRouter
    // Using IV3SwapRouter interface (7 parameters, no deadline)
    const swapInterface = new ethers.Interface([
        'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
    ]);
    
    const swapParams = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: fee,
        recipient: safeAddress, // Safe receives the output tokens
        amountIn: amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0 // No price limit
    };
    
    const swapData = swapInterface.encodeFunctionData('exactInputSingle', [swapParams]);

    const batchTxJobInput = {
        jobTitle: 'Safe Uniswap Swap',
        timeFrame: 60,
        scheduleType: 'interval',
        timeInterval: 50,
        timezone: 'UTC',
        chainId: '421614',
        walletMode: 'safe',
        safeAddress: safeAddress,
        safeTransactions: [
            {
                to: tokenIn, // Approve USDC to router
                value: '0',
                data: approveData
            },
            {
                to: router, // Execute swap on Uniswap router
                value: '0', // No ETH value needed for USDC->WETH swap
                data: swapData
            }
        ],
        autotopupTG: true,
        argType: 1, // Static
        jobType: 1  // Time
    };

    try {
        const result2 = await createJob(client, { jobInput: batchTxJobInput as TimeBasedJobInput, signer });
        console.log('Batch transaction job created:', result2);
    } catch (error) {
        console.error('Error creating batch transaction job:', error);
    } finally {
        console.log('Batch transaction encoded arguments:', (batchTxJobInput as any).arguments ?? 'arguments not set');
    }
}

main().catch(console.error);
