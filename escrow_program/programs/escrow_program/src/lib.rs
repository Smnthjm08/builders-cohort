pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("C9jKqHdMPMLrjSvdw9PFfJuHfyA7FUyPNNxVnb1HCiVA");

#[program]
pub mod escrow_program {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64) -> Result<()> {
        crate::instructions::make::handle_make(ctx, seed, deposit, receive)
    }
}
