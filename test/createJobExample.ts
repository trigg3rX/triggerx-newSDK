import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
import { ethers } from 'ethers';

async function main() {

    const apiKey = '';
    const client = new TriggerXClient(apiKey);

    // Example: Time-based static job
    const jobInput: CreateJobInput = {
        jobType: JobType.Time,
        argType: ArgType.Static,
        jobTitle: 'SDK Test Time Job for mainnet',
        timeFrame: 36,
        scheduleType: 'interval',
        timeInterval: 33,
        cronExpression: '0 0 * * *',
        specificSchedule: '2025-01-01 00:00:00',
        timezone: 'Asia/Calcutta',
        chainId: '11155420',
        targetContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
        targetFunction: 'incrementBy',
        abi: '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"previousValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"incrementAmount","type":"uint256"}],"name":"CounterIncremented","type":"event"},{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"incrementBy","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
        isImua: true,
        arguments: ['3'],
        dynamicArgumentsScriptUrl: '',
    };

    // // Example: Condition-based static job
    // const jobInput: CreateJobInput = {
    //     jobType: JobType.Condition,
    //     argType: ArgType.Static,
    //     jobTitle: 'SDK Test Condition Job',
    //     timeFrame: 48,
    //     conditionType: 'greaterThan',
    //     upperLimit: 100,
    //     lowerLimit: 10,
    //     valueSourceType: 'http',
    //     valueSourceUrl: 'https://api.example.com/value',
    //     timezone: 'Asia/Calcutta',
    //     recurring: false,
    //     chainId: '11155420',
    //     targetContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
    //     targetFunction: 'incrementBy',
    //     abi: '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"previousValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"incrementAmount","type":"uint256"}],"name":"CounterIncremented","type":"event"},{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"incrementBy","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    //     isImua: true,
    //     arguments: ['5'],
    //     dynamicArgumentsScriptUrl: '',
    // };

    // // Example: Event-based static job
    // const eventJobInput: CreateJobInput = {
    //     jobType: JobType.Event,
    //     argType: ArgType.Static,
    //     jobTitle: 'SDK Test Event Job',
    //     timeFrame: 25,
    //     triggerChainId: '11155420',
    //     triggerContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
    //     triggerEvent: 'CounterIncremented(uint256,uint256,uint256)',
    //     timezone: 'Asia/Calcutta',
    //     chainId: '11155420',
    //     targetContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
    //     targetFunction: 'incrementBy',
    //     abi: '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"previousValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"incrementAmount","type":"uint256"}],"name":"CounterIncremented","type":"event"},{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"incrementBy","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    // };

    // To test, you can call createJob with this input as well:
    // const conditionResult = await createJob(client, {
    //     jobInput: conditionJobInput,
    //     signer,
    // });
    // console.log('Condition Job creation result:', conditionResult);

    // These would typically come from env/config/user input
    const privateKey = '';
    const providerUrl = '';
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);


    const result = await createJob(client, {
        jobInput,
        signer,
    });
    console.log('Job creation result:', result);
}

main().catch(console.error);
