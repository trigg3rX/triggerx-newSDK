import { TriggerXClient } from '../client';
import {
  TimeBasedJobInput,
  EventBasedJobInput,
  ConditionBasedJobInput,
  CreateJobData,
  JobResponse,
  SafeTransaction,
  JobType,
  CustomScriptJobInput,
  ArgType,
} from '../types';
import { createJobOnChain } from '../contracts/JobRegistry';
import { ethers, Signer } from 'ethers';
import jobRegistryAbi from '../contracts/abi/JobRegistry.json';
import { depositEth } from './topup';
import { checkEthBalance } from './checkBalance';
import { getChainAddresses } from '../config';
import { validateJobInput } from '../utils/validation';
import {
  ValidationError,
  NetworkError,
  AuthenticationError,
  ContractError,
  ApiError,
  BalanceError,
  ConfigurationError,
  createErrorResponse,
  extractHttpStatusCode,
  determineErrorCode
} from '../utils/errors';
import { enableSafeModule, ensureSingleOwnerAndMatchSigner } from '../contracts/safe/SafeWallet';
import { createSafeWalletForUser } from '../contracts/safe/SafeFactory';

const JOB_ID = '300949528249665590178224313442040528409305273634097553067152835846309150732';
const DYNAMIC_ARGS_URL = 'https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreif426p7t7takzhw3g6we2h6wsvf27p5jxj3gaiynqf22p3jvhx4la';

// Helper function to encode multisend batch transactions
function encodeMultisendData(transactions: SafeTransaction[]): string {
  // Multisend format: for each transaction, encode as:
  // operation (1 byte) + to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data (variable)
  let encodedTransactions = '';

  for (const tx of transactions) {
    const txWithOperation = tx as SafeTransaction & { operation?: number };
    const to = txWithOperation.to;
    const value = ethers.toBigInt(txWithOperation.value);
    const data = txWithOperation.data;

    // Remove 0x prefix from data if present
    const dataWithoutPrefix = data.startsWith('0x') ? data.slice(2) : data;
    const dataLength = ethers.toBigInt(dataWithoutPrefix.length / 2);

    // Encode each field and concatenate
    // operation: uint8 (1 byte)
    const operation = typeof txWithOperation.operation === 'number' ? txWithOperation.operation : 0;
    if (operation < 0 || operation > 1) {
      throw new Error(`Invalid Safe transaction operation: ${operation}. Expected 0 (CALL) or 1 (DELEGATECALL).`);
    }
    const operationHex = operation.toString(16).padStart(2, '0');
    // to: address (20 bytes)
    const toHex = to.toLowerCase().replace(/^0x/, '').padStart(40, '0');
    // value: uint256 (32 bytes)
    const valueHex = value.toString(16).padStart(64, '0');
    // dataLength: uint256 (32 bytes)
    const dataLengthHex = dataLength.toString(16).padStart(64, '0');
    // data: bytes (variable length)

    encodedTransactions += operationHex + toHex + valueHex + dataLengthHex + dataWithoutPrefix;
  }

  const packedTransactions = `0x${encodedTransactions}`;
  const multiSendInterface = new ethers.Interface([
    'function multiSend(bytes transactions)'
  ]);

  return multiSendInterface.encodeFunctionData('multiSend', [packedTransactions]);
}

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
    target_contract_address: (input as any).targetContractAddress || '',
    target_function: (input as any).targetFunction || '',
    abi: (input as any).abi || '',
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
    is_safe: (input as any).walletMode === 'safe',
    safe_name: (input as any).safeName || '',
    safe_address: (input as any).safeAddress || '',
    language: (input as any).language || '',
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
    target_contract_address: (input as any).targetContractAddress || '',
    target_function: (input as any).targetFunction || '',
    abi: (input as any).abi || '',
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
    is_safe: (input as any).walletMode === 'safe',
    safe_name: (input as any).safeName || '',
    safe_address: (input as any).safeAddress || '',
    language: (input as any).language || '',
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
    target_contract_address: (input as any).targetContractAddress || '',
    target_function: (input as any).targetFunction || '',
    abi: (input as any).abi || '',
    arg_type: input.dynamicArgumentsScriptUrl ? 2 : 1,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
    is_safe: (input as any).walletMode === 'safe',
    safe_name: (input as any).safeName || '',
    safe_address: (input as any).safeAddress || '',
    language: (input as any).language || '',
  };
}

