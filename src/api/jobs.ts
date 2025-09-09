import { TriggerXClient } from '../client';
import {
  TimeBasedJobInput,
  EventBasedJobInput,
  ConditionBasedJobInput,
  CreateJobData,
  JobResponse,
} from '../types';
import { createJobOnChain } from '../contracts/JobRegistry';
import { ethers, Signer } from 'ethers';
import jobRegistryAbi from '../contracts/abi/JobRegistry.json';
import { topupTg } from './topupTg';
import { checkTgBalance } from './checkTgBalance';
const JOB_ID = '300949528249665590178224313442040528409305273634097553067152835846309150732';
const DYNAMIC_ARGS_URL = 'https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreif426p7t7takzhw3g6we2h6wsvf27p5jxj3gaiynqf22p3jvhx4la';
const JOB_REGISTRY_ADDRESS = '0x476ACc7949a95e31144cC84b8F6BC7abF0967E4b'; // Set your fixed contract address here

export function toCreateJobDataFromTime(
  input: TimeBasedJobInput,
  balances: { etherBalance: bigint; tokenBalanceWei: bigint },
  userAddress: string,
  jobCostPrediction: number,
): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: userAddress,
    ether_balance: balances.etherBalance,
    token_balance: balances.tokenBalanceWei,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 2 : 1,
    custom: true,
    time_frame: input.timeFrame,
    recurring: false,
    job_cost_prediction: jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.chainId,
    schedule_type: input.scheduleType,
    time_interval: input.scheduleType === 'interval' ? input.timeInterval : undefined,
    cron_expression: input.scheduleType === 'cron' ? input.cronExpression : undefined,
    specific_schedule: input.scheduleType === 'specific' ? input.specificSchedule : undefined,
    target_chain_id: input.chainId,
    target_contract_address: input.targetContractAddress,
    target_function: input.targetFunction,
    abi: input.abi,
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
  };
}

export function toCreateJobDataFromEvent(
  input: EventBasedJobInput,
  balances: { etherBalance: bigint; tokenBalanceWei: bigint },
  userAddress: string,
  jobCostPrediction: number,
): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: userAddress,
    ether_balance: balances.etherBalance,
    token_balance: balances.tokenBalanceWei,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 4 : 3,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.chainId,
    trigger_chain_id: (input as any).triggerChainId ?? input.chainId,
    trigger_contract_address: input.triggerContractAddress,
    trigger_event: input.triggerEvent,
    target_chain_id: input.chainId,
    target_contract_address: input.targetContractAddress,
    target_function: input.targetFunction,
    abi: input.abi,
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
  };
}

export function toCreateJobDataFromCondition(
  input: ConditionBasedJobInput,
  balances: { etherBalance: bigint; tokenBalanceWei: bigint },
  userAddress: string,
  jobCostPrediction: number,
): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: userAddress,
    ether_balance: balances.etherBalance,
    token_balance: balances.tokenBalanceWei,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 6 : 5,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.chainId,
    condition_type: input.conditionType,
    upper_limit: input.upperLimit,
    lower_limit: input.lowerLimit,
    value_source_type: input.valueSourceType,
    value_source_url: input.valueSourceUrl,
    target_chain_id: input.chainId,
    target_contract_address: input.targetContractAddress,
    target_function: input.targetFunction,
    abi: input.abi,
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
  };
}

// --- Encoding helpers for different job types ---
function encodeJobType1Data(timeInterval: number) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint256'],
    [timeInterval]
  );
}

function encodeJobType2Data(timeInterval: number, ipfsHash: string) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint256', 'bytes32'],
    [timeInterval, ipfsHash]
  );
}

function encodeJobType3or5Data(recurringJob: boolean) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['bool'],
    [recurringJob]
  );
}

function encodeJobType4or6Data(recurringJob: boolean, ipfsHash: string) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['bool', 'bytes32'],
    [recurringJob, ipfsHash]
  );
}

export interface CreateJobParams {
  jobInput: TimeBasedJobInput | EventBasedJobInput | ConditionBasedJobInput;
  signer: Signer;
  encodedData?: string;
}

