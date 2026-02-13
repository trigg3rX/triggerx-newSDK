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
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in .env');
    }

    // Using Base Sepolia as in the example
    const providerUrl = "https://arb-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W";
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log('Creating a Custom TriggerX job (TaskDefinitionID 7)...');
    console.log('Signer address:', await signer.getAddress());

    try {
        console.log('\n=== Creating Custom Script Job ===');

        // Custom Script Job Input
        const customJobInput: CreateJobInput = {
            jobType: JobType.CustomScript,
            argType: ArgType.Dynamic,
            jobTitle: 'custom-script-job-test',
            timeFrame: 300,
            timeInterval: 37,
            timezone: 'UTC',
            chainId: '421614', // Base Sepolia
            isImua: false,
            // Using a dummy IPFS URL for the script
            dynamicArgumentsScriptUrl: 'https://aqua-tough-swift-909.mypinata.cloud/ipfs/bafkreidvy5nosknw2aqp7dgtdw3cipgxas3fo2ae5q7ttuak5nnoaaluge',
            language: 'ts', // Specifying the language as required for TaskDefinitionID 7
            autotopupETH: true,
            walletMode: 'regular',
            targetContractAddress: ethers.ZeroAddress,
            targetFunction: '',
            abi: '[]',
            recurring: false
        };

        const jobResult = await createJob(client, {
            jobInput: customJobInput,
            signer,
        });

        console.log('Job result:', jobResult);

        if (jobResult.success) {
            if (jobResult.data?.status === 'validation_failed') {
                console.error('❌ Job created but validation failed:', jobResult.data.message);
                console.log('Validation Output:', jobResult.data.validation_output);
            } else {
                console.log('✅ Custom script job created successfully!');
            }
        } else {
            console.error('❌ Failed to create custom script job:', jobResult.error);
            if (jobResult.details?.originalError?.response?.data) {
                console.error('Response Data:', JSON.stringify(jobResult.details.originalError.response.data, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Exception during job creation:', error);
    }
}

// Run the example
main().catch(console.error);