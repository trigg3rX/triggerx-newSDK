import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file in the current directory or parent
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    // Initialize the TriggerX client
    const apiKey = 'TGRX-3c6ec268-0cba-431e-bf1f-a16374c39576';
    const client = new TriggerXClient(apiKey);

    // Set up your wallet and provider
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const providerUrl = 'https://base-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log('Starting creation of 15 event-based jobs...');
    console.log('Signer address:', await signer.getAddress());

    const wethAddress = '0x4200000000000000000000000000000000000006';
    const targetAddress = '0xa0bC1477cfc452C05786262c377DE51FB8bc4669';

    // ABI for the target contract's execJobFromHub function
    const targetAbi = JSON.stringify([
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
    ]);

    // Full ABI to include the Deposit event definition as required by the TriggerX SDK validation
    const fullAbi = JSON.stringify([
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "dst", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "wad", "type": "uint256" }], "name": "Deposit", "type": "event" },
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
    ]);

    for (let i = 1; i <= 1; i++) {
        console.log(`\n=== Creating Event-Based Job ${i}/15 ===`);
        const jobInput: CreateJobInput = {
            jobType: JobType.Event,
            argType: ArgType.Dynamic,
            jobTitle: `weth-deposit-tracker-${i}`,
            timeFrame: 400,
            triggerChainId: '84532', // Base Sepolia
            triggerContractAddress: wethAddress,
            triggerEvent: 'Deposit(address,uint256)',
            
            timezone: 'UTC',
            chainId: '84532', // Base Sepolia
            targetContractAddress: targetAddress,
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
            dynamicArgumentsScriptUrl: 'https://ipfs.io/ipfs/bafkreidpwqyuev5vzpodttc4kt5tl6gk6ycjztacsya45ilhvx26s4ysgq',
            autotopupETH: true,
            walletMode: 'regular',
            language: 'go',
        };

        try {
            const result = await createJob(client, {
                jobInput,
                signer,
            });

            if (result.success) {
                console.log(`✅ Job ${i} created successfully!`);
                console.log('Result:', JSON.stringify(result.data, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            } else {
                console.error(`❌ Job ${i} creation failed:`, result.error);
                console.error('Error Code:', result.errorCode);
                console.error('Details:', JSON.stringify(result.details, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            }
        } catch (error) {
            console.error(`❌ Unexpected error creating job ${i}:`, error);
        }

        // Brief delay between creations to ensure nonce updates properly or avoid rate limits if any
        // if (i < 15) {
        //     await new Promise(resolve => setTimeout(resolve, 2000));
        // }
    }

    console.log('\nProcessing complete.');
}

main().catch(console.error);
