# Vault program

An Anchor program that gives each wallet its own SOL vault. The owner can deposit, withdraw and close it. No other wallet can touch it.

- Program ID: `DrSJ3pqSDVqRFttaKVxtf7vsusfFd3L9HwHZHLQXA5aw`
- Anchor 1.1.2, tests in TypeScript (Bun + ts-mocha) on localnet

## How it works

Each user gets two PDAs:

| Account       | Seeds                    | Holds                                            |
| ------------- | ------------------------ | ------------------------------------------------ |
| `vault_state` | `["state", user]`        | `VaultState { vault_bump, state_bump }`          |
| `vault`       | `["vault", vault_state]` | The SOL itself (a plain system account, no data) |

`vault_state` is seeded by the user's key, and `vault` is seeded by `vault_state`. So the accounts a signer passes in always resolve to that signer's own vault. Another wallet can't point at someone else's vault: the seeds won't match and Anchor rejects the transaction.

The vault has no data, so it can't sign for itself. When SOL leaves the vault, the program signs the System Program transfer with the vault's PDA seeds (`CpiContext::new_with_signer`).

## Instructions

| Instruction  | Args          | What it does                                                                                                                                                                                                                                                                         |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize` | none          | Creates `vault_state`, stores both bumps, and funds `vault` with the rent-exempt minimum so the account exists on-chain.                                                                                                                                                             |
| `deposit`    | `amount: u64` | Transfers `amount` lamports from the user to the vault. Fails with `InvalidAmount` if `amount` is 0.                                                                                                                                                                                 |
| `withdraw`   | `amount: u64` | Transfers `amount` lamports from the vault back to the user, signed by the vault PDA. The rent-exempt minimum always stays in the vault, so you can withdraw at most `balance - rent`. Fails with `InvalidAmount` if `amount` is 0, or `InsufficientFunds` if it is over that limit. |
| `close`      | none          | Sends the vault's whole balance (rent included) to the user, so the runtime deletes the empty vault. `vault_state` is closed with `close = user`, which refunds its rent.                                                                                                            |

## Errors

| Error               | When                                                 |
| ------------------- | ---------------------------------------------------- |
| `InvalidAmount`     | `deposit` or `withdraw` called with 0                |
| `InsufficientFunds` | `withdraw` asks for more than the balance above rent |

## Tests

[tests/vault_program.ts](tests/vault_program.ts) has 7 tests:

| Test           | Checks                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------- |
| initialize     | both bumps are stored and the vault holds the rent-exempt minimum                           |
| deposit        | the vault balance goes up by the deposited amount                                           |
| zero deposit   | a deposit of 0 is rejected                                                                  |
| withdraw       | the vault balance goes down by the withdrawn amount                                         |
| over-withdraw  | asking for more than the vault holds is rejected                                            |
| close          | both `vault` and `vault_state` are gone from the chain                                      |
| another wallet | a second wallet can't withdraw from the first wallet's vault (fails with `ConstraintSeeds`) |

## Run it

Requires the Solana CLI, Anchor 1.1.2 and Bun.

```bash
bun install
anchor build
anchor test
```

`anchor test` starts a local validator, deploys the program and runs the TypeScript tests.

## Layout

```text
programs/vault_program/src/
├── lib.rs            # program entrypoints
├── constants.rs      # PDA seeds
├── error.rs          # custom errors
├── state.rs          # VaultState
└── instructions/     # initialize, deposit, withdraw, close
tests/vault_program.ts
```
