import { ethers, Signer } from 'ethers';

export interface CreateJobOnChainParams {
  jobTitle: string;
  jobType: number;
  timeFrame: number;
  targetContractAddress: string;
  encodedData: string;
  contractAddress: string;
  abi: any;
  signer: Signer;
}

export interface DeleteJobOnChainParams {
  jobId: string;
  contractAddress: string;
  abi: any;
  signer: Signer;
}

export async function createJobOnChain({
  jobTitle,
  jobType,
  timeFrame,
  targetContractAddress,
  encodedData,
  contractAddress,
  abi,
  signer,
}: CreateJobOnChainParams): Promise<string> {
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const tx = await contract.createJob(jobTitle, jobType, timeFrame, targetContractAddress, encodedData);
  const receipt = await tx.wait();

  // Try to extract jobId from event logs (assume event is JobCreated(jobId,...))
  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e && e.name === 'JobCreated');

  if (event && event.args && event.args[0]) {
    return event.args[0].toString();
  }

  throw new Error('Job ID not found in contract events');
}

export async function deleteJobOnChain({
  jobId,
  contractAddress,
  abi,
  signer,
}: DeleteJobOnChainParams): Promise<void> {
  const contract = new ethers.Contract(contractAddress, abi.abi, signer);

  const tx = await contract.deleteJob(jobId);
  await tx.wait();
} 