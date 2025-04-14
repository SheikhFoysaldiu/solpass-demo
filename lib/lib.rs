use anchor_lang::prelude::*;

#[constant]
pub const EVENT_TAG: &[u8] = b"EVENT_STATE";

#[constant]
pub const TICKET_TAG: &[u8] = b"TICKET_STATE";
#[constant]
pub const TICKET_HISTORY_TAG: &[u8] = b"HISTORY";

#[error_code]
pub enum TicketError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("Event is already expired")]
    EventExpired,

    #[msg("Event is not active")]
    EventNotActive,

    #[msg("Math operation overflow")]
    MathOverflow,

    #[msg("Ticket not available")]
    TicketNotAvailable,
}

#[account]
#[derive(InitSpace)]
pub struct EventAccount {
    pub authority: Pubkey, // Event creator
    #[max_len(50)]
    pub event_id: String, // Unique event ID
    #[max_len(50)]
    pub name: String, // Event name
    #[max_len(200)]
    pub description: String, // Event description
    #[max_len(50)]
    pub royalty: String,
    #[max_len(100)]
    pub venue: String, // Event venue
    pub date: i64,          // Event date as timestamp
    pub total_tickets: u64, // Total tickets available
    pub tickets_sold: u64,  // Number of tickets sold
    pub ticket_price: u64,  // Base ticket price in lamports
    pub is_active: bool,    // Whether the event is active
}

#[account]
#[derive(InitSpace)]
pub struct TicketAccount {
    pub event: Pubkey, // Event PDA address
    #[max_len(50)]
    pub owner: String, // Ticket owner,
    #[max_len(50)]
    pub seller: String,
    #[max_len(50)]
    pub ticket_id: String, // Ticket ID within the event
    pub purchase_date: i64, // Purchase timestamp
    pub ticket_price: u64,  // Base ticket price in lamports
    pub resell_count: u8,
    pub accumulated_royalty: u64,
    pub royalty_distributed: bool,
}

#[account]
#[derive(InitSpace)]
pub struct TicketSellHistory {
    pub ticket: Pubkey, // Ticket account address
    #[max_len(50)]
    pub seller: String, // Previous ticket owner name/identifier
    #[max_len(50)]
    pub buyer: String, // New buyer name/identifier

    pub purchase_date: i64, // Purchase timestamp
    pub ticket_price: u64,  // Sale price in lamports
}

declare_id!("BG4wuworHjpRsxE5Wm17Xnp7feyYKizzN2iZ5gZjbsQC");

