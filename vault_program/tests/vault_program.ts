import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import { VaultProgram } from "../target/types/vault_program";

const { PublicKey } = anchor.web3;

describe("vault_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.vaultProgram as Program<VaultProgram>;
  const user = provider.wallet.publicKey;

  const [vaultState, stateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), user.toBuffer()],
    program.programId
  );
  const [vault, vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultState.toBuffer()],
    program.programId
  );

  it("initializes the vault", async () => {
    await program.methods
      .initialize()
      .accountsPartial({ user, vaultState, vault })
      .rpc();

    const state = await program.account.vaultState.fetch(vaultState);
    expect(state.vaultBump).to.equal(vaultBump);
    expect(state.stateBump).to.equal(stateBump);

    const rent = await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(await provider.connection.getBalance(vault)).to.equal(rent);
  });

  it("deposits soll into the vault", async () => {
    const amount = 1 * anchor.web3.LAMPORTS_PER_SOL;
    const before = await provider.connection.getBalance(vault);

    await program.methods
      .deposit(new anchor.BN(amount))
      .accountsPartial({ user, vaultState, vault })
      .rpc();

    const after = await provider.connection.getBalance(vault);
    expect(after - before).to.equal(amount);
  });

  it("rejects a zero deposit", async () => {
    try {
      await program.methods
        .deposit(new anchor.BN(0))
        .accountsPartial({ user, vaultState, vault })
        .rpc();
      expect.fail("deposit of 0 should have failed");
    } catch (err) {
      expect((err as anchor.AnchorError).error.errorCode.code).to.equal(
        "InvalidAmount"
      );
    }
  });
});
