use anchor_lang::prelude::*;

use crate::{constants::*, state::VaultState};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Signer<'info>,


    #[account(
        mut,
        seeds = [STATE_SEED, user.key().as_ref()],
        bump = vault_state.state_bump,
        close = user
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

pub fn handle_close(ctx: Context<Close>) -> Result<()> {
    let vault_state_key = ctx.accounts.vault_state.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED,
        vault_state_key.as_ref(),
        &[ctx.accounts.vault_state.vault_bump],
    ]];

    // Send the vault's entire balance back. At 0 lamports the runtime deletes it.
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        anchor_lang::system_program::ID,
        cpi_accounts,
        signer_seeds,
    );
    anchor_lang::system_program::transfer(cpi_ctx, ctx.accounts.vault.lamports())
}
