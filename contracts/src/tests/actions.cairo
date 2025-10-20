// Integration tests for Ronin Quest actions contract
// Tests admin functions, trial completion, and full lifecycle

use starknet::ContractAddress;
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::ModelStorage;
use dojo_snf_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait
};
use snforge_std::{
    start_cheat_caller_address, stop_cheat_caller_address, declare, ContractClassTrait,
    DeclareResultTrait
};
use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

use ronin_quest::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
use ronin_quest::models::{RoninPact, RoninGames, RoninAnswers};
use ronin_quest::token::pact::{IRoninPactDispatcher, IRoninPactDispatcherTrait};
use ronin_quest::controller::eip191::{Signer, Eip191Signer};
use super::mocks::{IMockERC721Dispatcher, IMockERC721DispatcherTrait};

// ============================================================================
// Test Helpers
// ============================================================================

// Test account constants
const OWNER: felt252 = 'OWNER';

fn owner() -> ContractAddress {
    OWNER.try_into().unwrap()
}

// Deploy mock controllers to simulate real-world Controller usage
fn player() -> ContractAddress {
    deploy_mock_controller()
}

fn other() -> ContractAddress {
    deploy_mock_controller()
}

// Dojo world configuration
fn namespace_def() -> NamespaceDef {
    NamespaceDef {
        namespace: "ronin_quest",
        resources: [
            TestResource::Model("RoninPact"),
            TestResource::Model("RoninGames"),
            TestResource::Model("RoninAnswers"),
            TestResource::Contract("actions"),
        ].span()
    }
}

fn contract_defs() -> Span<ContractDef> {
    [
        ContractDefTrait::new(@"ronin_quest", @"actions")
            .with_writer_of([dojo::utils::bytearray_hash(@"ronin_quest")].span())
    ].span()
}

// Contract deployment helpers
fn deploy_pact(owner: ContractAddress) -> ContractAddress {
    let contract = declare("RoninPact").unwrap().contract_class();
    let (pact_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    pact_address
}

fn deploy_test_game(owner: ContractAddress) -> ContractAddress {
    let contract = declare("MockERC721").unwrap().contract_class();
    let (game_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    game_address
}

fn deploy_mock_controller() -> ContractAddress {
    let contract = declare("MockController").unwrap().contract_class();
    let (controller_address, _) = contract.deploy(@array![]).unwrap();
    controller_address
}

// World setup with initialized contracts
fn setup_world() -> (WorldStorage, IActionsDispatcher, ContractAddress) {
    let ndef = namespace_def();
    let mut world = spawn_test_world([ndef].span());

    // Sync permissions and initialize contracts
    world.sync_perms_and_inits(contract_defs());

    // Get actions contract address
    let (actions_address, _) = world.dns(@"actions").unwrap();
    let actions = IActionsDispatcher { contract_address: actions_address };

    (world, actions, actions_address)
}

// ============================================================================
// Admin Function Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_pact() {
    let (world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());

    // Set pact address
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    stop_cheat_caller_address(actions_address);

    // Verify pact was set
    let pact_config: RoninPact = world.read_model(0);
    assert(pact_config.pact == pact_address, 'Pact not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_games() {
    let (world, actions, actions_address) = setup_world();

    // Deploy mock game contracts
    let game1 = deploy_test_game(owner());
    let game2 = deploy_test_game(owner());

    // Set games
    start_cheat_caller_address(actions_address, owner());
    actions.set_games(array![game1, game2]);
    stop_cheat_caller_address(actions_address);

    // Verify games were set
    let games_config: RoninGames = world.read_model(0);
    assert(games_config.games.len() == 2, 'Games not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_quiz() {
    let (world, actions, actions_address) = setup_world();

    // Set quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    // Verify answers were set
    let answers_config: RoninAnswers = world.read_model(0);
    assert(answers_config.answers.len() == 5, 'Answers not set');
}

// ============================================================================
// NFT Minting Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_mint_nft_via_actions() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    stop_cheat_caller_address(actions_address);

    // Mint NFT from Player (Controller) via actions contract
    start_cheat_caller_address(actions_address, player_controller);
    actions.mint();
    stop_cheat_caller_address(actions_address);

    // Verify NFT was minted to the Controller
    assert(pact.balance_of(player_controller) == 1, 'NFT not minted');
    assert(pact.owner_of(0) == player_controller, 'Wrong owner');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Already owns a pact NFT',))]
fn test_mint_duplicate_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    stop_cheat_caller_address(actions_address);

    // Mint first NFT - should succeed
    start_cheat_caller_address(actions_address, player_controller);
    actions.mint();

    // Try to mint second NFT - should fail with 'Already owns a pact NFT'
    actions.mint();
}

// ============================================================================
// Trial Completion Tests - Waza (Technique)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_waza() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };
    let game_erc721 = IERC721Dispatcher { contract_address: game_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_games(array![game_address]);
    stop_cheat_caller_address(actions_address);

    // Set actions as minter in pact
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT and game NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    start_cheat_caller_address(game_address, player_controller);
    game.mint(player_controller);
    stop_cheat_caller_address(game_address);

    // Verify player has game NFT
    assert(game_erc721.balance_of(player_controller) >= 1, 'No game NFT');

    // Complete waza trial - Player (Controller) calls
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0);
    stop_cheat_caller_address(actions_address);

    // Verify waza trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Waza not complete');
    assert(progress.chi_complete == false, 'Chi should not be complete');
    assert(progress.shin_complete == false, 'Shin should not be complete');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('No tokens owned!',))]