export function toCreateJobDataFromCustomScript(
  input: CustomScriptJobInput,
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
    task_definition_id: 7,
    custom: true,
    time_frame: input.timeFrame,
    recurring: input.recurring ?? false,
    job_cost_prediction: jobCostPrediction,
    timezone: input.timezone,
    created_chain_id: input.chainId,
    target_chain_id: input.chainId,
    target_contract_address: (input as any).targetContractAddress || '',
    target_function: (input as any).targetFunction || '',
    abi: (input as any).abi || '',
    arg_type: 2,
    arguments: input.arguments,
    dynamic_arguments_script_url: input.dynamicArgumentsScriptUrl,
    is_imua: input.isImua ?? true,
    is_safe: (input as any).walletMode === 'safe',
    safe_name: (input as any).safeName || '',
    safe_address: (input as any).safeAddress || '',
    language: input.language,
    time_interval: input.timeInterval,
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

function encodeJobType7Data(timeInterval: number, ipfsHash: string, language: string) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint256', 'bytes32', 'string'],
    [timeInterval, ipfsHash, language]
  );
}

export interface CreateJobParams {
  jobInput: TimeBasedJobInput | EventBasedJobInput | ConditionBasedJobInput | CustomScriptJobInput;
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
  if (!apiKey) {
    return createErrorResponse(
      new AuthenticationError('API key is required but not provided'),
      'Authentication failed'
    );
  }

  let userAddress: string;
  try {
    userAddress = await signer.getAddress();
  } catch (err) {
    return createErrorResponse(
      new AuthenticationError('Failed to get signer address', { originalError: err }),
      'Authentication failed'
    );
  }

  // Resolve chain-specific addresses
  let network: any;
  try {
    network = await signer.provider?.getNetwork();
  } catch (err) {
    return createErrorResponse(
      new NetworkError('Failed to get network information', { originalError: err }),
      'Network error'
    );
  }

  const chainIdStr = network?.chainId ? network.chainId.toString() : undefined;
  const { jobRegistry, safeModule, safeFactory, multisendCallOnly } = getChainAddresses(chainIdStr);
  const JOB_REGISTRY_ADDRESS = jobRegistry;
  if (!JOB_REGISTRY_ADDRESS) {
    return createErrorResponse(
      new ConfigurationError(`JobRegistry address not configured for chain ID: ${chainIdStr}`),
      'Configuration error'
    );
  }

  // If Safe mode, override target fields BEFORE validation so user doesn't need to provide them
  const walletModePre = (jobInput as any).walletMode as any;
  if (walletModePre === 'safe') {
    if (!safeModule) {
      return createErrorResponse(
        new ConfigurationError('Safe Module address not configured for this chain.'),
        'Configuration error'
      );
    }
    // If safeAddress is missing, require it (must be created by the user before this call)
    if (!(jobInput as any).safeAddress || typeof (jobInput as any).safeAddress !== 'string' || !(jobInput as any).safeAddress.trim()) {
      return createErrorResponse(
        new ValidationError('safeAddress', 'safeAddress is required when walletMode is "safe". Call createSafeWallet first.'),
        'Validation error'
      );
    }

    // Validate Safe has single owner and owner matches signer
    try {
      await ensureSingleOwnerAndMatchSigner(
        (jobInput as any).safeAddress,
        signer.provider!,
        await signer.getAddress()
      );

      // Ensure module is enabled on Safe
      await enableSafeModule(
        (jobInput as any).safeAddress,
        signer,
        safeModule
      );
    } catch (err) {
      return createErrorResponse(
        new ContractError('Failed to configure Safe wallet', { originalError: err, safeAddress: (jobInput as any).safeAddress }),
        'Contract error'
      );
    }

    // Auto-set module target; user does not need to pass targetContractAddress in safe mode
    (jobInput as any).targetContractAddress = safeModule;
    (jobInput as any).targetFunction = 'execJobFromHub(address,address,uint256,bytes,uint8)';
    (jobInput as any).abi = JSON.stringify([
      {
        "type": "function", "name": "execJobFromHub", "stateMutability": "nonpayable", "inputs": [
          { "name": "safeAddress", "type": "address" },
          { "name": "actionTarget", "type": "address" },
          { "name": "actionValue", "type": "uint256" },
          { "name": "actionData", "type": "bytes" },
          { "name": "operation", "type": "uint8" }
        ], "outputs": [{ "type": "bool", "name": "success" }]
      }
    ]);

    // Handle static vs dynamic safe wallet jobs
    const hasDynamicUrl = !!(jobInput as any).dynamicArgumentsScriptUrl;
    const hasSafeTransactions = !!((jobInput as any).safeTransactions && (jobInput as any).safeTransactions.length > 0);

    if (hasDynamicUrl) {
      // Dynamic safe wallet job - keep existing behavior
      (jobInput as any).arguments = undefined;
    } else if (hasSafeTransactions) {
      // Static safe wallet job - encode transactions into arguments
      const safeTransactions = (jobInput as any).safeTransactions as SafeTransaction[];
      const safeAddress = (jobInput as any).safeAddress as string;

      if (safeTransactions.length === 1) {
        // Single transaction: use transaction directly
        const tx = safeTransactions[0];
        (jobInput as any).arguments = [
          safeAddress,
          tx.to,
          tx.value,
          tx.data,
          0 // CALL
        ];
      } else {
        // Multiple transactions: use multisend
        if (!multisendCallOnly) {
          return createErrorResponse(
            new ConfigurationError('MultisendCallOnly address not configured for this chain.'),
            'Configuration error'
          );
        }
        const encodedMultisendData = encodeMultisendData(safeTransactions);
        (jobInput as any).arguments = [
          safeAddress,
          multisendCallOnly,
          '0',
          encodedMultisendData,
          1 // DELEGATECALL
        ];
      }
    } else {
      // Will be caught by validation
      (jobInput as any).arguments = undefined;
    }
  }

