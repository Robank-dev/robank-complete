import { Router } from 'express';
import { listBaseMarkets, getBaseUserPositions } from '../integrations/morpho/client.js';
import { evaluatePosition, calculateBorrowCapacity } from '../services/creditRisk.js';

const router = Router();

router.get('/status/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (!address) {
      return res.status(400).json({ error: 'wallet address is required' });
    }

    const [markets, user] = await Promise.all([
      listBaseMarkets({ first: 1000 }),
      getBaseUserPositions(address)
    ]);

    const marketMap = new Map(
      markets.map((market) => [market.marketId, market])
    );

    const positions = (user.marketPositions || []).map((position) => {
      const market = marketMap.get(position.market?.marketId);
      const collateralUsd = position.state?.collateralUsd ?? 0;
      const debtUsd = position.state?.borrowAssetsUsd ?? 0;

      const liquidationLtv = market?.lltv ?? 0;

      const risk = evaluatePosition({
        collateralUsd,
        debtUsd,
        liquidationLtv,
        utilization: market?.state?.utilization ?? null,
        listed: market?.listed ?? false
      });

      const collateralCapacityUsd = calculateBorrowCapacity({
        collateralUsd,
        liquidationLtv,
        targetLtv: 0.5,
        existingDebtUsd: debtUsd
      });

      const marketLiquidityUsd = Number(
        market?.state?.liquidityAssetsUsd || 0
      );

      const borrowCapacityUsd = Math.min(
        collateralCapacityUsd,
        marketLiquidityUsd
      );

      return {
        marketId: position.market?.marketId || null,
        loanAsset: position.market?.loanAsset?.symbol || null,
        collateralAsset: position.market?.collateralAsset?.symbol || null,
        borrowCapacityUsd,
        collateralCapacityUsd,
        marketLiquidityUsd,
        risk
      };
    });

    const totalCollateralUsd = positions.reduce(
      (sum, position) => sum + Number(position.risk.collateralUsd || 0),
      0
    );

    const totalDebtUsd = positions.reduce(
      (sum, position) => sum + Number(position.risk.debtUsd || 0),
      0
    );

    res.json({
      address: user.address || address,
      provider: 'morpho',
      network: 'base',
      positionCount: positions.length,
      totals: {
        collateralUsd: totalCollateralUsd,
        debtUsd: totalDebtUsd
      },
      positions
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


router.get('/quote', async (_req, res) => {
  try {
    const markets = await listBaseMarkets({ first: 1000 });

    const quotes = markets
      .filter((market) => market?.listed)
      .map((market) => ({
        marketId: market.marketId,
        loanAsset: market.loanAsset?.symbol || null,
        collateralAsset: market.collateralAsset?.symbol || null,
        liquidationLtv: Number(market.lltv || 0) / 1e18,
        borrowApy: Number(market.state?.borrowApy || 0),
        supplyApy: Number(market.state?.supplyApy || 0),
        utilization: Number(market.state?.utilization || 0),
        liquidityUsd: Number(market.state?.liquidityAssetsUsd || 0),
        borrowAssetsUsd: Number(market.state?.borrowAssetsUsd || 0),
        supplyAssetsUsd: Number(market.state?.supplyAssetsUsd || 0),
        capacityStatus:
          Number(market.state?.utilization || 0) >= 0.95
            ? 'constrained'
            : 'available'
      }));

    res.json({
      provider: 'morpho',
      network: 'base',
      marketCount: quotes.length,
      quotes
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
export default router;

