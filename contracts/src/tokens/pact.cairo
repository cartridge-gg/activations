// Standard ERC721 NFT contract for The Ronin's Pact
// This contract stores player progress only
// Game logic and configuration are handled by treasure_hunt.cairo

use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct TrialProgress {
    pub waza_complete: bool,
    pub chi_complete: bool,
    pub shin_complete: bool,
}

#[starknet::interface]
pub trait IRoninPact<TContractState> {
    // ERC721 functions (from OpenZeppelin)
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256
    );
    fn safe_transfer_from(
        ref self: TContractState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    fn approve(ref self: TContractState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TContractState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(
        self: @TContractState, owner: ContractAddress, operator: ContractAddress
    ) -> bool;

    // Custom functions
    fn mint(ref self: TContractState);
    fn get_progress(self: @TContractState, token_id: u256) -> TrialProgress;

    // Minting functions (only callable by authorized minter contract)
    fn complete_waza(ref self: TContractState, token_id: u256);
    fn complete_chi(ref self: TContractState, token_id: u256);
    fn complete_shin(ref self: TContractState, token_id: u256);

    // Admin functions
    fn set_minter(ref self: TContractState, minter: ContractAddress);
    fn get_minter(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod RoninPact {
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };
    use super::TrialProgress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 implementations (not embedded in ABI, for internal use only)
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Bit flags for trial progress
    const WAZA_BIT: u8 = 0x04; // 0b100
    const CHI_BIT: u8 = 0x02;  // 0b010
    const SHIN_BIT: u8 = 0x01; // 0b001

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        owner: ContractAddress,
        minter: ContractAddress,
        token_count: u256,
        token_progress: Map<u256, u8>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        WazaCompleted: WazaCompleted,
        ChiCompleted: ChiCompleted,
        ShinCompleted: ShinCompleted,
    }

    #[derive(Drop, starknet::Event)]
    struct WazaCompleted {
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ChiCompleted {
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ShinCompleted {
        token_id: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.erc721.initializer("The Ronin's Pact", "RONIN", "");
        self.owner.write(owner);
        self.minter.write(owner);
        self.token_count.write(0);
    }

    #[abi(embed_v0)]
    impl RoninPactImpl of super::IRoninPact<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.name()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.symbol()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.generate_svg(token_id)
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc721.balance_of(account)
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            self.erc721.owner_of(token_id)
        }

        fn transfer_from(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256
        ) {
            self.erc721.transfer_from(from, to, token_id);
        }

        fn safe_transfer_from(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            token_id: u256,
            data: Span<felt252>
        ) {
            self.erc721.safe_transfer_from(from, to, token_id, data);
        }

        fn approve(ref self: ContractState, to: ContractAddress, token_id: u256) {
            self.erc721.approve(to, token_id);
        }

        fn set_approval_for_all(
            ref self: ContractState, operator: ContractAddress, approved: bool
        ) {
            self.erc721.set_approval_for_all(operator, approved);
        }

        fn get_approved(self: @ContractState, token_id: u256) -> ContractAddress {
            self.erc721.get_approved(token_id)
        }

        fn is_approved_for_all(
            self: @ContractState, owner: ContractAddress, operator: ContractAddress
        ) -> bool {
            self.erc721.is_approved_for_all(owner, operator)
        }

        fn mint(ref self: ContractState) {
            let caller = get_caller_address();

            // Get next token ID
            let token_id = self.token_count.read();
            self.token_count.write(token_id + 1);

            // Mint the token
            self.erc721.mint(caller, token_id);

            // Initialize trial progress to 0 (no trials complete)
            self.token_progress.write(token_id, 0);
        }

        fn get_progress(self: @ContractState, token_id: u256) -> TrialProgress {
            let progress = self.token_progress.read(token_id);

            TrialProgress {
                waza_complete: (progress & WAZA_BIT) != 0,
                chi_complete: (progress & CHI_BIT) != 0,
                shin_complete: (progress & SHIN_BIT) != 0,
            }
        }

        fn complete_waza(ref self: ContractState, token_id: u256) {
            self.complete_challenge(token_id, WAZA_BIT);
            self.emit(WazaCompleted { token_id });
        }

        fn complete_chi(ref self: ContractState, token_id: u256) {
            self.complete_challenge(token_id, CHI_BIT);
            self.emit(ChiCompleted { token_id });
        }

        fn complete_shin(ref self: ContractState, token_id: u256) {
            self.complete_challenge(token_id, SHIN_BIT);
            self.emit(ShinCompleted { token_id });
        }

        fn set_minter(ref self: ContractState, minter: ContractAddress) {
            self.assert_only_owner();
            self.minter.write(minter);
        }

        fn get_minter(self: @ContractState) -> ContractAddress {
            self.minter.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner');
        }

        fn assert_minter(self: @ContractState) {
            let caller = get_caller_address();
            let minter = self.minter.read();
            assert(caller == minter, 'Only minter');
        }

        fn complete_challenge(ref self: ContractState, token_id: u256, challenge_bit: u8) {
            self.assert_minter();

            let progress = self.token_progress.read(token_id);
            self.token_progress.write(token_id, progress | challenge_bit);
        }

        // SVG Art Generation

        fn generate_svg(self: @ContractState, token_id: u256) -> ByteArray {
            let progress = self.get_progress(token_id);

            let mut svg: ByteArray = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>";

            // Background
            svg.append(@self.get_background());

            // Base pact symbol (always visible)
            svg.append(@self.get_base_pact());

            // Add completed trial markers
            if progress.waza_complete {
                svg.append(@self.get_waza_slash());
            }
            if progress.chi_complete {
                svg.append(@self.get_chi_slash());
            }
            if progress.shin_complete {
                svg.append(@self.get_shin_slash());
            }

            // Add glow effect if all complete
            if progress.waza_complete && progress.chi_complete && progress.shin_complete {
                svg.append(@self.get_completion_glow());
            }

            svg.append(@"</svg>");

            // Note: In production, you'd want to base64 encode this
            // For now, we'll use a data URI with the SVG directly
            let mut data_uri: ByteArray = "data:image/svg+xml;utf8,";
            data_uri.append(@svg);
            data_uri
        }

        fn get_background(self: @ContractState) -> ByteArray {
            "<rect width='400' height='400' fill='#1a1a2e'/><defs><radialGradient id='bg-gradient'><stop offset='0%' style='stop-color:#2a2a4e;stop-opacity:1'/><stop offset='100%' style='stop-color:#1a1a2e;stop-opacity:1'/></radialGradient></defs><rect width='400' height='400' fill='url(#bg-gradient)'/>"
        }

        fn get_base_pact(self: @ContractState) -> ByteArray {
            // Central circle representing the pact
            "<circle cx='200' cy='200' r='80' fill='none' stroke='#4a5568' stroke-width='3' opacity='0.6'/><circle cx='200' cy='200' r='90' fill='none' stroke='#4a5568' stroke-width='2' opacity='0.4'/><circle cx='200' cy='200' r='100' fill='none' stroke='#4a5568' stroke-width='1' opacity='0.2'/><text x='200' y='340' text-anchor='middle' font-family='monospace' font-size='16' fill='#718096'>The Ronins Pact</text>"
        }

        fn get_waza_slash(self: @ContractState) -> ByteArray {
            // First slash - diagonal from top-left (Technique) - RED
            "<defs><linearGradient id='waza-gradient' x1='140' y1='140' x2='260' y2='260' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#ef4444;stop-opacity:1'/><stop offset='100%' style='stop-color:#dc2626;stop-opacity:1'/></linearGradient><filter id='waza-glow'><feGaussianBlur stdDeviation='3' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><line x1='140' y1='140' x2='260' y2='260' stroke='url(#waza-gradient)' stroke-width='8' stroke-linecap='round' filter='url(#waza-glow)'/><text x='120' y='130' font-family='monospace' font-size='14' fill='#ef4444' opacity='0.9'>WAZA</text>"
        }

        fn get_chi_slash(self: @ContractState) -> ByteArray {
            // Second slash - diagonal from top-right (Wisdom) - BLUE
            "<defs><linearGradient id='chi-gradient' x1='260' y1='140' x2='140' y2='260' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#3b82f6;stop-opacity:1'/><stop offset='100%' style='stop-color:#2563eb;stop-opacity:1'/></linearGradient><filter id='chi-glow'><feGaussianBlur stdDeviation='3' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><line x1='260' y1='140' x2='140' y2='260' stroke='url(#chi-gradient)' stroke-width='8' stroke-linecap='round' filter='url(#chi-glow)'/><text x='268' y='130' font-family='monospace' font-size='14' fill='#3b82f6' opacity='0.9'>CHI</text>"
        }

        fn get_shin_slash(self: @ContractState) -> ByteArray {
            // Third slash - vertical from top (Spirit) - PURPLE
            "<defs><linearGradient id='shin-gradient' x1='200' y1='120' x2='200' y2='280' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#a855f7;stop-opacity:1'/><stop offset='100%' style='stop-color:#9333ea;stop-opacity:1'/></linearGradient></defs><line x1='200' y1='120' x2='200' y2='280' stroke='url(#shin-gradient)' stroke-width='8' stroke-linecap='round'/><text x='200' y='110' text-anchor='middle' font-family='monospace' font-size='14' fill='#a855f7' opacity='0.9'>SHIN</text>"
        }

        fn get_completion_glow(self: @ContractState) -> ByteArray {
            // Golden glow when all three trials are complete
            "<defs><radialGradient id='complete-gradient'><stop offset='0%' style='stop-color:#fbbf24;stop-opacity:0.4'/><stop offset='50%' style='stop-color:#f59e0b;stop-opacity:0.2'/><stop offset='100%' style='stop-color:#d97706;stop-opacity:0'/></radialGradient><filter id='complete-glow'><feGaussianBlur stdDeviation='8' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><circle cx='200' cy='200' r='120' fill='url(#complete-gradient)' filter='url(#complete-glow)'/><text x='200' y='360' text-anchor='middle' font-family='monospace' font-size='12' fill='#fbbf24' font-weight='bold'>FORGED</text>"
        }
    }
}
