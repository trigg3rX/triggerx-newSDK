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
    - Parameters must be dynamic (provided by `dynamicArgumentsScriptUrl`).
    - The SDK will auto-create a Safe if `safeAddress` is not provided and the chain is configured with a Safe Factory.
    - The SDK will auto-enable the TriggerX Safe Module on the Safe if not already enabled.

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
  // Optional: provide an existing Safe; otherwise the SDK will create one for you
  // safeAddress: '0xYourSafeAddress',

  // Dynamic params must come from an IPFS/URL script
  dynamicArgumentsScriptUrl: 'https://your-ipfs-gateway/ipfs/your-hash',

  // Optional helper to auto-top up TG if low
  autotopupTG: true,
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

Notes for Safe wallet mode:
- In Safe mode, you do NOT need to set `targetContractAddress`/`targetFunction`/`abi` — the SDK sets these for the Safe Module and uses `execJobFromHub(address,address,uint256,bytes,uint8)` under the hood.
- Your action details (action target/value/data/op) must be produced by your IPFS script at execution time.
- No static arguments are allowed in Safe mode.

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
import { createSafeWallet } from 'sdk-triggerx/api/safeWallet'; // <--- new dedicated helper!
const safeAddress = await createSafeWallet(signer /* ethers.Signer */);
console.log('Your Safe address:', safeAddress);
```

- Use this new address in safe job creation. All safe wallet creation belongs in this flow.
- You can use the returned address in any number of jobs for this user.
- This MUST be done before you attempt to create any job with `walletMode: 'safe'`.
- All safe wallet creation helpers are now in the dedicated `api/safeWallet` module so your file structure stays clean.

#### 2️⃣ Create a job using the Safe (walletMode: 'safe')

```ts
const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Dynamic, // required in safe mode
  jobTitle: 'Safe Job',
  timeFrame: 3600,
  scheduleType: 'interval',
  timeInterval: 300,
  timezone: 'UTC',
  chainId: '421614',
  walletMode: 'safe',
  safeAddress, // <---- required and must come from step 1
  dynamicArgumentsScriptUrl: 'https://your-ipfs-gateway/ipfs/your-hash',
  autotopupTG: true,
};
// ...
await createJob(client, { jobInput, signer }); // as normal
```

- The `safeAddress` property is now required for jobs using `walletMode: 'safe'`.
- The SDK will no longer auto-create a Safe wallet for you; you must explicitly create and pass it in your job input.

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
const jobData = await getJobDataById(client, jobId);
console.log(jobData);
```

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

---


## ✅ Requirements

- Node.js ≥ 16
- ethers.js for signer interactions
- IPFS-hosted script for dynamic arguments (optional)

---

## 📝 License

**MIT License**

