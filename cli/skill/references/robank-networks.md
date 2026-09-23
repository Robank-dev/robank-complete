# ROBANK Networks

## Network Abstraction

ROBANK is designed to operate across multiple networks rather than being tied to a
single chain. Agents should treat network selection as a routing decision (cost,
speed, mandate compatibility), not a fixed default.

## Current Design Concepts

| Network | Status |
|---|---|
| Base Mainnet | MAINNET (chain ID 8453) |
| Robinhood Chain Mainnet | MAINNET (chain ID 4663) |

Do not present any of the above as currently live in production unless the runtime
environment explicitly confirms it. Use `network.list` / `GET /v1/networks` to check
actual current status rather than relying on this table alone — it reflects design
intent as of this skill's authoring, not a live feed.

## Status Definitions

- **DEV** — available in a development/testnet capacity only
- **PLANNED** — designed for support, not yet available
- **LIVE** — confirmed live in production
- **PROVIDER-DEPENDENT** — availability depends on a third-party provider/venue

## Configuration Dependency

The following must always be treated as environment/configuration-dependent, never
hardcoded or assumed by the agent:

- RPC URLs
- Contract addresses
- Token addresses
- Supported assets per network

When an action requires one of the above, retrieve it from the live configuration
(via `network.inspect` / the API) rather than reusing a value from a prior
conversation or example.
