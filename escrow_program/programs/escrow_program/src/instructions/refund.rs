use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::{constants::*, state::Escrow};

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub mint_a: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = mint_a,
        seeds = [ESCROW_SEED, maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_refund(ctx: Context<Refund>) -> Result<()> {
    let accounts = &ctx.accounts;

    let maker_key = accounts.maker.key();
    let seed_bytes = accounts.escrow.seed.to_le_bytes();
    let bump = [accounts.escrow.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[ESCROW_SEED, maker_key.as_ref(), &seed_bytes, &bump]];

    let give_back = TransferChecked {
        from: accounts.vault.to_account_info(),
        mint: accounts.mint_a.to_account_info(),
        to: accounts.maker_ata_a.to_account_info(),
        authority: accounts.escrow.to_account_info(),
    };
    transfer_checked(
        CpiContext::new_with_signer(accounts.token_program.key(), give_back, signer_seeds),
        accounts.vault.amount,
        accounts.mint_a.decimals,
    )?;

    let close = CloseAccount {
        account: accounts.vault.to_account_info(),
        destination: accounts.maker.to_account_info(),
        authority: accounts.escrow.to_account_info(),
    };
    close_account(CpiContext::new_with_signer(
        accounts.token_program.key(),
        close,
        signer_seeds,
    ))
}
