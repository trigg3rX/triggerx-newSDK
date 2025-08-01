# sdk-triggerx

SDK for interacting with the TriggerX backend and smart contracts.

## Features

- Easy API integration for job and user management
- Smart contract interaction for job creation
- TypeScript support
- Supports time-based, event-based, and condition-based jobs

## Installation

```bash
npm install sdk-triggerx
```

## Usage

### 1. Initialize the Client

```typescript
import { TriggerXClient } from 'sdk-triggerx';

const client = new TriggerXClient('YOUR_API_KEY');
```

### 2. Create a Job

The SDK supports three types of jobs:

- **Time-based jobs** (static/dynamic arguments)
- **Event-based jobs** (static/dynamic arguments)
- **Condition-based jobs** (static/dynamic arguments)

#### Example: Time-based Static Job

```typescript
import { createJob, JobType, ArgType } from 'sdk-triggerx';

const jobInput = {
  jobType: JobType.Time,
  argType: ArgType.Static,
  userAddress: '0x...',
  etherBalance: 10000000000000000,
  tokenBalance: 10000000000000000000,
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
};

const signer = /* ethers.Signer instance */;
const result = await createJob(client, { jobInput, signer });
console.log(result);
```

#### Example: Event-based Dynamic Job

```typescript
const jobInput = {
  jobType: JobType.Event,
  argType: ArgType.Dynamic,
  userAddress: '0x...',
  etherBalance: 10000000000000000,
  tokenBalance: 10000000000000000000,
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
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

#### Example: Condition-based Job

```typescript
const jobInput = {
  jobType: JobType.Condition,
  argType: ArgType.Static,
  userAddress: '0x...',
  etherBalance: 10000000000000000,
  tokenBalance: 10000000000000000000,
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
};

const result = await createJob(client, { jobInput, signer });
console.log(result);
```

### 3. Get Job Data

- **Get all jobs for API key:**

```typescript
import { getJobData } from 'sdk-triggerx';

const jobs = await getJobData(client);
console.log(jobs);
```

- **Get job data by ID:**

```typescript
import { getJobDataById } from 'sdk-triggerx';

const jobId = 'YOUR_JOB_ID';
const jobData = await getJobDataById(client, jobId);
console.log(jobData);
```

### 4. Delete a Job

```typescript
import { deleteJob } from 'sdk-triggerx';

const jobId = 'YOUR_JOB_ID';
await deleteJob(client, jobId);
console.log('Job deleted');
```

### 5. Get User Data

```typescript
import { getUserData } from 'sdk-triggerx';

const userAddress = '0x...';
const userData = await getUserData(client, userAddress);
console.log(userData);
```

### 6. Task Management

- **Get tasks:**

```typescript
import { getTasks } from 'sdk-triggerx';

const tasks = await getTasks(client);
console.log(tasks);
```

- **Create a task:**

```typescript
import { createTask } from 'sdk-triggerx';

const task = { name: 'My Task' };
const createdTask = await createTask(client, task);
console.log(createdTask);
```

## API Reference

See [src/types.ts](src/types.ts) for all input and output types.

## Project Structure

```
src/
  index.ts           # Entry point
  client.ts          # API Client (Axios wrapper)
  config.ts          # Config management
  types.ts           # Shared interfaces/types
  api/               # API modules
  contracts/         # Contract logic & ABIs
  utils/             # Utilities (errors, etc.)
test/                # Tests
scripts/             # Utility scripts
```

## License

MIT