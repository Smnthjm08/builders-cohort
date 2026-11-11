use anchor_lang::prelude::*;

use crate::{constants::*, state::VaultState};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [STATE_SEED, user.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,


    #[account(
        mut,
        seeds = [VAULT_SEED, vault_state.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let vault_state = &mut ctx.accounts.vault_state;

    vault_state.vault_bump = ctx.bumps.vault;
    vault_state.state_bump = ctx.bumps.vault_state;

    let rent_exempt = Rent::get()?.minimum_balance(0);
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.user.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(anchor_lang::system_program::ID, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, rent_exempt)?;

    Ok(())
}
