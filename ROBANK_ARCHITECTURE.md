# ROBANK — Capital Architecture

## Core

ROBANK is an autonomous capital platform.

Capital is the primary product object. Wallets and vaults are infrastructure rails.

Core loop:

OBSERVE → DECIDE → EXECUTE → VERIFY → RECONCILE → REPEAT

## Capital Model

ROBANK maintains a unified capital view containing:

- Cash / liquid balance
- Invested assets
- Tokenized assets / RWA
- Stock-token exposure
- Collateral value
- Outstanding debt
- Available credit
- Net capital
- Liquidity requirements

## Core Systems

### Capital Engine

The central financial state and orchestration layer.

### Agent

The agent continuously monitors capital, liquidity, assets, collateral, debt, payments and configured policies. It can act autonomously only within an explicit mandate.

### Ledger

The application-level source of truth. External chains and providers are rails that must be reconciled against actual results.

### Rails

- Base — primary money / settlement rail
- Robinhood Chain — tokenized asset rail
- Buvei — card / spending rail
- Lending providers — credit infrastructure
- RWA providers — asset infrastructure

## Autonomous Jobs

- Liquidity monitoring
- Credit and collateral monitoring
- Asset monitoring
- Allocation and rebalance monitoring
- Payment monitoring
- Reconciliation

## Product Structure

Capital
Assets
Borrow
Payments
Cards
Vault
Agent
Activity

## Failure Isolation

A provider failure must not automatically take down unrelated ROBANK functionality. Each external integration must be isolated behind an adapter boundary.

## Security

Autonomous does not mean unlimited. Every execution must check the active mandate, determine approval requirements, execute only when authorized, verify the actual result, and reconcile the ledger.

ROBANK must never request, store, or expose private keys or seed phrases.
