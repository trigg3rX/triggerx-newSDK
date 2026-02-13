import { TriggerXClient, createJob } from '../src';
import { JobType, ArgType, CreateJobInput } from '../src/types';
import { ethers } from 'ethers';
import { depositEth } from '../src/api/topup';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const apiKey = 'TGRX-3c6ec268-0cba-431e-bf1f-a16374c39576';
    const client = new TriggerXClient(apiKey);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not found');

    const providerUrl = 'https://base-sepolia.g.alchemy.com/v2/m7cIDXzatSUYoiuE1xSY_TnUrK5j9-1W';
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const userAddress = await signer.getAddress();

    console.log('Instant creation of 15 event-based jobs...');
    console.log('Signer address:', userAddress);

    const wethAddress = '0x4200000000000000000000000000000000000006';
    const targetAddress = '0xa0bC1477cfc452C05786262c377DE51FB8bc4669';

    const fullAbi = JSON.stringify([
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "dst", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "wad", "type": "uint256" }], "name": "Deposit", "type": "event" },
        {
            "inputs": [
                { "name": "safeAddress", "type": "address" },
                { "name": "actionTarget", "type": "address" },
                { "name": "actionValue", "type": "uint256" },
                { "name": "actionData", "type": "bytes" },
                { "name": "operation", "type": "uint8" }
            ],
            "name": "execJobFromHub",
            "outputs": [{ "name": "success", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]);

    // 1. Initial Deposit to cover all jobs (speeds up the process greatly)
    const totalToDeposit = ethers.parseEther('0.05'); // Sufficient for 15+ jobs
    console.log(`Depositing ${ethers.formatEther(totalToDeposit)} ETH for all jobs...`);

    const topupResult = await depositEth(totalToDeposit, signer);
    if (!topupResult.success) {
        console.warn('Initial topup may have failed or was unnecessary:', topupResult.error);
    } else {
        console.log('✅ Topup successful!');
    }

    // 2. Parallel Manual Nonce Management
    let currentNonce = await provider.getTransactionCount(userAddress);

    // Nonce-aware Signer Proxy
    const safeSigner = new Proxy(signer, {
        get(target, prop, receiver) {
            if (prop === 'sendTransaction') {
                return async (transaction: any) => {
                    const txNonce = currentNonce++;
                    console.log(`[Transaction] Sending with nonce: ${txNonce}`);
                    return target.sendTransaction({ ...transaction, nonce: txNonce });
                };
            }
            return Reflect.get(target, prop, receiver);
        }
    });

    // 3. Fire all 15 creation requests in parallel
    console.log('\nDeploying 15 jobs to TriggerX...');
    const jobPromises = Array.from({ length: 15 }, (_, i) => {
        const id = i + 1;
        const jobInput: CreateJobInput = {
            jobType: JobType.Event,
            argType: ArgType.Dynamic,
            jobTitle: `weth-deposit-tracker-${id}`,
            timeFrame: 400,
            triggerChainId: '84532',
            triggerContractAddress: wethAddress,
            triggerEvent: 'Deposit(address,uint256)',
            timezone: 'UTC',
            chainId: '84532',
            targetContractAddress: targetAddress,
            targetFunction: 'execJobFromHub',
            abi: fullAbi,
            dynamicArgumentsScriptUrl: 'https://ipfs.io/ipfs/bafkreidpwqyuev5vzpodttc4kt5tl6gk6ycjztacsya45ilhvx26s4ysgq',
            autotopupETH: true, // Should skip actual deposit as we just did it
            walletMode: 'regular',
            language: 'go',
        };

        return createJob(client, {
            jobInput,
            signer: safeSigner as any,
        }).then(result => {
            if (result.success) {
                console.log(`✅ [Job ${id}] Created successfully!`);
            } else {
                console.error(`❌ [Job ${id}] Failed:`, result.error);
            }
            return result;
        }).catch(err => {
            console.error(`❌ [Job ${id}] Error:`, err.message);
            return { success: false, error: err.message };
        });
    });

    const results = await Promise.all(jobPromises);
    const successCount = results.filter(r => r.success).length;
    console.log(`\nDeployment Complete: ${successCount}/15 jobs created.`);
}

main().catch(console.error);
