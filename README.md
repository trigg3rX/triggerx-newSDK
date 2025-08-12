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

