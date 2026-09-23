import { calculateBorrowCapacity, calculateLtv } from './creditRisk.js';

function n(value) {
  const x = Number(value);
  return Number.isFinite(x) ? x : 0;
}

export function calculateCapitalPower({
  liquidUsd = 0,
  investedUsd = 0,
  collateralUsd = 0,
  debtUsd = 0,
  targetLtv = 0.5
}) {
  const liquid = n(liquidUsd);
  const invested = n(investedUsd);
  const collateral = n(collateralUsd);
  const debt = n(debtUsd);

  const totalCapital = liquid + invested;
  const netCapital = totalCapital - debt;

  const currentLtv = calculateLtv({
    collateralUsd: collateral,
    debtUsd: debt
  });

  const availableCredit = calculateBorrowCapacity({
    collateralUsd: collateral,
    liquidationLtv: targetLtv,
    targetLtv,
    existingDebtUsd: debt
  });

  const liquidityRatio =
    totalCapital > 0 ? liquid / totalCapital : 0;

  return {
    totalCapital,
    liquidCapital: liquid,
    investedCapital: invested,
    collateralValue: collateral,
    debt,
    netCapital,
    currentLtv,
    availableCredit,
    liquidityRatio
  };
}

export function summarizeCapitalPower(input) {
  const power = calculateCapitalPower(input);

  return {
    ...power,
    summary: {
      totalCapital: `$${power.totalCapital.toFixed(2)}`,
      liquidCapital: `$${power.liquidCapital.toFixed(2)}`,
      investedCapital: `$${power.investedCapital.toFixed(2)}`,
      collateralValue: `$${power.collateralValue.toFixed(2)}`,
      debt: `$${power.debt.toFixed(2)}`,
      netCapital: `$${power.netCapital.toFixed(2)}`,
      creditAvailable: `$${power.availableCredit.toFixed(2)}`,
      currentLtv: `${(power.currentLtv * 100).toFixed(2)}%`,
      liquidityRatio: `${(power.liquidityRatio * 100).toFixed(2)}%`
    }
  };
}