/**
 * Create a job on the blockchain.
 * @param client TriggerXClient instance
 * @param params Parameters for creating the job
 * @returns JobResponse containing the result of the job creation
 */
export async function createJob(
  client: TriggerXClient,
  params: CreateJobParams
): Promise<JobResponse> {
  let { jobInput, signer, encodedData } = params;

  // Use the API key from the client instance
  const apiKey = client.getApiKey();

  const userAddress = await signer.getAddress();

  let jobTitle: string, timeFrame: number, targetContractAddress: string, jobType: number;
  if ('jobTitle' in jobInput) jobTitle = jobInput.jobTitle;
  if ('timeFrame' in jobInput) timeFrame = jobInput.timeFrame;
  if ('targetContractAddress' in jobInput) targetContractAddress = jobInput.targetContractAddress;

  // Validate schedule-specific fields for time-based jobs
  if ('scheduleType' in jobInput) {
    if (jobInput.scheduleType === 'interval' && (jobInput.timeInterval === undefined || jobInput.timeInterval === null)) {
      throw new Error('timeInterval is required when scheduleType is interval');
    }
    if (jobInput.scheduleType === 'cron' && !jobInput.cronExpression) {
      throw new Error('cronExpression is required when scheduleType is cron');
    }
    if (jobInput.scheduleType === 'specific' && !jobInput.specificSchedule) {
      throw new Error('specificSchedule is required when scheduleType is specific');
    }
  }

  // Infer jobType from jobInput
  if ('scheduleType' in jobInput) {
    jobType = jobInput.dynamicArgumentsScriptUrl ? 2 : 1; // Time-based job
  } else if ('triggerChainId' in jobInput) {
    jobType = jobInput.dynamicArgumentsScriptUrl ? 4 : 3; // Event-based job
  } else {
    jobType = jobInput.dynamicArgumentsScriptUrl ? 6 : 5; // Condition-based job
  }

  // --- Generate encodedData if not provided ---
  if (!encodedData) {
    // Time-based jobs
    if ('scheduleType' in jobInput) {
      if (jobType === 1) {
        encodedData = encodeJobType1Data(jobInput.timeInterval ?? 0);
      } else if (jobType === 2) {
        encodedData = encodeJobType2Data(jobInput.timeInterval ?? 0, jobInput.dynamicArgumentsScriptUrl || '');
      }
    }
    // Event-based jobs
    else if ('triggerChainId' in jobInput) {
      if (jobType === 3 || jobType === 5) {
        encodedData = encodeJobType3or5Data(jobInput.recurring ?? false);
      } else if (jobType === 4 || jobType === 6) {
        encodedData = encodeJobType4or6Data(jobInput.recurring ?? false, jobInput.dynamicArgumentsScriptUrl || '');
      }
    }
    // Condition-based jobs
    else {
      if (jobType === 3 || jobType === 5) {
        encodedData = encodeJobType3or5Data(jobInput.recurring ?? false);
      } else if (jobType === 4 || jobType === 6) {
        encodedData = encodeJobType4or6Data(jobInput.recurring ?? false, jobInput.dynamicArgumentsScriptUrl || '');
      }
    }
  }

  // Handle job_cost_prediction logic based on argType (static/dynamic)
  // If static, set to 0.1. If dynamic, call backend API to get fee and ask user to proceed.

  // Determine argType directly from user input
  let argType: number = 1; // default to static
  if ('argType' in jobInput) {
    if (jobInput.argType === 'dynamic' || jobInput.argType === 2) {
      argType = 2;
    } else {
      argType = 1;
    }
  }

  //if jobis time based then check the no of executions of the job from time frame and time interval by deviding time frame by time interval
  let noOfExecutions: number = 1;
  if ('scheduleType' in jobInput) {
    noOfExecutions = jobInput.timeFrame / (jobInput.timeInterval ?? 0);
  }

  // Set job_cost_prediction
  let job_cost_prediction: number = 0.1 * noOfExecutions; // default for static

  if (argType === 2) {
    // Dynamic: call backend API to get fee
    const ipfs_url = jobInput.dynamicArgumentsScriptUrl;
    if (!ipfs_url) {
      throw new Error('dynamicArgumentsScriptUrl is required for dynamic argType');
    }

    
    // Call backend API to get fee
    let fee: number = 0;
    try {
      const feeRes = await client.get<any>(
        '/api/fees',
        { params: { ipfs_url } }
      );
      // The API now returns { total_fee: number }
      if (feeRes && typeof feeRes.total_fee === 'number') {
        fee = feeRes.total_fee;
      } else if (feeRes && feeRes.data && typeof feeRes.data.total_fee === 'number') {
        fee = feeRes.data.total_fee;
      } else {
        throw new Error('Invalid response from /api/fees: missing total_fee');
      }
    } catch (err) {
      throw new Error('Failed to fetch job cost prediction: ' + (err as Error).message);
    }
    job_cost_prediction = fee * noOfExecutions;
  }
    // Ask user if they want to proceed
    // Since this is a library, we can't prompt in Node.js directly.
    // We'll throw an error with the fee and let the caller handle the prompt/confirmation.
    // If you want to automate, you can add a `proceed` flag to params in the future.

    // Check if the user has enough TG to cover the job cost prediction
    const { tgBalanceWei, tgBalance } = await checkTgBalance(signer);
    if (Number(tgBalance) < job_cost_prediction) {
      // Check if user has enabled auto topup
      // For each job type, autotopupTG should be present in jobInput
      const autoTopupTG = (jobInput as any).autotopupTG === true;
      if (!autoTopupTG) {
        throw new Error(`Insufficient TG balance. Job cost prediction is ${job_cost_prediction}. Current TG balance: ${tgBalance}. Please set autotopupTG: true in jobInput.`);
      } else {
        // autotopupTG is true, automatically top up
        const requiredTG = Math.ceil(job_cost_prediction); // 1 TG = 0.001 ETH
        await topupTg(requiredTG, signer);
      }
    }

  // Compute balances to store with the job
  const tokenBalanceWei = tgBalanceWei;
  const etherBalance = tokenBalanceWei / 1000n;

  // Patch jobInput with job_cost_prediction for downstream usage
  (jobInput as any).jobCostPrediction = job_cost_prediction;

  const jobId = await createJobOnChain({
    jobTitle: jobTitle!,
    jobType,
    timeFrame: timeFrame!,
    targetContractAddress: targetContractAddress!,
    encodedData: encodedData || '',
    contractAddress: JOB_REGISTRY_ADDRESS,
    abi: jobRegistryAbi.abi,
    signer,
  });

  // 2. Convert input to CreateJobData
  let jobData: CreateJobData;
  const balances = { etherBalance, tokenBalanceWei };
  if ('scheduleType' in jobInput) {
    jobData = toCreateJobDataFromTime(jobInput as TimeBasedJobInput, balances, userAddress, job_cost_prediction);
  } else if ('triggerChainId' in jobInput) {
    jobData = toCreateJobDataFromEvent(jobInput as EventBasedJobInput, balances, userAddress, job_cost_prediction);
  } else {
    jobData = toCreateJobDataFromCondition(jobInput as ConditionBasedJobInput, balances, userAddress, job_cost_prediction);
  }
  // 3. Set the job_id from contract
  jobData.job_id = jobId;

  // 4. Call the API
  try {
    // Ensure JSON-serializable payload (use numbers for balances)
    const jobDataForApi = {
      ...jobData,
      ether_balance: typeof jobData.ether_balance === 'bigint' ? Number(jobData.ether_balance) : Number(jobData.ether_balance),
      token_balance: typeof jobData.token_balance === 'bigint' ? Number(jobData.token_balance) : Number(jobData.token_balance),
    } as any;

    const res = await client.post<any>(
      '/api/jobs',
      [jobDataForApi],
      {
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      }
    );
    return { success: true, data: res };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
} 