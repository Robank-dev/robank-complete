# ROBANK CLI Reference

**Status: DESIGNED CLI / TARGET CLI INTERFACE.** The commands below describe the
intended shape of the ROBANK CLI. Do not tell a user a command is live/installed
unless that has been separately confirmed. When in doubt, say "this is the designed
CLI interface" rather than implying it runs today.

## Auth

```
robank auth login
```
Authenticate the CLI session against a ROBANK account.

## Wallet

```
robank wallet
robank wallet balance
robank wallet transactions
```
Inspect the connected wallet, current balances, and transaction history.

## Payments

```
robank pay create
robank pay quote
robank pay execute
robank payments route
```
Create a payment intent, get a quote, execute a payment, or compare available routing
options across rails/networks.

## Treasury

```
robank treasury status
robank treasury policy
robank treasury rebalance
robank treasury simulate
```
Inspect current treasury state and policy, run or simulate a rebalance against the
configured target allocation.

## Agent

```
robank agent chat
robank agent mandate
robank agent permissions
robank agent revoke
```
Interact with the agent, inspect or grant a spending mandate, view current
permissions, or revoke agent access.

## RWA (Tokenized Assets)

```
robank rwa discover
robank rwa quote
robank rwa basket
robank rwa positions
```
Discover available tokenized asset products (provider-dependent), get a quote,
manage a basket, or view current positions.

## x402

```
robank x402 inspect
robank x402 pay
robank x402 retry
```
Inspect a 402 Payment Required response, pay it, or retry a failed x402 payment
according to policy.

## Swap

```
robank swap quote
robank swap execute
```
Get a swap quote or execute a swap between supported assets.

## Network

```
robank network list
robank network inspect
```
List supported/planned networks or inspect details of a specific network
(status, RPC, supported assets — configuration-dependent).

---

None of the commands above should be presented to a user as currently installed or
executable unless the runtime environment actually confirms it. Treat this file as
the target interface specification.
