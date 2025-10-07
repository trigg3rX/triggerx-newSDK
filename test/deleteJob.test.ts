// sdk-triggerx/test/deleteJob.test.ts

import { TriggerXClient } from '../src/client';
import { deleteJob } from '../src/api/deleteJob';
import { ethers } from 'ethers';

async function main() {
  // The user should provide their actual API key here
  const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8';
  
  // Create the client with the API key
  const client = new TriggerXClient(apiKey);
  
  // Specify the job ID to delete
  const jobId = ''; // Replace with an actual job ID for testing
  const privateKey = '';
  const providerUrl = 'https://sepolia.optimism.io';
  
  // Create provider with better configuration
  const provider = new ethers.JsonRpcProvider(providerUrl, undefined, {
    staticNetwork: true,
    polling: true,
    pollingInterval: 1000,
  });
  
  // Add retry logic for provider connection
  let signer: ethers.Wallet;
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`Attempting to connect to provider (${4 - retries}/3)...`);
      await provider.getNetwork();
      signer = new ethers.Wallet(privateKey, provider);
      console.log('Provider connection successful');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error(`Failed to connect to provider after 3 attempts: ${error}`);
      }
      console.log(`Provider connection failed, retrying in 2 seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  const chainId = '11155420';

  try {
    // Call the SDK function to delete the job
    await deleteJob(client, jobId, signer!, chainId);
    console.log(`Job with ID ${jobId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting job:', error);
  }
}

main().catch(console.error);
