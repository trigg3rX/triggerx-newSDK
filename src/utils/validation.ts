import { ethers } from 'ethers';
import {
  TimeBasedJobInput,
  EventBasedJobInput,
  ConditionBasedJobInput,
} from '../types';
import { ValidationError } from './errors';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function buildFunctionSignature(name: string, inputs?: Array<{ type: string }>): string {
  const types = (inputs || []).map((i) => i.type).join(',');
  return `${name}(${types})`;
}

function parseAbi(abiString: string): any[] | null {
  if (!isNonEmptyString(abiString)) return null;
  try {
    const parsed = JSON.parse(abiString);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateContractBasics(address: string | undefined, abi: string | undefined, targetFunction: string | undefined, fieldPrefix = 'contract'): void {
  if (!isNonEmptyString(address)) {
    throw new ValidationError(`${fieldPrefix}Address`, 'Contract address is required.');
  }
  if (!ethers.isAddress(address)) {
    throw new ValidationError(`${fieldPrefix}Address`, 'Invalid contract address.');
  }
  if (!isNonEmptyString(abi as string)) {
    throw new ValidationError(`${fieldPrefix}ABI`, 'Contract ABI must be provided.');
  }
  if (!isNonEmptyString(targetFunction as string)) {
    throw new ValidationError(`${fieldPrefix}Target`, 'Target function must be selected.');
  }
}

function validateStaticArguments(abiString: string, targetFunction: string, args?: string[], fieldPrefix = 'contract'): void {
  const abi = parseAbi(abiString);
  if (!abi) {
    // If ABI is invalid JSON, surface a clear error
    throw new ValidationError(`${fieldPrefix}ABI`, 'Contract ABI must be valid JSON array.');
  }
  const fnItem = abi.find((item: any) => item && item.type === 'function' && buildFunctionSignature(item.name, item.inputs) === targetFunction);
  if (!fnItem) return; // If we cannot find it, skip strict arg validation
  const inputs = Array.isArray(fnItem.inputs) ? fnItem.inputs : [];
  if (inputs.length === 0) return;
  if (!args || args.length < inputs.length) {
    throw new ValidationError(`${fieldPrefix}Args`, 'All function arguments are required for static argument type.');
  }
  const missing = inputs.findIndex((_: unknown, idx: number) => !isNonEmptyString(args[idx]));
  if (missing !== -1) {
    throw new ValidationError(`${fieldPrefix}Args`, 'All function arguments are required for static argument type.');
  }
}

export function validateTimeBasedJobInput(input: TimeBasedJobInput, argType: 'static' | 'dynamic' | 1 | 2 | undefined): void {
  if (!isNonEmptyString(input.jobTitle)) {
    throw new ValidationError('jobTitle', 'Job title is required.');
  }
  if (!input.timeFrame || input.timeFrame <= 0) {
    throw new ValidationError('timeframe', 'Timeframe must be a positive number of seconds.');
  }
  if (!isNonEmptyString(input.timezone)) {
    throw new ValidationError('timezone', 'Timezone is required.');
  }
  if (!isNonEmptyString(input.chainId)) {
    throw new ValidationError('chainId', 'Chain ID is required.');
  }

  // Schedule-specific required fields
  if (input.scheduleType === 'interval') {
    if (input.timeInterval === undefined || input.timeInterval === null || input.timeInterval <= 0) {
      throw new ValidationError('timeInterval', 'timeInterval is required and must be > 0 when scheduleType is interval.');
    }
    if (input.timeInterval > input.timeFrame) {
      throw new ValidationError('timeInterval', 'Time interval cannot exceed the timeframe.');
    }
  } else if (input.scheduleType === 'cron') {
    if (!isNonEmptyString(input.cronExpression)) {
      throw new ValidationError('cronExpression', 'cronExpression is required when scheduleType is cron.');
    }
  } else if (input.scheduleType === 'specific') {
    if (!isNonEmptyString(input.specificSchedule)) {
      throw new ValidationError('specificSchedule', 'specificSchedule is required when scheduleType is specific.');
    }
  } else {
    throw new ValidationError('scheduleType', 'scheduleType must be one of interval | cron | specific.');
  }

  if (input.walletMode !== 'safe') {
    validateContractBasics(input.targetContractAddress, input.abi, input.targetFunction, 'contract');
  }

  // Arg type checks
  const isDynamic = argType === 'dynamic' || argType === 2;
  if (isDynamic) {
    if (!isNonEmptyString(input.dynamicArgumentsScriptUrl) || !isValidUrl(input.dynamicArgumentsScriptUrl)) {
      throw new ValidationError('contractIpfs', 'IPFS Code URL is required and must be valid for dynamic argument type.');
    }
  } else {
    if (input.walletMode !== 'safe') {
      validateStaticArguments(input.abi as string, input.targetFunction as string, input.arguments, 'contract');
    }
  }
}

export function validateEventBasedJobInput(input: EventBasedJobInput, argType: 'static' | 'dynamic' | 1 | 2 | undefined): void {
  if (!isNonEmptyString(input.jobTitle)) {
    throw new ValidationError('jobTitle', 'Job title is required.');
  }
  if (!input.timeFrame || input.timeFrame <= 0) {
    throw new ValidationError('timeframe', 'Timeframe must be a positive number of seconds.');
  }
  if (!isNonEmptyString(input.timezone)) {
    throw new ValidationError('timezone', 'Timezone is required.');
  }
  if (!isNonEmptyString(input.chainId)) {
    throw new ValidationError('chainId', 'Chain ID is required.');
  }
  if (!isNonEmptyString(input.triggerChainId)) {
    throw new ValidationError('triggerChainId', 'Trigger chain ID is required.');
  }
  validateContractBasics(input.triggerContractAddress, input.abi as string, input.triggerEvent, 'eventContract');
  if (input.walletMode !== 'safe') {
    validateContractBasics(input.targetContractAddress, input.abi, input.targetFunction, 'contract');
  }

  const isDynamic = argType === 'dynamic' || argType === 2;
  if (isDynamic) {
    if (!isNonEmptyString(input.dynamicArgumentsScriptUrl) || !isValidUrl(input.dynamicArgumentsScriptUrl)) {
      throw new ValidationError('contractIpfs', 'IPFS Code URL is required and must be valid for dynamic argument type.');
    }
  } else {
    if (input.walletMode !== 'safe') {
      validateStaticArguments(input.abi as string, input.targetFunction as string, input.arguments, 'contract');
    }
  }
}

export function validateConditionBasedJobInput(input: ConditionBasedJobInput, argType: 'static' | 'dynamic' | 1 | 2 | undefined): void {
  if (!isNonEmptyString(input.jobTitle)) {
    throw new ValidationError('jobTitle', 'Job title is required.');
  }
  if (!input.timeFrame || input.timeFrame <= 0) {
    throw new ValidationError('timeframe', 'Timeframe must be a positive number of seconds.');
  }
  if (!isNonEmptyString(input.timezone)) {
    throw new ValidationError('timezone', 'Timezone is required.');
  }
  if (!isNonEmptyString(input.chainId)) {
    throw new ValidationError('chainId', 'Chain ID is required.');
  }

  // Condition fields
  if (!isNonEmptyString(input.conditionType)) {
    throw new ValidationError('contractConditionType', 'Condition type is required.');
  }
  if (!isNonEmptyString(input.valueSourceType)) {
    throw new ValidationError('contractSourceType', 'Value source type is required.');
  }
  if (!isNonEmptyString(input.valueSourceUrl) || !isValidUrl(input.valueSourceUrl)) {
    throw new ValidationError('contractSourceUrl', 'Source URL is required and must be valid.');
  }
  if (input.conditionType === 'between') {
    if (input.upperLimit === undefined || input.lowerLimit === undefined || input.upperLimit === null || input.lowerLimit === null) {
      throw new ValidationError('contractLimits', 'Both upper and lower limits are required.');
    }
  } else {
    if (input.upperLimit === undefined || input.upperLimit === null) {
      throw new ValidationError('contractLimits', 'Value is required.');
    }
  }

  if (input.walletMode !== 'safe') {
    validateContractBasics(input.targetContractAddress, input.abi, input.targetFunction, 'contract');
  }

  const isDynamic = argType === 'dynamic' || argType === 2;
  if (isDynamic) {
    if (!isNonEmptyString(input.dynamicArgumentsScriptUrl) || !isValidUrl(input.dynamicArgumentsScriptUrl)) {
      throw new ValidationError('contractIpfs', 'IPFS Code URL is required and must be valid for dynamic argument type.');
    }
  } else {
    if (input.walletMode !== 'safe') {
      validateStaticArguments(input.abi as string, input.targetFunction as string, input.arguments, 'contract');
    }
  }
}

export function validateJobInput(jobInput: TimeBasedJobInput | EventBasedJobInput | ConditionBasedJobInput, argType?: 'static' | 'dynamic' | 1 | 2): void {
  if ('scheduleType' in jobInput) {
    validateTimeBasedJobInput(jobInput, argType);
  } else if ('triggerChainId' in jobInput) {
    validateEventBasedJobInput(jobInput, argType);
  } else {
    validateConditionBasedJobInput(jobInput, argType);
  }
}


