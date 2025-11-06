import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
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
    
    console.log('Creating a TriggerX job...');
    console.log('Signer address:', await signer.getAddress());
    
    try {
        // Example 1: Safe-mode job creation
        console.log('\n=== Creating Safe-mode Job ===');
        const safeJobInput: CreateJobInput = {
            jobType: JobType.Time,
            argType: ArgType.Dynamic,
            jobTitle: 'safe-time-job-example',
            timeFrame: 70, 
            scheduleType: 'interval',
            timeInterval: 60, 
            timezone: 'UTC',
            chainId: '421614', // Arbitrum Sepolia
            isImua: false,
            dynamicArgumentsScriptUrl: 'https://ipfs.io/ipfs/bafybeib6oh6qmlk5dycaq6stcwi24ukh7dsliqsdqnol5wbkkn4sv5vneq',
            autotopupTG: true,
            safeName:'nipun-safe',
            safeAddress: '0xEe611960FC1250eE885A487D981876b63373aa16',
            walletMode: 'safe',
            language:'go',
        };
        
        const safeJobResult = await createJob(client, {
            jobInput: safeJobInput,
            signer,
        });
        
        console.log('Job result:', safeJobResult);
        // console.log('✅ Safe-mode job created successfully!');
        
        // // Example 2: Regular wallet job creation
        // console.log('\n=== Creating Regular Wallet Job ===');
        // const regularJobInput: CreateJobInput = {
        //     jobType: JobType.Time,
        //     argType: ArgType.Static,
        //     jobTitle: 'regular-time-job-example',
        //     timeFrame: 7200, // 2 hours
        //     scheduleType: 'interval',
        //     timeInterval: 600, // 10 minutes
        //     timezone: 'UTC',
        //     chainId: '421614', // Arbitrum Sepolia
        //     isImua: false,
        //     staticArguments: ['arg1', 'arg2', 'arg3'],
        //     autotopupTG: false,
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