'use client';

import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Instruction
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstruction, getTransferCheckedInstruction } from '@solana-program/token-2022';
import { CHAINS, SOLANA_CHAIN_ID } from './chains';

export const SOLANA_RPC = CHAINS.find((c) => c.id === SOLANA_CHAIN_ID)!.rpcs[0];
export const solanaRpc = () => createSolanaRpc(SOLANA_RPC);

/**
 * Builds an unsigned Solana transfer (SOL or an SPL/Token-2022 token). The recipient's
 * associated token account is created idempotently, so first-time recipients work.
 */
export async function buildSolanaTransfer({ from, to, amount, mint, decimals, programId }: { from: string; to: string; amount: bigint; mint?: string; decimals?: number; programId?: string }) {
  const rpc = solanaRpc();
  const owner = createNoopSigner(address(from));
  const recipient = address(to);
  const instructions: Instruction[] = [];
  if (!mint) {
    instructions.push(getTransferSolInstruction({ source: owner, destination: recipient, amount }));
  } else {
    const tokenProgram = address(programId!);
    const mintAddress = address(mint);
    const [sourceAta] = await findAssociatedTokenPda({ owner: owner.address, mint: mintAddress, tokenProgram });
    const [destinationAta] = await findAssociatedTokenPda({ owner: recipient, mint: mintAddress, tokenProgram });
    instructions.push(getCreateAssociatedTokenIdempotentInstruction({ payer: owner, ata: destinationAta, owner: recipient, mint: mintAddress, tokenProgram }));
    instructions.push(getTransferCheckedInstruction({ source: sourceAta, mint: mintAddress, destination: destinationAta, authority: owner, amount, decimals: decimals! }, { programAddress: tokenProgram }));
  }
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(owner.address, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  );
  return new Uint8Array(getTransactionEncoder().encode(compileTransaction(message)));
}

export const signatureToString = (signature: Uint8Array) => getBase58Decoder().decode(signature);

/** Polls the cluster until the signature is confirmed, failed, or the timeout passes (then status is unknown). */
export async function waitForSolanaSignature(signature: string, timeoutMs = 90_000): Promise<'confirmed' | 'failed' | 'unknown'> {
  const rpc = solanaRpc();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const { value } = await rpc.getSignatureStatuses([signature as any]).send();
      const status = value[0];
      if (status?.err) return 'failed';
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return 'confirmed';
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return 'unknown';
}
