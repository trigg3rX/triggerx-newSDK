import { ethers, Signer } from 'ethers';

// Minimal Safe ABI fragments used in this SDK
export const SAFE_ABI = [
  // module checks
  "function isModuleEnabled(address module) view returns (bool)",
  // EIP-712 domain separator for Safe
  "function domainSeparator() view returns (bytes32)",
  // Safe nonce
  "function nonce() view returns (uint256)",
  // Exec transaction (self-call to enable module)
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) returns (bool)",
  // Owners and threshold, to validate single signer safes
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
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

  // If already enabled, exit early
  const already = await safeProxy.isModuleEnabled(moduleAddress);
  if (already) return;

  const safeNonce: bigint = await safeProxy.nonce();
  const iface = new ethers.Interface(SAFE_ABI);
  const data = iface.encodeFunctionData('enableModule', [moduleAddress]);

  const to = safeAddress;
  const value = 0n;
  const operation = 0; // CALL
  const safeTxGas = 0n;
  const baseGas = 0n;
  const gasPrice = 0n;
  const gasToken = ethers.ZeroAddress;
  const refundReceiver = ethers.ZeroAddress;

  // Calculate Safe transaction hash per EIP-712
  const safeTxHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      [
        'bytes32', 'address', 'uint256', 'bytes32', 'uint8',
        'uint256', 'uint256', 'uint256', 'address', 'address', 'uint256'
      ],
      [
        SAFE_TX_TYPEHASH, to, value, ethers.keccak256(data), operation,
        safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, safeNonce
      ]
    )
  );

  const domainSeparator: string = await safeProxy.domainSeparator();
  const txHash = ethers.keccak256(
    ethers.solidityPacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', domainSeparator, safeTxHash]
    )
  );

  const rawSignature = await signer.signMessage(ethers.getBytes(txHash));
  const sig = ethers.Signature.from(rawSignature);
  const adjustedV = sig.v + 4; // EthSign type
  const signature = ethers.concat([sig.r, sig.s, ethers.toBeHex(adjustedV, 1)]);

  const safeWithSigner = new ethers.Contract(safeAddress, SAFE_ABI, signer);
  const tx = await safeWithSigner.execTransaction(
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
  await tx.wait();

  const check = await safeProxy.isModuleEnabled(moduleAddress);
  if (!check) {
    throw new Error('Module verification failed');
  }
}


