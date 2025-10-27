import { ethers, Signer } from 'ethers';

// Minimal Safe ABI fragments used in this SDK
export const SAFE_ABI = [
  // module checks
  "function isModuleEnabled(address module) view returns (bool)",
  // module management
  "function enableModule(address module)",
  // EIP-712 domain separator for Safe
  "function domainSeparator() view returns (bytes32)",
  // Safe nonce
  "function nonce() view returns (uint256)",
  // Exec transaction (self-call to enable module)
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) returns (bool)",
  // Owners and threshold, to validate single signer safes
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
  // Add getTransactionHash for onchain hash calculation
  "function getTransactionHash(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce) view returns (bytes32)"
];

// Safe EIP-712 typehash for transactions
export const SAFE_TX_TYPEHASH = ethers.id(
  "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 _nonce)"
);

export async function isSafeModuleEnabled(safeAddress: string, provider: ethers.Provider, moduleAddress: string): Promise<boolean> {
  const safe = new ethers.Contract(safeAddress, SAFE_ABI, provider);
  return await safe.isModuleEnabled(moduleAddress);
}

export async function ensureSingleOwnerAndMatchSigner(safeAddress: string, provider: ethers.Provider, signerAddress: string): Promise<void> {
  const safe = new ethers.Contract(safeAddress, SAFE_ABI, provider);
  const [owners, threshold] = await Promise.all([
    safe.getOwners(),
    safe.getThreshold(),
  ]);
  if (Number(threshold) !== 1) {
    throw new Error('Safe wallet must have threshold 1');
  }
  // Check if signerAddress matches any of the Safe owners
  const normalizedSigner = signerAddress.toLowerCase();
  const normalizedOwners = owners.map((owner: string) => owner.toLowerCase());
  if (!normalizedOwners.includes(normalizedSigner)) {
    throw new Error('Signer is not an owner of the Safe wallet');
  }
  if (owners[0].toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Signer must be the sole owner of the Safe wallet');
  }
}

// Enable provided module on the Safe by crafting and signing a Safe execTransaction
export async function enableSafeModule(safeAddress: string, signer: Signer, moduleAddress: string): Promise<void> {
  const provider = signer.provider;
  if (!provider) throw new Error('Signer provider is required');

  const safeProxy = new ethers.Contract(safeAddress, SAFE_ABI, provider);

  // Check if contract is deployed and initialized
  try {
    // If already enabled, exit early
    const already = await safeProxy.isModuleEnabled(moduleAddress);
    if (already) {
      console.log('Module is already enabled');
      return;
    }
  } catch (error: any) {
    // If we can't decode the result, the Safe might not be fully initialized
    if (error.code === 'BAD_DATA' && error.value === '0x') {
      console.log('Safe wallet not fully initialized yet, waiting a moment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw error;
    }
  }

  // Verify Safe is properly initialized by checking owners and threshold
  try {
    const [owners, threshold] = await Promise.all([
      safeProxy.getOwners(),
      safeProxy.getThreshold(),
    ]);
    const signerAddress = await signer.getAddress();
    console.log(`Safe has ${owners.length} owner(s), threshold: ${threshold}`);
    console.log(`Signer: ${signerAddress}, Owners: ${owners.join(', ')}`);
  } catch (error) {
    console.log('Could not verify Safe owners, proceeding anyway...');
  }

  // If direct call fails, use execTransaction with proper signature
  const safeNonce: bigint = await safeProxy.nonce();
  const iface = new ethers.Interface(SAFE_ABI);
  const data = iface.encodeFunctionData('enableModule', [moduleAddress]);

  const to = safeAddress;
  const value = 0;
  const operation = 0; // CALL
  const safeTxGas = 0;
  const baseGas = 0;
  const gasPrice = 0;
  const gasToken = ethers.ZeroAddress;
  const refundReceiver = ethers.ZeroAddress;


  // Use contract to compute tx hash to avoid mismatch
  const safeTxHash = await safeProxy.getTransactionHash(
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    safeNonce
  );

  // Sign the transaction hash using the connected wallet (personal_sign)
  // For Gnosis Safe, personal_sign signatures must have v adjusted by +4 to mark EthSign
  const rawSignature = await signer.signMessage(ethers.getBytes(safeTxHash));
  const sigObj = ethers.Signature.from(rawSignature);
  const adjustedV = sigObj.v + 4;
  const signature = ethers.concat([
    sigObj.r,
    sigObj.s,
    ethers.toBeHex(adjustedV, 1),
  ]);

  // Execute the transaction through Safe's execTransaction
  const safeProxyWithSigner = new ethers.Contract(safeAddress, SAFE_ABI, signer);

  const tx = await safeProxyWithSigner.execTransaction(
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    signature
  );

  console.log('Waiting for transaction confirmation...');
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  // Wait a bit for state to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify module is enabled
  const isNowEnabled = await safeProxy.isModuleEnabled(moduleAddress);
  if (!isNowEnabled) {
    console.error('Module is still not enabled after transaction');
    console.error(`Transaction hash: ${receipt.hash}`);
    throw new Error("Module verification failed");
  }

  console.log('✅ Module enabled successfully via execTransaction');
}

