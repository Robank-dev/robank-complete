function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toRatio18(value) {
  const number = toNumber(value);

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return number / 1e18;
  }

  return number > 1 ? number / 100 : number;
}

export function calculateLtv({
  collateralUsd,
  debtUsd
}) {
  const collateral = toNumber(collateralUsd);
  const debt = toNumber(debtUsd);

  if (collateral <= 0) return debt > 0 ? Infinity : 0;

  return debt / collateral;
}

export function evaluatePosition({
  collateralUsd,
  debtUsd,
  liquidationLtv,
  utilization = null,
  listed = true
}) {
  const collateral = toNumber(collateralUsd);
  const debt = toNumber(debtUsd);
  const ltv = calculateLtv({
    collateralUsd: collateral,
    debtUsd: debt
  });

  const liquidationRatio = toRatio18(liquidationLtv);

  const ltvBuffer =
    Number.isFinite(ltv) && liquidationRatio > 0
      ? liquidationRatio - ltv
      : null;

  let status = 'healthy';

  if (!listed) {
    status = 'market-unlisted';
  } else if (collateral <= 0 && debt > 0) {
    status = 'critical';
  } else if (liquidationRatio > 0 && ltv >= liquidationRatio) {
    status = 'liquidation-risk';
  } else if (liquidationRatio > 0 && ltv >= liquidationRatio * 0.85) {
    status = 'high-risk';
  } else if (liquidationRatio > 0 && ltv >= liquidationRatio * 0.70) {
    status = 'attention';
  }

  const utilizationRatio =
    utilization === null ? null : toNumber(utilization);

  if (
    status === 'healthy' &&
    utilizationRatio !== null &&
    utilizationRatio >= 0.95
  ) {
    status = 'liquidity-constrained';
  }

  return {
    collateralUsd: collateral,
    debtUsd: debt,
    ltv,
    liquidationLtv: liquidationRatio,
    ltvBuffer,
    utilization: utilizationRatio,
    status
  };
}

export function calculateBorrowCapacity({
  collateralUsd,
  liquidationLtv,
  targetLtv = 0.5,
  existingDebtUsd = 0
}) {
  const collateral = toNumber(collateralUsd);
  const liquidationRatio = toRatio18(liquidationLtv);
  const requestedTarget = toRatio18(targetLtv);
  const target =
    liquidationRatio > 0
      ? Math.min(requestedTarget, liquidationRatio * 0.8)
      : requestedTarget;
  const existingDebt = toNumber(existingDebtUsd);

  if (collateral <= 0 || target <= 0) return 0;

  const maxDebtAtTarget = collateral * target;
  return Math.max(0, maxDebtAtTarget - existingDebt);
}

export function evaluateMarket(market) {
  const listed = Boolean(market?.listed);
  const utilization = market?.state?.utilization ?? null;

  return {
    marketId: market?.marketId || null,
    listed,
    loanAsset: market?.loanAsset?.symbol || null,
    collateralAsset: market?.collateralAsset?.symbol || null,
    liquidationLtv: toRatio18(market?.lltv),
    borrowApy: toNumber(market?.state?.borrowApy),
    supplyApy: toNumber(market?.state?.supplyApy),
    utilization: utilization === null ? null : toNumber(utilization),
    capacityStatus:
      !listed
        ? 'unavailable'
        : utilization !== null && toNumber(utilization) >= 0.95
          ? 'constrained'
          : 'available'
  };
}
