export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// HTTP Status Code Types
export type HttpStatusCode = 
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

// API Error Code Types
export type ApiErrorCode = 
  // 4xx Client Errors
  | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'PAYMENT_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'NOT_ACCEPTABLE' | 'PROXY_AUTHENTICATION_REQUIRED' | 'REQUEST_TIMEOUT' | 'CONFLICT' | 'GONE' | 'LENGTH_REQUIRED' | 'PRECONDITION_FAILED' | 'PAYLOAD_TOO_LARGE' | 'URI_TOO_LONG' | 'UNSUPPORTED_MEDIA_TYPE' | 'RANGE_NOT_SATISFIABLE' | 'EXPECTATION_FAILED' | 'IM_A_TEAPOT' | 'MISDIRECTED_REQUEST' | 'UNPROCESSABLE_ENTITY' | 'LOCKED' | 'FAILED_DEPENDENCY' | 'TOO_EARLY' | 'UPGRADE_REQUIRED' | 'PRECONDITION_REQUIRED' | 'TOO_MANY_REQUESTS' | 'REQUEST_HEADER_FIELDS_TOO_LARGE' | 'UNAVAILABLE_FOR_LEGAL_REASONS'
  // 5xx Server Errors
  | 'INTERNAL_SERVER_ERROR' | 'NOT_IMPLEMENTED' | 'BAD_GATEWAY' | 'SERVICE_UNAVAILABLE' | 'GATEWAY_TIMEOUT' | 'HTTP_VERSION_NOT_SUPPORTED' | 'VARIANT_ALSO_NEGOTIATES' | 'INSUFFICIENT_STORAGE' | 'LOOP_DETECTED' | 'NOT_EXTENDED' | 'NETWORK_AUTHENTICATION_REQUIRED'
  // Custom API Errors
  | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'INSUFFICIENT_FUNDS' | 'INVALID_SIGNATURE' | 'TRANSACTION_FAILED' | 'CONTRACT_REVERT' | 'GAS_ESTIMATION_FAILED' | 'NONCE_TOO_LOW' | 'NONCE_TOO_HIGH' | 'REPLACEMENT_UNDERPRICED' | 'UNKNOWN_ERROR';

// Error response types with comprehensive error codes
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: ApiErrorCode;
  httpStatusCode?: HttpStatusCode;
  errorType: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR';
  details?: any;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

// Enums for job type and argument type
export enum JobType {
  Time = 'time',
  Event = 'event',
  Condition = 'condition',
}

export enum ArgType {
  Static = 'static',
  Dynamic = 'dynamic',
}

export type WalletMode = 'regular' | 'safe';

// Discriminated union for job input
export type CreateJobInput =
  | (TimeBasedJobInput & { jobType: JobType.Time; argType: ArgType.Static | ArgType.Dynamic })
  | (EventBasedJobInput & { jobType: JobType.Event; argType: ArgType.Static | ArgType.Dynamic })
  | (ConditionBasedJobInput & { jobType: JobType.Condition; argType: ArgType.Static | ArgType.Dynamic });

// User-facing input types (without jobType/argType)
export interface TimeBasedJobInput {
  jobTitle: string;
  timeFrame: number;
  scheduleType: 'cron' | 'specific' | 'interval';
  timeInterval?: number; // required only if scheduleType === 'interval'
  cronExpression?: string; // required only if scheduleType === 'cron'
  specificSchedule?: string; // required only if scheduleType === 'specific'
  timezone: string;
  // recurring removed for time-based jobs; always false
  chainId: string; // single chain input; used for created/target
  targetContractAddress?: string; // optional in safe mode
  targetFunction?: string;        // optional in safe mode
  abi?: string;                   // optional in safe mode
  isImua?: boolean;
  arguments?: string[];
  dynamicArgumentsScriptUrl?: string;
  autotopupTG?: boolean;
  // wallet selection
  walletMode?: WalletMode; // default: 'regular'
  /**
   * The Safe address to use when walletMode is 'safe'.
   * Required if walletMode is 'safe'.
   */
  safeAddress: string;
}

export interface EventBasedJobInput {
  jobTitle: string;
  timeFrame: number;
  triggerChainId: string;
  triggerContractAddress: string;
  triggerEvent: string;
  timezone: string;
  recurring?: boolean;
  chainId: string; // used for created/trigger/target chains
  targetContractAddress?: string; // optional in safe mode
  targetFunction?: string;        // optional in safe mode
  abi?: string;                   // optional in safe mode
  isImua?: boolean;
  arguments?: string[];
  dynamicArgumentsScriptUrl?: string;
  autotopupTG?: boolean;
  // wallet selection
  walletMode?: WalletMode; // default: 'regular'
  /**
   * The Safe address to use when walletMode is 'safe'.
   * Required if walletMode is 'safe'.
   */
  safeAddress: string;
}

export interface ConditionBasedJobInput {
  jobTitle: string;
  timeFrame: number;
  conditionType: 'greater_than' | 'less_than' | 'between' | 'equals' | 'not_equals' | 'greater_equal' | 'less_equal';
  upperLimit: number;
  lowerLimit: number;
  valueSourceType: string;
  valueSourceUrl: string;
  timezone: string;
  recurring?: boolean;
  chainId: string; // used for created/target chains
  targetContractAddress?: string; // optional in safe mode
  targetFunction?: string;        // optional in safe mode
  abi?: string;                   // optional in safe mode
  isImua?: boolean;
  arguments?: string[];
  dynamicArgumentsScriptUrl?: string;
  autotopupTG?: boolean;
  // wallet selection
  walletMode?: WalletMode; // default: 'regular'
  /**
   * The Safe address to use when walletMode is 'safe'.
   * Required if walletMode is 'safe'.
   */
  safeAddress: string;
}

