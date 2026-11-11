import * as anchor from "@anchor-lang/core";
import { BN, Program } from "@anchor-lang/core";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { EscrowProgram } from "../target/types/escrow_program";

const { Keypair, PublicKey, LAMPORTS_PER_SOL } = anchor.web3;

describe("escrow_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrowProgram as Program<EscrowProgram>;
  const connection = provider.connection;

  const maker = (provider.wallet as anchor.Wallet).payer;
  const taker = Keypair.generate();
  const tokenProgram = TOKEN_PROGRAM_ID;

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;
  let makerAtaA: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;

  const DEPOSIT = 100;
  const RECEIVE = 50;

  const escrowFor = (seed: BN) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    )[0];

  const vaultFor = (escrow: anchor.web3.PublicKey) =>
    getAssociatedTokenAddressSync(mintA, escrow, true, tokenProgram);

  const balance = async (ata: anchor.web3.PublicKey) =>
    Number((await getAccount(connection, ata, undefined, tokenProgram)).amount);

  const make = (seed: BN, deposit: number, receive: number) => {
    const escrow = escrowFor(seed);
    return program.methods
      .make(seed, new BN(deposit), new BN(receive))
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault: vaultFor(escrow),
        tokenProgram,
      })
      .rpc();
  };

  const take = (seed: BN) => {
    const escrow = escrowFor(seed);
    return program.methods
      .take()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA,
        mintB,
        takerAtaA: getAssociatedTokenAddressSync(mintA, taker.publicKey, false, tokenProgram),
        takerAtaB,
        makerAtaB: getAssociatedTokenAddressSync(mintB, maker.publicKey, false, tokenProgram),
        escrow,
        vault: vaultFor(escrow),
        tokenProgram,
      })
      .signers([taker])
      .rpc();
  };

  const errorCode = async (call: Promise<unknown>) => {
    try {
      await call;
    } catch (err: any) {
      return err.error?.errorCode?.code ?? err.message;
    }
    throw new Error("expected the transaction to fail");
  };

  before(async () => {
    const sig = await connection.requestAirdrop(taker.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);

    mintA = await createMint(connection, maker, maker.publicKey, null, 6);
    mintB = await createMint(connection, maker, maker.publicKey, null, 6);

    makerAtaA = (await getOrCreateAssociatedTokenAccount(connection, maker, mintA, maker.publicKey)).address;
    takerAtaB = (await getOrCreateAssociatedTokenAccount(connection, maker, mintB, taker.publicKey)).address;

    await mintTo(connection, maker, mintA, makerAtaA, maker, 1_000);
    await mintTo(connection, maker, mintB, takerAtaB, maker, 1_000);
  });

  describe("make", () => {
    it("creates the escrow and moves token A into the vault", async () => {
      const seed = new BN(1);
      await make(seed, DEPOSIT, RECEIVE);

      const escrow = await program.account.escrow.fetch(escrowFor(seed));
      expect(escrow.seed.toNumber()).to.equal(1);
      expect(escrow.maker.toBase58()).to.equal(maker.publicKey.toBase58());
      expect(escrow.mintA.toBase58()).to.equal(mintA.toBase58());
      expect(escrow.mintB.toBase58()).to.equal(mintB.toBase58());
      expect(escrow.receive.toNumber()).to.equal(RECEIVE);

      expect(await balance(vaultFor(escrowFor(seed)))).to.equal(DEPOSIT);
      expect(await balance(makerAtaA)).to.equal(1_000 - DEPOSIT);
    });

    it("rejects a zero deposit", async () => {
      expect(await errorCode(make(new BN(99), 0, RECEIVE))).to.equal("InvalidAmount");
    });

    it("rejects a zero receive amount", async () => {
      expect(await errorCode(make(new BN(98), DEPOSIT, 0))).to.equal("InvalidAmount");
    });
  });

  describe("take", () => {
    it("swaps the tokens and closes the escrow and vault", async () => {
      const seed = new BN(1);
      const escrow = escrowFor(seed);
      const vault = vaultFor(escrow);

      await take(seed);

      const takerAtaA = getAssociatedTokenAddressSync(mintA, taker.publicKey);
      const makerAtaB = getAssociatedTokenAddressSync(mintB, maker.publicKey);
      expect(await balance(takerAtaA)).to.equal(DEPOSIT);
      expect(await balance(takerAtaB)).to.equal(1_000 - RECEIVE);
      expect(await balance(makerAtaB)).to.equal(RECEIVE);

      expect(await program.account.escrow.fetchNullable(escrow)).to.equal(null);
      expect(await connection.getAccountInfo(vault)).to.equal(null);
    });

    it("cannot take the same escrow twice", async () => {
      // The escrow account was closed, so Anchor can't load it.
      expect(await errorCode(take(new BN(1)))).to.equal("AccountNotInitialized");
    });

    it("fails if the taker doesn't have enough token B", async () => {
      const seed = new BN(2);
      await make(seed, DEPOSIT, 1_000_000);

      const code = await errorCode(take(seed));
      expect(code).to.match(/insufficient funds|0x1/);

      expect(await balance(vaultFor(escrowFor(seed)))).to.equal(DEPOSIT);
    });
  });

  describe("refund", () => {
    const seed = new BN(2);

    it("only the maker can refund", async () => {
      const escrow = escrowFor(seed);
      const call = program.methods
        .refund()
        .accountsPartial({
          maker: taker.publicKey,
          mintA,
          makerAtaA: getAssociatedTokenAddressSync(mintA, taker.publicKey, false, tokenProgram),
          escrow,
          vault: vaultFor(escrow),
          tokenProgram,
        })
        .signers([taker])
        .rpc();

      expect(await errorCode(call)).to.match(/ConstraintHasOne|ConstraintSeeds/);
      expect(await balance(vaultFor(escrow))).to.equal(DEPOSIT);
    });

    it("returns token A to the maker and closes the escrow and vault", async () => {
      const escrow = escrowFor(seed);
      const vault = vaultFor(escrow);
      const before = await balance(makerAtaA);

      await program.methods
        .refund()
        .accountsPartial({
          maker: maker.publicKey,
          mintA,
          makerAtaA,
          escrow,
          vault,
          tokenProgram,
        })
        .rpc();

      expect(await balance(makerAtaA)).to.equal(before + DEPOSIT);
      expect(await program.account.escrow.fetchNullable(escrow)).to.equal(null);
      expect(await connection.getAccountInfo(vault)).to.equal(null);
    });
  });

  describe("update", () => {
    const seed = new BN(3);
    const NEW_RECEIVE = 75;

    const update = (signer: anchor.web3.Keypair, receive: number) =>
      program.methods
        .update(new BN(receive))
        .accountsPartial({ maker: signer.publicKey, escrow: escrowFor(seed) })
        .signers([signer])
        .rpc();

    before(async () => {
      await make(seed, DEPOSIT, RECEIVE);
    });

    it("lets the maker change the receive amount", async () => {
      await update(maker, NEW_RECEIVE);

      const escrow = await program.account.escrow.fetch(escrowFor(seed));
      expect(escrow.receive.toNumber()).to.equal(NEW_RECEIVE);
    });

    it("only the maker can update", async () => {
      expect(await errorCode(update(taker, 1))).to.match(/ConstraintHasOne|ConstraintSeeds/);
    });

    it("rejects a zero receive amount", async () => {
      expect(await errorCode(update(maker, 0))).to.equal("InvalidAmount");
    });

    it("take uses the updated amount", async () => {
      const makerAtaB = getAssociatedTokenAddressSync(mintB, maker.publicKey);
      const before = await balance(makerAtaB);

      await take(seed);

      expect(await balance(makerAtaB)).to.equal(before + NEW_RECEIVE);
    });
  });
});
