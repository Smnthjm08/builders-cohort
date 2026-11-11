use anchor_lang::prelude::*;

use crate::{constants::*, error::ErrorCode, state::Escrow};

#[derive(Accounts)]
pub struct Update<'info> {
    pub maker: Signer<'info>,

    #[account(
        mut,
        has_one = maker,
        seeds = [ESCROW_SEED, maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn handle_update(ctx: Context<Update>, receive: u64) -> Result<()> {
    require!(receive > 0, ErrorCode::InvalidAmount);

    ctx.accounts.escrow.receive = receive;
    Ok(())
}