// Internal type matching backend struct
export interface CreateJobData {
  job_id: string;
  user_address: string;
  ether_balance: BigInt | number;
  token_balance: BigInt | number;
  job_title: string;
  task_definition_id: number;
  custom: boolean;
  time_frame: number;
  recurring: boolean;
  job_cost_prediction: number;
  timezone: string;
  created_chain_id: string;
  schedule_type?: string;
  time_interval?: number;
  cron_expression?: string;
  specific_schedule?: string;
  trigger_chain_id?: string;
  trigger_contract_address?: string;
  trigger_event?: string;
  condition_type?: string;
  upper_limit?: number;
  lower_limit?: number;
  value_source_type?: string;
  value_source_url?: string;
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string;
  arg_type: number;
  arguments?: string[];
  dynamic_arguments_script_url?: string;
  is_imua: boolean;
}

export interface JobResponse {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: ApiErrorCode;
  httpStatusCode?: HttpStatusCode;
  errorType?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR';
  details?: any;
}

// Types matching backend JobResponseAPI
export interface JobDataAPI {
  job_id: string; // Assuming BigIntString is represented as a string in TypeScript
  job_title: string;
  task_definition_id: number;
  user_id: number; // Assuming int64 is represented as number
  link_job_id: string; // Assuming BigIntString is represented as a string
  chain_status: number;
  custom: boolean;
  time_frame: number; // Assuming int64 is represented as number
  recurring: boolean;
  status: string;
  job_cost_prediction: number;
  job_cost_actual: number;
  task_ids: number[]; // Assuming []int64 is represented as number[]
  created_at: Date; // Assuming time.Time is represented as Date
  updated_at: Date; // Assuming time.Time is represented as Date
  last_executed_at: Date; // Assuming time.Time is represented as Date
  timezone: string;
  is_imua: boolean;
  created_chain_id: string;
}

export interface TimeJobData {
  job_id: string; // Assuming *big.Int is represented as string
  task_definition_id: number;
  expiration_time: Date; // Assuming time.Time is represented as Date
  created_at: Date; // Assuming time.Time is represented as Date
  updated_at: Date; // Assuming time.Time is represented as Date
  time_interval: number; // Assuming int64 is represented as number
  schedule_type: string;
  cron_expression: string;
  specific_schedule: string;
  timezone: string;
  next_execution_timestamp: Date; // Assuming time.Time is represented as Date
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string;
  arg_type: number;
  arguments: string[];
  dynamic_arguments_script_url: string;
  is_completed: boolean;
  is_active: boolean;
}

export interface EventJobData {
  job_id: string; // Assuming *big.Int is represented as string
  task_definition_id: number;
  expiration_time: Date; // Assuming time.Time is represented as Date
  created_at: Date; // Assuming time.Time is represented as Date
  updated_at: Date; // Assuming time.Time is represented as Date
  recurring: boolean;
  trigger_chain_id: string;
  trigger_contract_address: string;
  trigger_event: string;
  timezone: string;
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string;
  arg_type: number;
  arguments: string[];
  dynamic_arguments_script_url: string;
  is_completed: boolean;
  is_active: boolean;
}

export interface ConditionJobData {
  job_id: string; // Assuming *big.Int is represented as string
  task_definition_id: number;
  expiration_time: Date; // Assuming time.Time is represented as Date
  created_at: Date; // Assuming time.Time is represented as Date
  updated_at: Date; // Assuming time.Time is represented as Date
  recurring: boolean;
  condition_type: string;
  upper_limit: number;
  lower_limit: number;
  value_source_type: string;
  value_source_url: string;
  timezone: string;
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string;
  arg_type: number;
  arguments: string[];
  dynamic_arguments_script_url: string;
  is_completed: boolean;
  is_active: boolean;
}

export interface JobResponseUser {
  success: boolean;
  error?: string;
  errorCode?: ApiErrorCode;
  httpStatusCode?: HttpStatusCode;
  errorType?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR';
  details?: any;
  jobs?: JobResponseAPI
}

export interface JobResponseAPI {
  job_data?: JobDataAPI;
  time_job_data?: TimeJobData;
  event_job_data?: EventJobData;
  condition_job_data?: ConditionJobData;
}

// New interface for user data response
export interface UserData {
  user_id: number; // Assuming int64 is represented as number
  user_address: string;
  job_ids: string[]; // Assuming job IDs are represented as strings
  ether_balance: BigInt | number;
  token_balance: BigInt | number;
  user_points: number;
  total_jobs: number; // Assuming int64 is represented as number
  total_tasks: number; // Assuming int64 is represented as number
  created_at: Date; // Assuming time.Time is represented as Date
  last_updated_at: Date; // Assuming time.Time is represented as Date
  email: string; // Assuming email_id is represented as string
}

// Interface for task data (logs) from the tasks API
export interface TaskData {
  task_id: number; // int64
  task_number: number; // int64
  task_opx_cost: number; // float64
  execution_timestamp: Date; // time.Time
  execution_tx_hash: string;
  task_performer_id: number; // int64
  task_attester_ids: number[]; // []int64
  is_accepted: boolean;
  tx_url: string;
  task_status: string;
}

// Combined interface for job data with task data
export interface JobDataWithTasks {
  jobData: JobDataAPI;
  taskData: TaskData[];
}
