// Dojo contract for The Ronin's Pact quest game logic
// This contract stores game configuration and validates trial completion
// Player progress is stored in the NFT contract (pact.cairo)

use starknet::ContractAddress;
use ronin_quest::controller::eip191::Signer;

// Quest actions interface
#[starknet::interface]
pub trait IActions<T> {
    // Player actions
    fn complete_waza(ref self: T, token_id: u256);
    fn complete_chi(ref self: T, token_id: u256, questions: Array<u32>, answers: Array<felt252>);
    fn complete_shin(ref self: T, token_id: u256, signer: Signer);

    // Admin functions
    fn set_pact(ref self: T, pact: ContractAddress);
    fn set_controller(ref self: T, controller: ContractAddress);
    fn set_games(ref self: T, games: Array<ContractAddress>);
    fn set_quiz(ref self: T, answers: Array<felt252>);
}

#[dojo::contract]
pub mod actions {
    use starknet::{ContractAddress, get_caller_address};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use dojo::world::WorldStorage;
    use dojo::model::ModelStorage;

    use super::IActions;
    use ronin_quest::controller::eip191::{Signer, SignerTrait};
    use ronin_quest::controller::interface::{IMultipleOwnersDispatcher, IMultipleOwnersDispatcherTrait};
    use ronin_quest::models::{RoninPact, RoninController, RoninGames, RoninAnswers};
    use ronin_quest::token::pact::{IRoninPactDispatcher, IRoninPactDispatcherTrait};

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn complete_waza(ref self: ContractState, token_id: u256) {
            let caller = get_caller_address();
            let world = self.world_default();

            let games_config: RoninGames = world.read_model(0);
            let pact_config: RoninPact = world.read_model(0);

            // Check balance across all game collections
            let mut balance: u256 = 0;
            for game in games_config.games {
                let erc721 = IERC721Dispatcher { contract_address: game };
                balance += erc721.balance_of(caller);
            };

            assert(balance >= 1, 'No tokens owned!');

            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            nft.complete_waza(token_id);
        }

        fn complete_chi(ref self: ContractState, token_id: u256, questions: Array<u32>, answers: Array<felt252>) {
            let world = self.world_default();

            let answers_config: RoninAnswers = world.read_model(0);
            let pact_config: RoninPact = world.read_model(0);

            // Verify answer count matches question count
            assert(questions.len() == answers.len(), 'Question/answer mismatch');

            let mut correct: u256 = 0;
            for i in 0..questions.len() {
                let question_idx = *questions.at(i);
                let answer_hash = *answers.at(i);
                let expected_hash = *answers_config.answers.at(question_idx);

                if answer_hash == expected_hash {
                    correct += 1;
                }
            };

            assert(correct >= 3, 'Incorrect answers!');

            // Call NFT contract to record completion
            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            nft.complete_chi(token_id);
        }

        fn complete_shin(ref self: ContractState, token_id: u256, signer: Signer) {
            let world = self.world_default();
            let pact_config: RoninPact = world.read_model(0);
            let controller_config: RoninController = world.read_model(0);

            // Convert signer to its GUID (globally unique identifier)
            let signer_guid = signer.into_guid();

            // Create dispatcher to the Controller contract
            let controller = IMultipleOwnersDispatcher { contract_address: controller_config.controller };

            // Verify the signer GUID is registered in the Controller
            let is_owner = controller.is_owner(signer_guid);
            assert(is_owner, 'Signer not registered');

            // Call NFT contract to record completion
            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            nft.complete_shin(token_id);
        }

        // Admin functions
        // Note: Authorization is handled by Dojo's permission system (owners in dojo_<profile>.toml)
        // Only accounts with owner permissions on the ronin_quest namespace can call these functions
        fn set_pact(ref self: ContractState, pact: ContractAddress) {
            let mut world = self.world_default();
            let config = RoninPact { game_id: 0, pact };
            world.write_model(@config);
        }

        fn set_controller(ref self: ContractState, controller: ContractAddress) {
            let mut world = self.world_default();
            let config = RoninController { game_id: 0, controller };
            world.write_model(@config);
        }

        fn set_games(ref self: ContractState, games: Array<ContractAddress>) {
            let mut world = self.world_default();
            let config = RoninGames { game_id: 0, games };
            world.write_model(@config);
        }

        fn set_quiz(ref self: ContractState, answers: Array<felt252>) {
            let mut world = self.world_default();
            let config = RoninAnswers { game_id: 0, answers };
            world.write_model(@config);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"ronin_quest")
        }
    }

    // Empty initialization function - required by Dojo framework
    // Authorization is handled by Dojo's permission system, not custom ownership
    fn dojo_init(ref self: ContractState) {
        // No initialization needed - configuration is done via admin functions
        // with permissions managed by Dojo's auth system
    }
}
