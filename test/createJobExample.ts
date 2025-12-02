import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    // Initialize the TriggerX client
    const apiKey = 'TGRX-3c6ec268-0cba-431e-bf1f-a16374c39576';
    const client = new TriggerXClient(apiKey);

    // Set up your wallet and provider
    const privateKey = process.env.PRIVATE_KEY;
    const providerUrl = 'https://opt-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';

    // const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'; // Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey as string, provider);

    console.log('Creating a TriggerX job...');
    console.log('Signer address:', await signer.getAddress());

    try {
        // Example 1: Safe-mode job creation
        console.log('\n=== Creating Safe-mode Job ===');
        const safeJobInput: CreateJobInput = {
            jobType: JobType.Time,
            argType: ArgType.Dynamic,
            jobTitle: 'safe-time-job-example',
            timeFrame: 3600, 
            scheduleType: 'interval',
            timeInterval: 900, 
            timezone: 'UTC',
            chainId: '11155420', // Arbitrum Sepolia
            isImua: false,
            targetContractAddress: '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
            targetFunction: 'execJobFromHub',
            abi: JSON.stringify([
                {
                  "inputs": [
                    { "internalType": "address", "name": "safeAddress", "type": "address" },
                    { "internalType": "address", "name": "actionTarget", "type": "address" },
                    { "internalType": "uint256", "name": "actionValue", "type": "uint256" },
                    { "internalType": "bytes", "name": "actionData", "type": "bytes" },
                    { "internalType": "uint8", "name": "operation", "type": "uint8" }
                  ],
                  "name": "execJobFromHub",
                  "outputs": [
                    { "internalType": "bool", "name": "success", "type": "bool" }
                  ],
                  "stateMutability": "nonpayable",
                  "type": "function"
                }
              ]),
            dynamicArgumentsScriptUrl: 'https://ipfs.io/ipfs/bafkreihqng7dovxgqah4a5rhoh2oaeg7ilzwfgbm3m7mvdkf7vxignv2u4',
            autotopupETH: true,
            // safeName:'nipun-safe',
            // safeAddress: '0xEe611960FC1250eE885A487D981876b63373aa16',
            walletMode: 'regular',
            language:'go',
        };

        const safeJobResult = await createJob(client, {
            jobInput: safeJobInput,
            signer,
        });

        console.log('Job result:', safeJobResult);
        console.log('✅ Safe-mode job created successfully!');

        // // Example 2: Regular wallet job creation
        // console.log('\n=== Creating Regular Wallet Job ===');
        // const regularJobInput: CreateJobInput = {
        //     jobType: JobType.Time,
        //     argType: ArgType.Static,
        //     jobTitle: 'regular-time-job-example',
        //     timeFrame: 40, // 2 hours
        //     scheduleType: 'interval',
        //     timeInterval: 30, // 10 minutes
        //     timezone: 'UTC',
        //     chainId: '11155420', // Arbitrum Sepolia
        //     isImua: false,
        //     targetContractAddress: '0xa0bC1477cfc452C05786262c377DE51FB8bc4669',
        //     targetFunction: 'execJobFromHub',
        //     abi: JSON.stringify([
        //         {
        //           "inputs": [
        //             { "internalType": "address", "name": "safeAddress", "type": "address" },
        //             { "internalType": "address", "name": "actionTarget", "type": "address" },
        //             { "internalType": "uint256", "name": "actionValue", "type": "uint256" },
        //             { "internalType": "bytes", "name": "actionData", "type": "bytes" },
        //             { "internalType": "uint8", "name": "operation", "type": "uint8" }
        //           ],
        //           "name": "execJobFromHub",
        //           "outputs": [
        //             { "internalType": "bool", "name": "success", "type": "bool" }
        //           ],
        //           "stateMutability": "nonpayable",
        //           "type": "function"
        //         }
        //       ]),
        //     arguments: [
        //         "0xEe611960FC1250eE885A487D981876b63373aa16",
        //         "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
        //         "0",
        //         "0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001d20075faf114eafb1bdbe2f0316df893fd58ce46aa4d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000101f443b4d1b059569d643917553c771e1b9663e000000000000000000000000000000000000000000000000000000000000271000101f443b4d1b059569d643917553c771e1b9663e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf00000000000000000000000075faf114eafb1bdbe2f0316df893fd58ce46aa4d000000000000000000000000980b62da83eff3d4576c647993b0c1d7faf17c730000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000ee611960fc1250ee885a487d981876b63373aa160000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        //         "1"
        //     ],
        //     autotopupETH: true,
        //     walletMode: 'regular',
        // };

        // const regularJobResult = await createJob(client, {
        //     jobInput: regularJobInput,
        //     signer,
        // });

        // console.log('✅ Regular wallet job created successfully!');
        // console.log('Job result:', regularJobResult);

        console.log('\n🎉 All jobs created successfully!');
        console.log('Note: Make sure you have sufficient TG balance for job execution.');

    } catch (error) {
        console.error('❌ Failed to create job:', error);
    }
}

// Run the example
main().catch(console.error);