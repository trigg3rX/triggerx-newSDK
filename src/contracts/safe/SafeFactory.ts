import { ethers, Signer } from 'ethers';

// Minimal ABI for TriggerXSafeFactory
export const TRIGGERX_SAFE_FACTORY_ABI = [
  "function createSafeWallet(address user) returns (address)",
  "function latestSafeWallet(address user) view returns (address)",
  "function getSafeWallets(address user) view returns (address[])",
  "function predictSafeAddress(address user) view returns (address)",
  "event SafeWalletCreated(address indexed user, address indexed safeWallet, uint256 saltNonce)"
];

export async function createSafeWalletForUser(factoryAddress: string, signer: Signer, user: string): Promise<string> {
  const factory = new ethers.Contract(factoryAddress, TRIGGERX_SAFE_FACTORY_ABI, signer);
  const tx = await factory.createSafeWallet(user);
  const receipt = await tx.wait();
  // Try to fetch from event; fallback to latestSafeWallet
  const evt = receipt.logs
    .map((l: any) => {
      try { return factory.interface.parseLog(l); } catch { return null; }
    })
    .find((e: any) => e && e.name === 'SafeWalletCreated');
  if (evt && evt.args && evt.args.safeWallet) {
    return evt.args.safeWallet as string;
  }
  return await factory.latestSafeWallet(user);
}


