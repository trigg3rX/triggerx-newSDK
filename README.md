# 🚀 TriggerX SDK

**SDK for interacting with the TriggerX backend and smart contracts.**  
Supports job automation on EVM-compatible chains using time, event, or condition-based triggers.

---

## ✨ Features

- 🔧 Easy API integration for job and user management
- 🔗 Smart contract interaction for job creation and deletion
- 📅 Supports time-based, event-based, and condition-based jobs
- 🔐 TypeScript support with clean types
- 🧠 Dynamic argument fetching via external scripts (e.g., IPFS)
- 🛡️ Safe (Gnosis Safe) wallet integration with support for:
  - Static single transactions (e.g., ETH transfers)
  - Static batch transactions (e.g., DeFi operations like token approvals + swaps)
  - Dynamic runtime arguments via IPFS scripts

---

## 📦 Installation

```bash
npm install sdk-triggerx
```

---

## 🛠️ Usage Guide

### 1. Initialize the Client

```ts
import { TriggerXClient } from 'sdk-triggerx';

const client = new TriggerXClient('YOUR_API_KEY');
```

- To get your API key, visit: [Generate API Key](https://app.triggerx.network/generate-api)

---

### 2. Create a Job

#### Supported Job Types

- `JobType.Time`: Interval or Cron-based triggers
- `JobType.Event`: Smart contract event-based triggers
- `JobType.Condition`: API or contract-based conditional triggers

#### Supported Argument Types

- `ArgType.Static`: Hardcoded values
- `ArgType.Dynamic`: Runtime values fetched from a script

#### Wallet Modes

- `walletMode: 'regular'` (default): Executes jobs from the externally-owned account (EOA) signer.
- `walletMode: 'safe'`: Executes jobs via a Safe wallet using the TriggerX Safe Module.
  - Requirements:
    - Safe threshold must be 1 (single-signer) in this implementation.
    - The signer must be an owner of the Safe.
    - Supports both static transactions (`safeTransactions` array) and dynamic arguments (`dynamicArgumentsScriptUrl`).
    - The SDK will auto-enable the TriggerX Safe Module on the Safe if not already enabled.
  - Static transactions:
    - Single transaction: Provide one transaction in `safeTransactions` array (operation: CALL).
    - Batch transactions: Provide multiple transactions in `safeTransactions` array (uses Safe MultiSend with DELEGATECALL).

#### Supported Condition Types (for `conditionType`)

- `greater_than`
- `less_than`
- `between`
- `equals`
- `not_equals`
- `greater_equal`
- `less_equal`

---

#### 🕒 Example: Time-based Static Job

```ts
import { createJob, JobType, ArgType } from 'sdk-triggerx';

const jobInput = {
  jobType: JobType.Time,               // Job type discriminator
  argType: ArgType.Static,             // Static or Dynamic arguments

  jobTitle: 'My Time Job',             // Human-readable job title
  timeFrame: 36,                       // Duration the job stays active (seconds)
  scheduleType: 'interval',            // 'interval' | 'cron' | 'specific'
  timeInterval: 33,                    // Required if scheduleType = 'interval' (seconds)
  // cronExpression: '0 0 * * *',      // Required if scheduleType = 'cron' (CRON string)
  // specificSchedule: '2025-01-01 00:00:00', // Required if scheduleType = 'specific' (datetime)
  timezone: 'Asia/Calcutta',           // IANA timezone for scheduling

  chainId: '11155420',                 // EVM chain for creation/target
  targetContractAddress: '0x...',      // Target contract to call
  targetFunction: 'incrementBy',       // Target function name
  abi: '[...]',                        // JSON ABI string for target contract

  isImua: false,                        // Optional feature flag
  arguments: ['3'],                    // Target function args as strings
  dynamicArgumentsScriptUrl: '',       // If ArgType.Dynamic, provide IPFS/URL here
  autotopupTG: true,                   // Auto top-up TG if balance is low
};

const signer = /* ethers.Signer instance */;
const result = await createJob(client, { jobInput, signer });
console.log(result);
```

---

#### 🧷 Example: Time-based Dynamic Job via Safe Wallet (Arbitrum Sepolia)

```ts
import { createJob, JobType, ArgType } from 'sdk-triggerx';

const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Dynamic,

  jobTitle: 'My Safe Time Job',
  timeFrame: 3600,
  scheduleType: 'interval',
  timeInterval: 300,
  timezone: 'UTC',

  // Arbitrum Sepolia
  chainId: '421614',

  // Safe mode (no target required — SDK auto-sets module target/function/ABI)
  walletMode: 'safe',
  safeAddress: '0xYourSafeAddress', // Required: provide your Safe address

  // Dynamic params fetched from IPFS/URL script at execution time
  dynamicArgumentsScriptUrl: 'https://your-ipfs-gateway/ipfs/your-hash',
  language:'', //Your code language exmampel->  language:'go',

  // Optional helper to auto-top up TG if low
  autotopupTG: true,
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

Notes for Safe wallet mode:
- In Safe mode, you do NOT need to set `targetContractAddress`/`targetFunction`/`abi` — the SDK sets these for the Safe Module and uses `execJobFromHub(address,address,uint256,bytes,uint8)` under the hood.
- For dynamic jobs: your action details (action target/value/data/op) must be produced by your IPFS script at execution time.
- For static jobs: use the `safeTransactions` array to provide hardcoded transaction details (see Safe Wallet Flow section below).

---

#### 📟 Example: Event-based Dynamic Job

```ts
const jobInput = {
  jobType: JobType.Event,                // Job type discriminator
  argType: ArgType.Dynamic,              // Dynamic arguments fetched via script

  jobTitle: 'My Event Job',              // Human-readable job title
  timeFrame: 36,                         // Duration the job stays active (seconds)
  recurring: true,                       // Whether the event job recurs
  timezone: 'Asia/Calcutta',             // IANA timezone (for metadata)

  chainId: '11155420',                   // EVM chain for creation/target
  triggerChainId: '11155420',            // Chain where the event is emitted
  triggerContractAddress: '0x...',       // Event-emitting contract address
  triggerEvent: 'CounterIncremented',    // Event name to watch

  targetContractAddress: '0x...',        // Target contract to call
  targetFunction: 'incrementBy',         // Target function name
  abi: '[...]',                          // JSON ABI for target contract

  arguments: [],                         // Target function args as strings
  dynamicArgumentsScriptUrl: 'https://your-ipfs-url', // Script URL for dynamic args
  language:'', //Your code language exmampel->  language:'go',
  isImua: false,                          // Optional feature flag
  autotopupTG: true,                     // Auto top-up TG if balance is low
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

---

#### 📈 Example: Condition-based Static Job

```ts
const jobInput = {
  jobType: JobType.Condition,           // Job type discriminator
  argType: ArgType.Static,              // Static arguments

  jobTitle: 'My Condition Job',         // Human-readable job title
  timeFrame: 36,                        // Duration the job stays active (seconds)
  recurring: false,                     // Whether the condition job recurs
  timezone: 'Asia/Calcutta',            // IANA timezone (for metadata)

  chainId: '11155420',                  // EVM chain for creation/target
  conditionType: 'greater_than',        // One of the supported condition types 'greater_than' | 'less_than' |'between' | 'equals' | 'not_equals' | 'greater_equal' | 'less_equal'
  upperLimit: 100,                      // Upper threshold
  lowerLimit: 10,                       // Lower threshold
  valueSourceType: 'api',               // 'api'
  valueSourceUrl: 'https://api.example.com/value', // Source URL for condition

  targetContractAddress: '0x...',       // Target contract to call
  targetFunction: 'incrementBy',        // Target function name
  abi: '[...]',                         // JSON ABI for target contract

  arguments: ['5'],                     // Target function args as strings
  dynamicArgumentsScriptUrl: '',        // If ArgType.Dynamic, provide IPFS/URL here
  isImua: false,                         // Optional feature flag
  autotopupTG: true,                    // Auto top-up TG if balance is low
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

---

### 🛡️ Safe Wallet (Gnosis Safe) Flow

To create jobs that use Safe wallets (`walletMode: 'safe'`), you must first create a Safe and obtain its address. The Safe MUST exist before the job can be created.

#### 1️⃣ Create a Safe wallet for your user

```ts
import { createSafeWallet } from 'sdk-triggerx/api/safeWallet';
const safeAddress = await createSafeWallet(signer /* ethers.Signer */);
console.log('Your Safe address:', safeAddress);
```

- Use this new address in safe job creation. All safe wallet creation belongs in this flow.
- You can use the returned address in any number of jobs for this user.
- This MUST be done before you attempt to create any job with `walletMode: 'safe'`.
- All safe wallet creation helpers are now in the dedicated `api/safeWallet` module so your file structure stays clean.

#### 2️⃣ Create a job using the Safe

Safe wallet jobs support two modes: **static transactions** and **dynamic arguments**.

##### Option A: Static Single Transaction (e.g., ETH transfer)

```ts
const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Static, // Static for hardcoded transactions
  jobTitle: 'Safe ETH Transfer',
  timeFrame: 3600,
  scheduleType: 'interval',
  timeInterval: 300,
  timezone: 'UTC',
  chainId: '421614',
  walletMode: 'safe',
  safeAddress: '0xYourSafeAddress', // from step 1
  safeTransactions: [
    {
      to: '0xRecipientAddress',
      value: '10000000000000', // 0.00001 ETH in wei
      data: '0x' // empty for simple ETH transfer
    }
  ],
  autotopupTG: true,
};

await createJob(client, { jobInput, signer });
```

##### Option B: Static Batch Transactions (e.g., Uniswap Swap)

For complex multi-step operations like token approvals + swaps:

```ts
import { ethers } from 'ethers';

// Token addresses (Arbitrum Sepolia)
const USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const WETH = '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73';
const UNISWAP_ROUTER = '0x101F443B4d1b059569D643917553c771E1b9663E';

// Encode approve transaction
const erc20Interface = new ethers.Interface([
  'function approve(address spender, uint256 amount) returns (bool)'
]);
const approveData = erc20Interface.encodeFunctionData('approve', [
  UNISWAP_ROUTER,
  '10000' // 0.01 USDC (6 decimals)
]);

// Encode Uniswap V3 swap transaction
const swapInterface = new ethers.Interface([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
]);
const swapData = swapInterface.encodeFunctionData('exactInputSingle', [{
  tokenIn: USDC,
  tokenOut: WETH,
  fee: 3000, // 0.3%
  recipient: safeAddress, // Safe receives the output
  amountIn: '10000',
  amountOutMinimum: '0',
  sqrtPriceLimitX96: 0
}]);

const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Static,
  jobTitle: 'Safe Uniswap Swap',
  timeFrame: 3600,
  scheduleType: 'interval',
  timeInterval: 600,
  timezone: 'UTC',
  chainId: '421614',
  walletMode: 'safe',
  safeAddress: '0xYourSafeAddress',
  safeTransactions: [
    {
      to: USDC, // Approve USDC to router
      value: '0',
      data: approveData
    },
    {
      to: UNISWAP_ROUTER, // Execute swap
      value: '0',
      data: swapData
    }
  ],
  autotopupTG: true,
};

