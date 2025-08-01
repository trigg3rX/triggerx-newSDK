import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
import { ethers } from 'ethers';

async function main() {

    const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8';
    const client = new TriggerXClient(apiKey);

    // // Example: Time-based static job
    // const jobInput: CreateJobInput = {
    //     jobType: JobType.Time,
    //     argType: ArgType.Static,
    //     userAddress: '0x7Db951c0E6D8906687B459427eA3F3F2b456473B',
    //     etherBalance: 50000000000000000,
    //     tokenBalance: 50000000000000000000,
    //     jobTitle: 'SDK Test Time Job',
    //     timeFrame: 36,
    //     scheduleType: 'interval',
    //     timeInterval: 33,
    //     cronExpression: '0 0 * * *',
    //     specificSchedule: '2025-01-01 00:00:00',
    //     timezone: 'Asia/Calcutta',
    //     recurring: false,
    //     jobCostPrediction: 0.1,
    //     createdChainId: '11155420',
    //     targetChainId: '11155420',
    //     targetContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
    //     targetFunction: 'incrementBy',
    //     abi: '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"previousValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"incrementAmount","type":"uint256"}],"name":"CounterIncremented","type":"event"},{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"incrementBy","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    //     isImua: true,
    //     arguments: ['3'],
    //     dynamicArgumentsScriptUrl: '',
    // };

    // Example: Condition-based static job
    const jobInput: CreateJobInput = {
        jobType: JobType.Condition,
        argType: ArgType.Static,
        userAddress: '0x7Db951c0E6D8906687B459427eA3F3F2b456473B',
        etherBalance: 50000000000000000,
        tokenBalance: 50000000000000000000,
        jobTitle: 'SDK Test Condition Job',
        timeFrame: 48,
        conditionType: 'greaterThan',
        upperLimit: 100,
        lowerLimit: 10,
        valueSourceType: 'http',
        valueSourceUrl: 'https://api.example.com/value',
        timezone: 'Asia/Calcutta',
        recurring: false,
        jobCostPrediction: 0.1,
        createdChainId: '11155420',
        targetChainId: '11155420',
        targetContractAddress: '0x49a81A591afdDEF973e6e49aaEa7d76943ef234C',
        targetFunction: 'incrementBy',
        abi: '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"previousValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"incrementAmount","type":"uint256"}],"name":"CounterIncremented","type":"event"},{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"incrementBy","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
        isImua: true,
        arguments: ['5'],
        dynamicArgumentsScriptUrl: '',
    };

    // To test, you can call createJob with this input as well:
    // const conditionResult = await createJob(client, {
    //     jobInput: conditionJobInput,
    //     signer,
    // });
    // console.log('Condition Job creation result:', conditionResult);

    // These would typically come from env/config/user input
    const privateKey = '';
    const providerUrl = 'https://opt-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);


    const result = await createJob(client, {
        jobInput,
        signer,
    });
    console.log('Job creation result:', result);
}

main().catch(console.error);
