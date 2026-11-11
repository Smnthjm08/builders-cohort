pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("DrSJ3pqSDVqRFttaKVxtf7vsusfFd3L9HwHZHLQXA5aw");

#[program]
pub mod vault_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handle_initialize(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        crate::instructions::deposit::handle_deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        crate::instructions::withdraw::handle_withdraw(ctx, amount)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        crate::instructions::close::handle_close(ctx)
    }
}
