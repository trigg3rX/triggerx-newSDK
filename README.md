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

👉 To get your API key, visit: [https://app.triggerx.network/generate-api](https://app.triggerx.network/generate-api)

```

---

### 2. Create a Job

#### Supported Job Types

- `JobType.Time`: Interval or Cron-based triggers
- `JobType.Event`: Smart contract event-based triggers
- `JobType.Condition`: API or contract-based conditional triggers

#### Supported Argument Types

- `ArgType.Static`: Hardcoded values
- `ArgType.Dynamic`: Runtime values fetched from a script

---

#### 🕒 Example: Time-based Static Job

```ts
import { createJob, JobType, ArgType } from 'sdk-triggerx';

const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Static,
  jobTitle: 'My Time Job',
  timeFrame: 36,
  scheduleType: 'interval',
  timeInterval: 33,
  cronExpression: '0 0 * * *',
  specificSchedule: '2025-01-01 00:00:00',
  timezone: 'Asia/Calcutta',
  recurring: false,
  jobCostPrediction: 0.1,
  createdChainId: '11155420',
  targetChainId: '11155420',
  targetContractAddress: '0x...',
  targetFunction: 'incrementBy',
  abi: '[...]',
  isImua: true,
  arguments: ['3'],
  dynamicArgumentsScriptUrl: '',
  // if more TG needed auto top-up TG must true for automatially top up TG
  autotopupTG: true,
};

const signer = /* ethers.Signer instance */;
const result = await createJob(client, { jobInput, signer });
console.log(result);
```

---

#### 📟 Example: Event-based Dynamic Job

```ts
const jobInput = {
  jobType: JobType.Event,
  argType: ArgType.Dynamic,
  jobTitle: 'My Event Job',
  timeFrame: 36,
  recurring: true,
  jobCostPrediction: 0.2,
  timezone: 'Asia/Calcutta',
  createdChainId: '11155420',
  triggerChainId: '11155420',
  triggerContractAddress: '0x...',
  triggerEvent: 'CounterIncremented',
  targetChainId: '11155420',
  targetContractAddress: '0x...',
  targetFunction: 'incrementBy',
  abi: '[...]',
  arguments: [],
  dynamicArgumentsScriptUrl: 'https://your-ipfs-url',
  isImua: true,
  autotopupTG: true,
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

---

#### 📈 Example: Condition-based Static Job

```ts
const jobInput = {
  jobType: JobType.Condition,
  argType: ArgType.Static,
  jobTitle: 'My Condition Job',
  timeFrame: 36,
  recurring: false,
  jobCostPrediction: 0.3,
  timezone: 'Asia/Calcutta',
  createdChainId: '11155420',
  conditionType: 'greaterThan',
  upperLimit: 100,
  lowerLimit: 10,
  valueSourceType: 'api',
  valueSourceUrl: 'https://api.example.com/value',
  targetChainId: '11155420',
  targetContractAddress: '0x...',
  targetFunction: 'incrementBy',
  abi: '[...]',
  arguments: ['5'],
  dynamicArgumentsScriptUrl: '',
  isImua: true,
  autotopupTG: true,
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

## 🗂️ Project Structure

```
sdk-triggerx/
├── index.ts              # Entry point
├── client.ts             # Axios client wrapper
├── config.ts             # Config and environment loader
├── types.ts              # Shared interfaces and enums
├── api/                  # Backend API modules
├── contracts/            # Contract logic and ABIs
├── utils/                # Error and helper utilities
├── test/                 # Unit/integration tests
└── scripts/              # Example/test scripts
```

---

## ✅ Requirements

- Node.js ≥ 16
- ethers.js for signer interactions
- IPFS-hosted script for dynamic arguments (optional)

---

## 📝 License

**MIT License**

