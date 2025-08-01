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

const JOB_ID = '300949528249665590178224313442040528409305273634097553067152835846309150732';
const DYNAMIC_ARGS_URL = 'https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreif426p7t7takzhw3g6we2h6wsvf27p5jxj3gaiynqf22p3jvhx4la';
const JOB_REGISTRY_ADDRESS = '0xdB66c11221234C6B19cCBd29868310c31494C21C'; // Set your fixed contract address here

export function toCreateJobDataFromTime(input: TimeBasedJobInput): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: input.userAddress,
    ether_balance: input.etherBalance,
    token_balance: input.tokenBalance,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 2 : 1,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: input.jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.createdChainId,
    schedule_type: input.scheduleType,
    time_interval: input.timeInterval,
    cron_expression: input.cronExpression,
    specific_schedule: input.specificSchedule,
    target_chain_id: input.targetChainId,
    target_contract_address: input.targetContractAddress,
    target_function: input.targetFunction,
    abi: input.abi,
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
  };
}

export function toCreateJobDataFromEvent(input: EventBasedJobInput): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: input.userAddress,
    ether_balance: input.etherBalance,
    token_balance: input.tokenBalance,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 4 : 3,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: input.jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.createdChainId,
    trigger_chain_id: input.triggerChainId,
    trigger_contract_address: input.triggerContractAddress,
    trigger_event: input.triggerEvent,
    target_chain_id: input.targetChainId,
    target_contract_address: input.targetContractAddress,
    target_function: input.targetFunction,
    abi: input.abi,
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
  };
}

export function toCreateJobDataFromCondition(input: ConditionBasedJobInput): CreateJobData {
  return {
    job_id: JOB_ID,
    user_address: input.userAddress,
    ether_balance: input.etherBalance,
    token_balance: input.tokenBalance,
    job_title: input.jobTitle,
    task_definition_id: input.dynamicArgumentsScriptUrl ? 6 : 5,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: input.jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.createdChainId,
    condition_type: input.conditionType,
    upper_limit: input.upperLimit,
    lower_limit: input.lowerLimit,
    value_source_type: input.valueSourceType,
    value_source_url: input.valueSourceUrl,
    target_chain_id: input.targetChainId,
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

  let jobTitle: string, timeFrame: number, targetContractAddress: string, jobType: number;
  if ('jobTitle' in jobInput) jobTitle = jobInput.jobTitle;
  if ('timeFrame' in jobInput) timeFrame = jobInput.timeFrame;
  if ('targetContractAddress' in jobInput) targetContractAddress = jobInput.targetContractAddress;

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

  // // Handle job_cost_prediction logic based on argType (static/dynamic)
  // // If static, set to 0.1. If dynamic, call backend API to get fee and ask user to proceed.

  // // Determine argType directly from user input
  // let argType: number = 1; // default to static
  // if ('argType' in jobInput) {
  //   if (jobInput.argType === 'dynamic' || jobInput.argType === 2) {
  //     argType = 2;
  //   } else {
  //     argType = 1;
  //   }
  // }

  // // Set job_cost_prediction
  // let job_cost_prediction: number = 0.1; // default for static

  // if (argType === 2) {
  //   // Dynamic: call backend API to get fee
  //   const ipfs_url = jobInput.dynamicArgumentsScriptUrl;
  //   if (!ipfs_url) {
  //     throw new Error('dynamicArgumentsScriptUrl is required for dynamic argType');
  //   }

    
  //   // Call backend API to get fee
  //   let fee: number = 0;
  //   try {
  //     const feeRes = await client.get<any>(
  //       '/api/fees',
  //       { params: { ipfs_url } }
  //     );
  //     // The API now returns { total_fee: number }
  //     if (feeRes && typeof feeRes.total_fee === 'number') {
  //       fee = feeRes.total_fee;
  //     } else if (feeRes && feeRes.data && typeof feeRes.data.total_fee === 'number') {
  //       fee = feeRes.data.total_fee;
  //     } else {
  //       throw new Error('Invalid response from /api/fees: missing total_fee');
  //     }
  //   } catch (err) {
  //     throw new Error('Failed to fetch job cost prediction: ' + (err as Error).message);
  //   }
  //   job_cost_prediction = fee;

  //   // Ask user if they want to proceed
  //   // Since this is a library, we can't prompt in Node.js directly.
  //   // We'll throw an error with the fee and let the caller handle the prompt/confirmation.
  //   // If you want to automate, you can add a `proceed` flag to params in the future.

  //   if (typeof (params as any).proceed === 'undefined') {
  //     // User has not confirmed, throw error with fee info
  //     throw new Error(
  //       `Job cost prediction is ${fee}. Please confirm to proceed by passing { ...params, proceed: true }`
  //     );
  //   } else if (!(params as any).proceed) {
  //     // User declined
  //     return { success: false, error: 'User declined to proceed with job cost prediction fee.' };
  //   }

  //   // If user agreed, send the fee to the gas registry contract before proceeding
  //   // We'll assume a fixed GAS_REGISTRY_ADDRESS and a payable fallback function
  //   const GAS_REGISTRY_ADDRESS = '0xYourGasRegistryContractAddressHere'; // <-- Set your contract address

  //   // Send the fee (in ETH) to the gas registry contract
  //   // Assume fee is in ETH (number), convert to wei
  //   const value = ethers.parseEther(fee.toString());
  //   const tx = await signer.sendTransaction({
  //     to: GAS_REGISTRY_ADDRESS,
  //     value,
  //   });
  //   await tx.wait();
  // }

  // // Patch jobInput with job_cost_prediction for downstream usage
  // (jobInput as any).jobCostPrediction = job_cost_prediction;

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
  if ('scheduleType' in jobInput) {
    jobData = toCreateJobDataFromTime(jobInput as TimeBasedJobInput);
  } else if ('triggerChainId' in jobInput) {
    jobData = toCreateJobDataFromEvent(jobInput as EventBasedJobInput);
  } else {
    jobData = toCreateJobDataFromCondition(jobInput as ConditionBasedJobInput);
  }
  // 3. Set the job_id from contract
  jobData.job_id = jobId;

  // 4. Call the API
  try {
    const res = await client.post<any>(
      '/api/jobs',
      [jobData],
      {
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      }
    );
    return { success: true, data: res };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
} 