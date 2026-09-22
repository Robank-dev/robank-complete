'use client';

import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit';
import type { EIP1193Provider } from 'viem';

export async function getPredictedSafeAddress(provider: any, owner: `0x${string}`) {
  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig: {
      owners: [owner],
      threshold: 1
    },
    safeDeploymentConfig: {
      saltNonce: '0'
    }
  };

  const protocolKit = await Safe.init({
    provider,
    signer: owner,
    predictedSafe
  });

  return protocolKit.getAddress();
}

export async function getSafeDeploymentTransaction(provider: any, owner: `0x${string}`) {
  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig: {
      owners: [owner],
      threshold: 1
    },
    safeDeploymentConfig: {
      saltNonce: '0'
    }
  };

  const protocolKit = await Safe.init({
    provider,
    signer: owner,
    predictedSafe
  });

  const safeAddress = await protocolKit.getAddress();
  const deployment = await protocolKit.createSafeDeploymentTransaction();

  return { safeAddress, deployment };
}


