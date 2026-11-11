# Escrow program

An Anchor program for trustless token swaps between two wallets. A maker locks token A and says how much token B they want. Any taker who pays that amount of B gets the A, and the swap happens in one transaction. If no one takes it, the maker can cancel and get their A back.

- Program ID: `C9jKqHdMPMLrjSvdw9PFfJuHfyA7FUyPNNxVnb1HCiVA`
- Anchor 1.1.2 with `anchor-spl` (Token and Token-2022 through `token_interface`)
- Tests in TypeScript (Bun + ts-mocha) on localnet

## How it works

| Account  | Address                                | Holds                                                   |
| -------- | -------------------------------------- | ------------------------------------------------------- |
| `escrow` | PDA `["escrow", maker, seed (u64 LE)]` | `Escrow { seed, maker, mint_a, mint_b, receive, bump }` |
| `vault`  | ATA of `mint_a` owned by `escrow`      | The maker's locked token A                              |

The `seed` lets one maker run many escrows at once, one PDA per seed. The vault is a token account whose authority is the escrow PDA, so only the program can move tokens out of it. It signs with the escrow's seeds.

Every instruction that reads the escrow checks it with `has_one = maker`, `has_one = mint_a` (and `mint_b` where used) and the PDA seeds. A caller can't swap in a different maker, mint or escrow account. Transfers use `transfer_checked`, which also checks the mint's decimals.

## Instructions

| Instruction | Signer | Args                                    | What it does                                                                                                                                                                                                                                                                          |
| ----------- | ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make`      | maker  | `seed: u64, deposit: u64, receive: u64` | Creates the escrow and its vault, then moves `deposit` of token A from the maker into the vault. `receive` is how much token B the maker wants. Both amounts must be above 0.                                                                                                         |
| `take`      | taker  | none                                    | Sends `receive` of token B from the taker to the maker, then the whole vault of token A to the taker. Closes the vault and the escrow and returns their rent to the maker. Creates the taker's A account and the maker's B account if they don't exist yet; the taker pays for those. |
| `refund`    | maker  | none                                    | Returns all of token A from the vault to the maker, then closes the vault and the escrow. Only the maker can call it.                                                                                                                                                                 |
| `update`    | maker  | `receive: u64`                          | Changes how much token B the maker wants. It must be above 0. Only the maker can call it.                                                                                                                                                                                             |

`update` is an extra instruction beyond the standard make, take and refund. Without it, a maker who wants a different price has to refund and make a new escrow, which takes two transactions and pays rent twice.

## Errors

| Error           | When                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| `InvalidAmount` | `make` with `deposit` or `receive` set to 0, or `update` with `receive` set to 0 |

Anchor's built-in constraint errors cover the rest, such as a non-maker trying to `refund` or `update`.

## Tests

[tests/escrow_program.ts](tests/escrow_program.ts) has 12 tests, grouped by instruction:

| Instruction | Test             | Checks                                                             |
| ----------- | ---------------- | ------------------------------------------------------------------ |
| `make`      | happy path       | escrow state is stored and token A is in the vault                 |
| `make`      | zero deposit     | rejected                                                           |
| `make`      | zero receive     | rejected                                                           |
| `take`      | happy path       | both sides get their tokens and the escrow and vault are closed    |
| `take`      | take twice       | the second take fails because the escrow is gone                   |
| `take`      | taker short on B | fails if the taker doesn't hold enough token B                     |
| `refund`    | wrong signer     | only the maker can refund                                          |
| `refund`    | happy path       | token A goes back to the maker and the escrow and vault are closed |
| `update`    | happy path       | the maker can change `receive`                                     |
| `update`    | wrong signer     | only the maker can update                                          |
| `update`    | zero receive     | rejected                                                           |
| `update`    | then take        | `take` charges the updated amount                                  |

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
programs/escrow_program/src/
├── lib.rs            # program entrypoints
├── constants.rs      # PDA seed
├── error.rs          # custom errors
├── state.rs          # Escrow
└── instructions/     # make, take, refund, update
tests/escrow_program.ts
```