#[program]
pub mod ticket_master {
    use super::*;

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: String,
        name: String,
        description: String,
        royalty: String,
        venue: String,
        date: i64,
        total_tickets: u64,
        ticket_price: u64,
    ) -> Result<()> {
        let event_account = &mut ctx.accounts.event_account;

        // Fill event data with arguments
        event_account.authority = ctx.accounts.authority.key();
        event_account.event_id = event_id;
        event_account.name = name;
        event_account.description = description;
        event_account.royalty = royalty;
        event_account.venue = venue;
        event_account.date = date;
        event_account.total_tickets = total_tickets;
        event_account.tickets_sold = 0;
        event_account.ticket_price = ticket_price;
        event_account.is_active = true;

        Ok(())
    }

    pub fn purchase_ticket(
        ctx: Context<PurchaseTicket>,
        ticket_id: String,
        owner: String,
    ) -> Result<()> {
        // Get event pubkey first, before any mutable borrows
        let event_pubkey = ctx.accounts.event_account.key();

        // Now get the mutable references
        let event_account = &mut ctx.accounts.event_account;
        let ticket_account = &mut ctx.accounts.ticket_account;
        let clock = Clock::get()?;

        // Check if event is active
        require!(event_account.is_active, TicketError::EventNotActive);

        // Check if event has not expired
        require!(
            event_account.date > clock.unix_timestamp,
            TicketError::EventExpired
        );

        // Check if tickets are still available
        require!(
            event_account.tickets_sold < event_account.total_tickets,
            TicketError::TicketNotAvailable
        );

        // Initialize ticket data
        ticket_account.owner = owner;
        ticket_account.event = event_pubkey; // Use the previously stored key
        ticket_account.ticket_id = ticket_id;
        ticket_account.purchase_date = clock.unix_timestamp;
        ticket_account.ticket_price = event_account.ticket_price;
        ticket_account.resell_count = 0;
        ticket_account.accumulated_royalty = 0;
        ticket_account.royalty_distributed = false;

        // Increment tickets sold for the event
        event_account.tickets_sold = event_account
            .tickets_sold
            .checked_add(1)
            .ok_or(TicketError::MathOverflow)?;

        Ok(())
    }

    pub fn deactivate_event(ctx: Context<DeactivateEvent>) -> Result<()> {
        let event_account = &mut ctx.accounts.event_account;

        // Only event creator can deactivate
        require!(
            event_account.authority == ctx.accounts.authority.key(),
            TicketError::Unauthorized
        );

        // Set event as inactive
        event_account.is_active = false;

        Ok(())
    }

    pub fn resell_ticket(
        ctx: Context<ResellTicket>,
        seller: String,
        buyer: String,
        new_price: u64,
    ) -> Result<()> {
        let ticket_key = ctx.accounts.ticket_account.key();
        let history = &mut ctx.accounts.ticket_history;
        let ticket = &mut ctx.accounts.ticket_account;
        let clock = Clock::get()?;

        // Save current ticket data to history
        history.seller = ticket.seller.clone();
        history.buyer = ticket.owner.clone();
        history.ticket = ticket_key;
        history.purchase_date = ticket.purchase_date; // Save original purchase date
        history.ticket_price = ticket.ticket_price; // Save original price

        // Calculate royalty amount (20% of new price)
        let current_royalty = new_price
            .checked_mul(20)
            .ok_or(TicketError::MathOverflow)?
            .checked_div(100)
            .ok_or(TicketError::MathOverflow)?;

        // Add to accumulated royalty
        let new_accumulated_royalty = ticket
            .accumulated_royalty
            .checked_add(current_royalty)
            .ok_or(TicketError::MathOverflow)?;

        // Update ticket with new information
        ticket.owner = buyer; // New owner (payer)
        ticket.seller = seller; // here this can be taken from the current ticket
        ticket.purchase_date = clock.unix_timestamp; // New purchase timestamp
        ticket.ticket_price = new_price; // New price
        ticket.accumulated_royalty = new_accumulated_royalty;

        // Increment tickets sold for the event
        ticket.resell_count = ticket
            .resell_count
            .checked_add(1)
            .ok_or(TicketError::MathOverflow)?;

        Ok(())
    }

    pub fn distribute_royalty(ctx: Context<DistributeRoyalty>, ticket_id: String) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket_account;
        let event = &ctx.accounts.event_account;
        let payer = &ctx.accounts.payer;
        let team_wallet = &ctx.accounts.team_wallet;

        // Calculate the royalty amount (20% of current ticket price)
        let royalty_amount = ticket.accumulated_royalty;

        // Transfer royalty from payer to team wallet
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &payer.key(),
            &team_wallet.key(),
            royalty_amount,
        );

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                payer.to_account_info(),
                team_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Optional: Record the royalty distribution in the event account or a new account

        msg!(
            "Distributed royalty of {} lamports for ticket {}",
            royalty_amount,
            ticket_id
        );

        ticket.royalty_distributed = true;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(event_id: String)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        seeds = [EVENT_TAG, authority.key().as_ref(), event_id.as_bytes()],
        bump,
        payer = authority,
        space = 8 + EventAccount::INIT_SPACE, // Extra space for strings
    )]
    pub event_account: Box<Account<'info, EventAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ticket_id: String)]
pub struct PurchaseTicket<'info> {
    #[account(mut,)]
    pub event_account: Box<Account<'info, EventAccount>>,

    #[account(
        init,
        seeds = [TICKET_TAG, event_account.key().as_ref(), ticket_id.as_bytes()],
        bump,
        payer = payer,
        space = 8 + TicketAccount::INIT_SPACE,
    )]
    pub ticket_account: Box<Account<'info, TicketAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(idx: u8)]
pub struct ResellTicket<'info> {
    #[account(mut,)]
    pub ticket_account: Box<Account<'info, TicketAccount>>,

    #[account(
        init,
        seeds = [TICKET_HISTORY_TAG, ticket_account.key().as_ref(), &[ticket_account.resell_count as u8].as_ref()],
        bump,
        payer = payer,
        space = 8 + TicketSellHistory::INIT_SPACE,
    )]
    pub ticket_history: Box<Account<'info, TicketSellHistory>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateEvent<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub event_account: Box<Account<'info, EventAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ticket_id: String)]
pub struct DistributeRoyalty<'info> {
    #[account(
        mut,
        seeds = [TICKET_TAG, event_account.key().as_ref(), ticket_id.as_bytes()],
        bump,
    )]
    pub ticket_account: Box<Account<'info, TicketAccount>>,

    #[account(mut,)]
    pub event_account: Box<Account<'info, EventAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the team's wallet that receives royalties
    #[account(mut)]
    pub team_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