fn test_waza_no_nft_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_games(array![game_address]);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    let player_controller = player();

    // Player (Controller) mints NFT but NO game NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Try to complete waza without game NFT - should fail
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0);
}

// ============================================================================
// Trial Completion Tests - Chi (Wisdom)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_chi() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    let player_controller = player();

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Complete chi trial with correct answers (at least 3 correct)
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
    stop_cheat_caller_address(actions_address);

    // Verify chi trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should not be complete');
    assert(progress.chi_complete == true, 'Chi not complete');
    assert(progress.shin_complete == false, 'Shin should not be complete');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Incorrect answers!',))]
fn test_chi_wrong_answers_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    let player_controller = player();

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Try to complete chi trial with wrong answers (only 2 correct out of 3)
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x99999999]; // Last one wrong
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Question/answer mismatch',))]
fn test_chi_mismatched_length_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![0x12345678, 0x23456789, 0x34567890];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_quiz(answers);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    let player_controller = player();

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Try with mismatched lengths
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789]; // One less answer
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
}

// ============================================================================
// Trial Completion Tests - Shin (Spirit)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_shin() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Create a test signer (Discord/EIP-191 signer)
    let eth_address: starknet::EthAddress = 0x1234567890abcdef_felt252.try_into().unwrap();
    let test_signer = Signer::Eip191(Eip191Signer { eth_address });

    // Complete shin trial - Player (Controller) is the caller and NFT owner
    // The caller IS the Controller instance
    // MockController.is_owner() always returns true
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_shin(0, test_signer);
    stop_cheat_caller_address(actions_address);

    // Verify shin trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should not be complete');
    assert(progress.chi_complete == false, 'Chi should not be complete');
    assert(progress.shin_complete == true, 'Shin not complete');
}

// ============================================================================
// Ownership Check Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_waza_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_games(array![game_address]);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // player() and other() return different Controller instances
    let player_controller = player();
    let other_controller = other();

    // Player (Controller) mints pact NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Other (Controller) mints game NFT
    start_cheat_caller_address(game_address, other_controller);
    game.mint(other_controller);
    stop_cheat_caller_address(game_address);

    // Other (Controller) tries to complete waza for player's token - should fail
    start_cheat_caller_address(actions_address, other_controller);
    actions.complete_waza(0);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_chi_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![0x12345678, 0x23456789, 0x34567890];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_quiz(answers);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // player() and other() return different Controller instances
    let player_controller = player();
    let other_controller = other();

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Other (Controller) tries to complete chi for player's token - should fail
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, other_controller);
    actions.complete_chi(0, questions, player_answers);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_shin_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // player() and other() return different Controller instances
    let player_controller = player();
    let other_controller = other();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    // Create a test signer
    let eth_address: starknet::EthAddress = 0x1234567890abcdef_felt252.try_into().unwrap();
    let test_signer = Signer::Eip191(Eip191Signer { eth_address });

    // Other (Controller) tries to complete shin for player's token - should fail
    start_cheat_caller_address(actions_address, other_controller);
    actions.complete_shin(0, test_signer);
}

// ============================================================================
// Full Lifecycle Test
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_full_lifecycle() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };

    let player_controller = player();

    // Configure actions contract
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address);
    actions.set_games(array![game_address]);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) setup: mint NFTs
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller);
    stop_cheat_caller_address(pact_address);

    start_cheat_caller_address(game_address, player_controller);
    game.mint(player_controller);
    stop_cheat_caller_address(game_address);

    // Verify initial state - no trials complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should start incomplete');
    assert(progress.chi_complete == false, 'Chi should start incomplete');
    assert(progress.shin_complete == false, 'Shin should start incomplete');

    // Complete all three trials - Player (Controller) calls all (as the NFT owner)
    // 1. Complete Waza (technique) - player calls
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0);
    stop_cheat_caller_address(actions_address);
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Waza not complete');

    // 2. Complete Chi (wisdom) - player calls
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
    stop_cheat_caller_address(actions_address);
    let progress = pact.get_progress(0);
    assert(progress.chi_complete == true, 'Chi not complete');

    // 3. Complete Shin (spirit) - Player (Controller) calls
    // Create a test signer (Discord/EIP-191 signer)
    let eth_address: starknet::EthAddress = 0x1234567890abcdef_felt252.try_into().unwrap();
    let test_signer = Signer::Eip191(Eip191Signer { eth_address });

    // Player (Controller) is the caller and NFT owner - it IS the Controller instance
    // MockController.is_owner() always returns true
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_shin(0, test_signer);
    stop_cheat_caller_address(actions_address);

    // Verify final state - all three trials complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Final: Waza not complete');
    assert(progress.chi_complete == true, 'Final: Chi not complete');
    assert(progress.shin_complete == true, 'Final: Shin not complete');
}