  // 0. Validate user input thoroughly before proceeding (after safe overrides)
  try {
    const argValue = (jobInput as any).argType as any;
    validateJobInput(jobInput as any, argValue);
    console.log('Job input validated successfully');
  } catch (err) {
    if (err instanceof ValidationError) {
      return createErrorResponse(err);
    }
    return createErrorResponse(err, 'Job input validation failed');
  }

  let jobTitle: string = '';
  let timeFrame: number = 0;
  let targetContractAddress: string = '';
  let jobType: number = 0;

  if ('jobTitle' in jobInput) jobTitle = jobInput.jobTitle;
  if ('timeFrame' in jobInput) timeFrame = jobInput.timeFrame;
  if ('targetContractAddress' in jobInput) targetContractAddress = (jobInput as any).targetContractAddress || '';

  // Validate schedule-specific fields for time-based jobs
  if ('scheduleType' in jobInput) {
    if (jobInput.scheduleType === 'interval' && (jobInput.timeInterval === undefined || jobInput.timeInterval === null)) {
      return createErrorResponse(
        new ValidationError('timeInterval', 'timeInterval is required when scheduleType is interval'),
        'Validation error'
      );
    }
    if (jobInput.scheduleType === 'cron' && !jobInput.cronExpression) {
      return createErrorResponse(
        new ValidationError('cronExpression', 'cronExpression is required when scheduleType is cron'),
        'Validation error'
      );
    }
    if (jobInput.scheduleType === 'specific' && !jobInput.specificSchedule) {
      return createErrorResponse(
        new ValidationError('specificSchedule', 'specificSchedule is required when scheduleType is specific'),
        'Validation error'
      );
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

  const jobTypeField = (jobInput as any).jobType;
  if (
    jobTypeField === JobType.CustomScript ||
    jobTypeField === 'custom_script' ||
    jobTypeField === 7 ||
    jobTypeField === '7'
  ) {
    jobType = 7;
  }

  // --- Generate encodedData if not provided ---
  if (!encodedData) {
    // Time-based jobs
    if ('scheduleType' in jobInput) {
      if (jobType === 1) {
        encodedData = encodeJobType1Data(jobInput.timeInterval ?? 0);
      } else if (jobType === 2) {
        const ipfsBytes32 = jobInput.dynamicArgumentsScriptUrl ? ethers.id(jobInput.dynamicArgumentsScriptUrl) : ethers.ZeroHash;
        encodedData = encodeJobType2Data(jobInput.timeInterval ?? 0, ipfsBytes32);
      }
    }
    // Event-based jobs
    else if ('triggerChainId' in jobInput) {
      if (jobType === 3 || jobType === 5) {
        encodedData = encodeJobType3or5Data(jobInput.recurring ?? false);
      } else if (jobType === 4 || jobType === 6) {
        const ipfsBytes32 = jobInput.dynamicArgumentsScriptUrl ? ethers.id(jobInput.dynamicArgumentsScriptUrl) : ethers.ZeroHash;
        encodedData = encodeJobType4or6Data(jobInput.recurring ?? false, ipfsBytes32);
      }
    }

    // Custom script jobs
    else if (jobType === 7) {
      const customInput = jobInput as CustomScriptJobInput;
      const ipfsBytes32 = ethers.id(customInput.dynamicArgumentsScriptUrl);
      encodedData = encodeJobType7Data(customInput.timeInterval ?? 0, ipfsBytes32, customInput.language);
    }
    // Condition-based jobs
    else {
      if (jobType === 3 || jobType === 5) {
        encodedData = encodeJobType3or5Data(jobInput.recurring ?? false);
      } else if (jobType === 4 || jobType === 6) {
        const ipfsBytes32 = jobInput.dynamicArgumentsScriptUrl ? ethers.id(jobInput.dynamicArgumentsScriptUrl) : ethers.ZeroHash;
        encodedData = encodeJobType4or6Data(jobInput.recurring ?? false, ipfsBytes32);
      }
    }

  }

  // Handle job_cost_prediction by always calling backend /api/fees
  // The backend returns the total fee in wei; we convert it to token units (formatted ether)
  // so it can be compared with ETH balance (which is also formatted via ethers.formatEther).

  // Determine argType directly from user input
  let argType: number = 1; // default to static
  if ('argType' in jobInput) {
    if (jobInput.argType === 'dynamic' || jobInput.argType === 2 || jobInput.argType === ArgType.Dynamic) {
      argType = 2;
    } else {
      argType = 1;
    }
  }
  if (jobType === 7) {
    argType = 2;
    (jobInput as any).argType = ArgType.Dynamic;
  }

  //if jobis time based then check the no of executions of the job from time frame and time interval by deviding time frame by time interval
  let noOfExecutions: number = 1;
  if ('scheduleType' in jobInput) {
    noOfExecutions = Math.ceil(jobInput.timeFrame / (jobInput.timeInterval ?? 1));
  } else if (jobType === 7) {
    const customInterval = (jobInput as CustomScriptJobInput).timeInterval ?? 0;
    if (customInterval > 0) {
      noOfExecutions = Math.max(1, Math.floor(jobInput.timeFrame / customInterval));
    }
  }

  let requiredETH: any;
  let maxtotalFeeRaw: any;
  // Prepare parameters for /api/fees
  const ipfs_url = (jobInput as any).dynamicArgumentsScriptUrl || '';
  const task_definition_id = jobType; // use inferred jobType as task definition id
  const target_chain_id = chainIdStr || '';
  const target_contract_address = (jobInput as any).targetContractAddress || '';
  const target_function = (jobInput as any).targetFunction || '';
  const abi = (jobInput as any).abi || '';
  const args = (jobInput as any).arguments ? JSON.stringify((jobInput as any).arguments) : '';

  let job_cost_prediction: bigint = 0n;
  try {
    const feeRes = await client.get<any>(
      '/api/fees',
      {
        params: {
          ipfs_url,
          task_definition_id,
          target_chain_id,
          target_contract_address,
          target_function,
          abi,
          args,
        }
      }
    );

    // The API returns total fee in wei: { total_fee: "<wei>" } or nested under data
    let totalFeeRaw: any;
    if (feeRes && feeRes.current_total_fee !== undefined) {
      totalFeeRaw = feeRes.current_total_fee;
    } else if (feeRes && feeRes.data && feeRes.data.current_total_fee !== undefined) {
      totalFeeRaw = feeRes.data.current_total_fee;
    }

    maxtotalFeeRaw=feeRes.total_fee;

    if (totalFeeRaw === undefined) {
      return createErrorResponse(
        new ApiError('Invalid response from /api/fees: missing total_fee', { response: feeRes }),
        'API error'
      );
    }

    // Support both number and string representations of wei
    let totalFeeWei: bigint;
    if (typeof totalFeeRaw === 'string') {
      totalFeeWei = BigInt(totalFeeRaw);
    } else if (typeof totalFeeRaw === 'number') {
      totalFeeWei = BigInt(Math.floor(totalFeeRaw));
    } else {
      return createErrorResponse(
        new ApiError('Invalid total_fee type from /api/fees', { totalFeeRaw }),
        'API error'
      );
    }

    // Convert wei to token units (formatted ether) so it matches tgBalance units
    // job_cost_prediction = Number(ethers.formatEther(totalFeeWei));
    job_cost_prediction = totalFeeWei;

  } catch (err) {
    const httpStatusCode = extractHttpStatusCode(err);
    const errorCode = determineErrorCode(err, httpStatusCode);
    return createErrorResponse(
      new ApiError('Failed to fetch job cost prediction', { originalError: err, jobType }, httpStatusCode),
      'API error'
    );
  }

  job_cost_prediction = job_cost_prediction * BigInt(noOfExecutions);
  let requiredETHwei = job_cost_prediction;  // this is in wei
  // Ask user if they want to proceed
  // Since this is a library, we can't prompt in Node.js directly.
  // We'll throw an error with the fee and let the caller handle the prompt/confirmation.
  // If you want to automate, you can add a `proceed` flag to params in the future.

  // Check if the user has enough ETH to cover the job cost prediction
  let ethBalanceWei: bigint, ethBalance: string;
  try {
    const balanceResult = await checkEthBalance(userAddress, chainIdStr!);
    if (!balanceResult.success || !balanceResult.data) {
      return createErrorResponse(
        new BalanceError('Failed to check ETH balance', balanceResult.details),
        'Balance check error'
      );
    }
    ethBalanceWei = balanceResult.data.ethBalanceWei;
    ethBalance = balanceResult.data.ethBalance;
  } catch (err) {
    return createErrorResponse(
      new BalanceError('Failed to check ETH balance', { originalError: err }),
      'Balance check error'
    );
  }

  // Check if user has enabled auto topup
  // For each job type, autotopupETH should be present in jobInput
  // Support autotopupTG for backward compatibility
  const autoTopupETH = (jobInput as any).autotopupETH === true || (jobInput as any).autotopupTG === true;
  if (!autoTopupETH) {
    return createErrorResponse(
      new BalanceError(`Insufficient ETH balance. Job cost prediction is ${requiredETHwei}. Current ETH balance: ${ethBalanceWei}. Please set autotopupETH: true in jobInput.`, {
        required: requiredETHwei,
        current: ethBalanceWei,
        autoTopupEnabled: false
      }),
      'Insufficient balance'
    );
  } else {
    // autotopupETH is true, automatically top up
    // Calculate requiredETH as 1.2x the predicted job cost (in wei) using bigint math to avoid precision loss,
    // ensuring requiredETH is returned in the JobResponse (see types.ts).
    requiredETH = (requiredETHwei * 12n) / 10n; // 1.2x in bigint
    try {
      const topupResult = await depositEth(requiredETHwei, signer);
      if (!topupResult.success) {
        return createErrorResponse(
          new BalanceError('Failed to deposit ETH balance', topupResult.details),
          'Top-up error'
        );
      }
    } catch (err) {
      return createErrorResponse(
        new BalanceError('Failed to deposit ETH balance', { originalError: err, requiredETH }),
        'Top-up error'
      );
    }
  }

  // Compute balances to store with the job
  const tokenBalanceWei = ethBalanceWei;
  const etherBalance = tokenBalanceWei;

  // Patch jobInput with job_cost_prediction for downstream usage
  (jobInput as any).jobCostPrediction = Number(ethers.formatEther(tokenBalanceWei));  // this is in ether

  let jobId: string;
  try {
    jobId = await createJobOnChain({
      jobTitle: jobTitle!,
      jobType,
      timeFrame: timeFrame!,
      targetContractAddress: targetContractAddress!,
      encodedData: encodedData || '',
      contractAddress: JOB_REGISTRY_ADDRESS,
      abi: jobRegistryAbi as any,
      signer,
    });
  } catch (err) {
    return createErrorResponse(
      new ContractError('Failed to create job on chain', { originalError: err, jobTitle, jobType, timeFrame }),
      'Contract error'
    );
  }

  // 2. Convert input to CreateJobData
  let jobData: CreateJobData;
  const balances = { etherBalance, tokenBalanceWei };
  if ('scheduleType' in jobInput) {
    jobData = toCreateJobDataFromTime(jobInput as TimeBasedJobInput, balances, userAddress, Number(ethers.formatEther(job_cost_prediction)));
  } else if ('triggerChainId' in jobInput) {
    jobData = toCreateJobDataFromEvent(jobInput as EventBasedJobInput, balances, userAddress, Number(ethers.formatEther(job_cost_prediction)));
  } else if (jobType === 7) {
    jobData = toCreateJobDataFromCustomScript(jobInput as CustomScriptJobInput, balances, userAddress, Number(ethers.formatEther(job_cost_prediction)));
  } else {
    jobData = toCreateJobDataFromCondition(jobInput as ConditionBasedJobInput, balances, userAddress, Number(ethers.formatEther(job_cost_prediction)));
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
    res.requiredETH = requiredETH;
    res.maxtotalFeeRaw = maxtotalFeeRaw;

    return { success: true, data: res };
  } catch (error) {
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    return createErrorResponse(
      new ApiError('Failed to create job via API', { originalError: error, jobId }, httpStatusCode),
      'API error'
    );
  }
} 
