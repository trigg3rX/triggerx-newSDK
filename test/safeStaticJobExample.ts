import { ethers } from 'ethers';
import { TriggerXClient } from '../src/client';
import { createJob, JobType, ArgType } from '../src/api/jobs';

// Example: Creating a Safe wallet job with static parameters

async function createSafeStaticJobExample() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
  const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
  
  // Initialize TriggerX client
  const client = new TriggerXClient({
    apiKey: 'YOUR_API_KEY',
    apiUrl: 'YOUR_API_URL'
  });

  // Example 1: Single transaction (ETH transfer)
  const singleTxJobInput = {
    jobType: JobType.Time,
    argType: ArgType.Static,
    
    jobTitle: 'Safe ETH Transfer',
    timeFrame: 3600,
    scheduleType: 'interval' as const,
    timeInterval: 300,
    timezone: 'UTC',
    chainId: '421614', // Arbitrum Sepolia
    
    walletMode: 'safe' as const,
    safeAddress: '0x87EB883e8ae00120EF2c6Fd49b1F8A149E2172f4',
    
    // Single transaction
    safeTransactions: [
      {
        to: '0xa76Cacba495CafeaBb628491733EB86f1db006dF',
        value: '10000000000000', // 0.00001 ETH in wei
        data: '0x', // empty data for plain ETH transfer
        operation: 0 // CALL
      }
    ],
    
    autotopupTG: true,
  };

  try {
    const result1 = await createJob(client, { jobInput: singleTxJobInput, signer });
    console.log('Single transaction job created:', result1);
  } catch (error) {
    console.error('Error creating single transaction job:', error);
  }

  // Example 2: Batch transactions (Uniswap swap)
  const batchTxJobInput = {
    jobType: JobType.Time,
    argType: ArgType.Static,
    
    jobTitle: 'Safe Uniswap Swap',
    timeFrame: 3600,
    scheduleType: 'interval' as const,
    timeInterval: 600,
    timezone: 'UTC',
    chainId: '421614', // Arbitrum Sepolia
    
    walletMode: 'safe' as const,
    safeAddress: '0xEe2857958D715A263fD478D8b8B0DfAD40EcA9Ba',
    
    // Multiple transactions (will use multisend)
    safeTransactions: [
      {
        to: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', // WETH
        value: '0',
        data: '0x095ea7b3000000000000000000000000101f443b4d1b059569d643917553c771e1b9663e000000000000000000000000000000000000000000000000000000e8d4a51000', // approve(router, 1000000000000000)
        operation: 0 // CALL
      },
      {
        to: '0x101F443B4d1b059569D643917553c771E1b9663E', // Uniswap V3 Router
        value: '1000000000000000', // 0.001 ETH
        data: '0x04e45aaf...', // exactInputSingle encoded data
        operation: 0 // CALL
      }
    ],
    
    autotopupTG: true,
  };

  try {
    const result2 = await createJob(client, { jobInput: batchTxJobInput, signer });
    console.log('Batch transaction job created:', result2);
  } catch (error) {
    console.error('Error creating batch transaction job:', error);
  }

  // Example 3: Dynamic Safe job (existing behavior still works)
  const dynamicJobInput = {
    jobType: JobType.Time,
    argType: ArgType.Dynamic,
    
    jobTitle: 'Dynamic Safe Job',
    timeFrame: 3600,
    scheduleType: 'interval' as const,
    timeInterval: 300,
    timezone: 'UTC',
    chainId: '421614',
    
    walletMode: 'safe' as const,
    safeAddress: '0x87EB883e8ae00120EF2c6Fd49b1F8A149E2172f4',
    
    // Dynamic parameters from IPFS
    dynamicArgumentsScriptUrl: 'https://your-ipfs-gateway/ipfs/your-hash',
    
    autotopupTG: true,
  };

  try {
    const result3 = await createJob(client, { jobInput: dynamicJobInput, signer });
    console.log('Dynamic safe job created:', result3);
  } catch (error) {
    console.error('Error creating dynamic safe job:', error);
  }
}

// Run the example
createSafeStaticJobExample().catch(console.error);

