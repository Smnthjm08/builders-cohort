use anchor_lang::prelude::*;

use crate::{constants::*, error::ErrorCode, state::VaultState};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [STATE_SEED, user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    let rent_exempt = Rent::get()?.minimum_balance(0);
    let available = ctx.accounts.vault.lamports().saturating_sub(rent_exempt);
    
    require!(amount <= available, ErrorCode::InsufficientFunds);

    let vault_state_key = ctx.accounts.vault_state.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED,
        vault_state_key.as_ref(),
        &[ctx.accounts.vault_state.vault_bump],
    ]];

    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        anchor_lang::system_program::ID,
        cpi_accounts,
        signer_seeds,
    );
    anchor_lang::system_program::transfer(cpi_ctx, amount)
}
