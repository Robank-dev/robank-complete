# ROBANK CLI

Install from the repository (Node 20+):

```
git clone https://github.com/Robank-dev/robank-complete
npm install -g ./robank-complete/cli
```

```
robank login [rbk_…]            save a personal API key (create one at robank.co/cli)
robank logout
robank status                   capability states
robank balance [--fresh]        on-chain holdings; warns about networks that could not be read
robank wallet                   EVM and Solana deposit addresses
robank stocks [query]           tokenized stocks
robank borrow [--chain base]    Morpho markets
robank ask "<message>"          talk to the ROBANK agent
robank send <amount> <asset> <address> --chain <network>
                                validates and prints a review link — nothing is sent
robank jobs [--mine]
```

Global flags: `--json` for machine-readable output, `--api-url <https url>`. Environment: `ROBANK_API_KEY`, `ROBANK_API_URL`. The key is stored in `~/.robank/config.json` with owner-only permissions.

Networks for `--chain`: `ethereum`, `base`, `arbitrum`, `optimism`, `polygon`, `bnb`, `robinhood`, `solana`.

The CLI cannot sign or broadcast. `send` exits successfully after printing the link; the transfer only happens if the user signs it in the app.