await createJob(client, { jobInput, signer });
```

**Note:** When multiple transactions are provided in `safeTransactions`, the SDK automatically:
- Encodes them using Safe's MultiSend format
- Wraps them with the `multiSend(bytes)` function call
- Sets the operation to DELEGATECALL for batch execution

##### Option C: Dynamic Arguments

For runtime-determined parameters:

```ts
const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Dynamic,
  jobTitle: 'Dynamic Safe Job',
  timeFrame: 3600,
  scheduleType: 'interval',
  timeInterval: 300,
  timezone: 'UTC',
  chainId: '421614',
  walletMode: 'safe',
  safeAddress: '0xYourSafeAddress',
  dynamicArgumentsScriptUrl: 'https://your-ipfs-gateway/ipfs/your-hash',
  language:'go', //Your code language exmampel->  language:'go',
  autotopupTG: true,
};

await createJob(client, { jobInput, signer });
```

- The `safeAddress` property is required for all Safe wallet jobs.
- For static jobs, provide `safeTransactions` array with transaction details.
- For dynamic jobs, provide `dynamicArgumentsScriptUrl` that returns the action parameters at execution time.

---

### 3. Fetch Job Data

#### 🔍 Get All Jobs

```ts
import { getJobData } from 'sdk-triggerx';

