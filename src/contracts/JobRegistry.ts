import { ethers, Signer } from 'ethers';
import { createContractWithSdkRpcAndSigner, resolveChainId } from './contractUtils';

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
  // Resolve chain ID and create contract with SDK RPC provider
  const chainId = await resolveChainId(signer);
  const { contract, contractWithSigner } = await createContractWithSdkRpcAndSigner(
    contractAddress,
    abi,
    signer,
    chainId
  );

  // Use contractWithSigner for transaction (signing)
  // Use contract for reading/parsing logs (SDK RPC)
  const tx = await (contractWithSigner as any).createJob(jobTitle, jobType, timeFrame, targetContractAddress, encodedData);
  const receipt = await tx.wait();

  // Try to extract jobId from event logs (assume event is JobCreated(jobId,...))
  // Use contract (with SDK RPC) for parsing logs
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
  // Resolve chain ID and create contract with SDK RPC provider
  const chainId = await resolveChainId(signer);
  const { contractWithSigner } = await createContractWithSdkRpcAndSigner(
    contractAddress,
    abi.abi || abi,
    signer,
    chainId
  );

  const tx = await (contractWithSigner as any).deleteJob(jobId);
  await tx.wait();
} 