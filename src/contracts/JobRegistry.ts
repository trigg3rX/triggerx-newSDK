import { ethers, Signer } from 'ethers';
import { createContractWithSdkRpcAndSigner, resolveChainId, waitForTransactionReceiptWithRpcFallback } from './contractUtils';

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
  const { contract, contractWithSigner, rpcProvider } = await createContractWithSdkRpcAndSigner(
    contractAddress,
    abi,
    signer,
    chainId
  );
  const signerAddress = await signer.getAddress();

  let tx;
  try {
    console.log('Estimating gas for createJob using SDK RPC provider...');
    const estimatedGas: bigint = await (contract as any).createJob.estimateGas(
      jobTitle,
      jobType,
      timeFrame,
      targetContractAddress,
      encodedData,
      {
        from: signerAddress,
      }
    );
    console.log('Estimated gas (createJob):', estimatedGas.toString());
    const gasWithBuffer = (estimatedGas * BigInt(110)) / BigInt(100);
    console.log('Gas with 10% buffer (createJob):', gasWithBuffer.toString());

    // Use contractWithSigner for transaction (signing)
    // Use contract for reading/parsing logs (SDK RPC)
    tx = await (contractWithSigner as any).createJob(
      jobTitle,
      jobType,
      timeFrame,
      targetContractAddress,
      encodedData,
      {
        gasLimit: gasWithBuffer,
      }
    );
  } catch (gasEstimateError) {
    console.warn(
      'Gas estimation failed for createJob (using SDK RPC), proceeding without explicit gas limit:',
      gasEstimateError
    );
    tx = await (contractWithSigner as any).createJob(
      jobTitle,
      jobType,
      timeFrame,
      targetContractAddress,
      encodedData
    );
  }
  const receipt = await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);

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
  const { contract, contractWithSigner, rpcProvider } = await createContractWithSdkRpcAndSigner(
    contractAddress,
    abi.abi || abi,
    signer,
    chainId
  );
  const signerAddress = await signer.getAddress();

  try {
    console.log('Estimating gas for deleteJob using SDK RPC provider...');
    const estimatedGas: bigint = await (contract as any).deleteJob.estimateGas(jobId, {
      from: signerAddress,
    });
    console.log('Estimated gas (deleteJob):', estimatedGas.toString());
    const gasWithBuffer = (estimatedGas * BigInt(110)) / BigInt(100);
    console.log('Gas with 10% buffer (deleteJob):', gasWithBuffer.toString());

    const tx = await (contractWithSigner as any).deleteJob(jobId, {
      gasLimit: gasWithBuffer,
    });
    await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);
  } catch (gasEstimateError) {
    console.warn(
      'Gas estimation failed for deleteJob (using SDK RPC), proceeding without explicit gas limit:',
      gasEstimateError
    );
    const tx = await (contractWithSigner as any).deleteJob(jobId);
    await waitForTransactionReceiptWithRpcFallback(tx, rpcProvider);
  }
}