const jobs = await getJobData(client);
console.log(jobs);
```

#### 🔎 Get Job by ID

```ts
import { getJobDataById } from 'sdk-triggerx';

const jobId = 'YOUR_JOB_ID';
const userAddress = '0x...'; // The address that owns the job
const jobData = await getJobDataById(client, jobId, userAddress);
console.log(jobData);
```

> **Note:** The job data API now requires both the `jobId` and the user’s address as parameters. Passing both is mandatory; otherwise, you will receive a validation error from the backend.

---

#### 📋 Get All Jobs for a User Address

```ts
import { getJobsByUserAddress } from 'sdk-triggerx';

const userAddress = '0x...';
const jobsByUser = await getJobsByUserAddress(client, userAddress);
console.log(jobsByUser);
```

> **Note:** This fetches all jobs belonging to the specified user address from the `/api/jobs/user/:user_address` endpoint.

---

### 4. Delete a Job

```ts
import { deleteJob } from 'sdk-triggerx';

const jobId = 'YOUR_JOB_ID';
await deleteJob(client, jobId);
console.log('Job deleted');
```

---

### 5. Get User Data

```ts
import { getUserData } from 'sdk-triggerx';

const userAddress = '0x...';
const userData = await getUserData(client, userAddress);
console.log(userData);
```

---

## 📘 API Reference

All input and output types are defined in:

```
src/types.ts
```

Includes:

- `JobInput`, `JobType`, `ArgType`
- `ConditionType`, `ScheduleType`
- `UserData`, `JobData`, etc.
- `SafeTransaction` - Interface for Safe wallet transaction objects:
  ```ts
  interface SafeTransaction {
    to: string;        // Target contract address
    value: string;     // Value in wei (as string)
    data: string;      // Encoded function call data (hex with 0x prefix)
  }
  ```

---


## ✅ Requirements

- Node.js ≥ 16
- ethers.js for signer interactions
- IPFS-hosted script for dynamic arguments (optional)

---

## 📝 License

**MIT License**


