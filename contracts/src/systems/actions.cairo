// Dojo contract for The Ronin's Pact treasure hunt game logic
// This contract stores game configuration and validates trial completion
// Player progress is stored in the NFT contract (ronin_pact.cairo)

use starknet::ContractAddress;

// Interface for the Controller's signer verification
#[starknet::interface]
pub trait ISignerList<TContractState> {
    fn is_signer_in_list(self: @TContractState, signer_guid: felt252) -> bool;
}

// Interface for the NFT contract - only progress recording
#[starknet::interface]
pub trait IRoninPact<TContractState> {
    fn complete_waza(ref self: TContractState, owner: ContractAddress);
    fn complete_chi(ref self: TContractState, owner: ContractAddress);
    fn complete_shin(ref self: TContractState, owner: ContractAddress);
}

// Treasure hunt game interface
#[starknet::interface]
pub trait ITreasureHunt<T> {
    // Player actions
    fn complete_waza(ref self: T, collection_address: ContractAddress);
    fn complete_chi(ref self: T, answers: Array<felt252>);
    fn complete_shin(ref self: T, signer_guid: felt252);
    fn get_quiz_questions_for_wallet(self: @T, wallet: ContractAddress) -> Array<ByteArray>;

    // Admin functions
    fn set_allowlist(ref self: T, collections: Array<ContractAddress>);
    fn set_quiz(ref self: T, questions: Array<ByteArray>, answer_hashes: Array<felt252>);
    fn get_allowlist_length(self: @T) -> u32;
    fn get_allowlisted_collection(self: @T, index: u32) -> ContractAddress;
    fn get_quiz_length(self: @T) -> u32;
    fn get_quiz_question(self: @T, index: u32) -> ByteArray;
    fn get_quiz_answer_hash(self: @T, index: u32) -> felt252;
}

#[dojo::contract]
pub mod treasure_hunt {
    use super::{
        ITreasureHunt, IRoninPactDispatcher, IRoninPactDispatcherTrait, ISignerListDispatcher,
        ISignerListDispatcherTrait
    };
    use starknet::{ContractAddress, get_caller_address, storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map, StorageMapReadAccess, StorageMapWriteAccess}};
    use core::poseidon::poseidon_hash_span;
    use dojo::event::EventStorage;
    use dojo::world::WorldStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct WazaAttempted {
        #[key]
        pub wallet: ContractAddress,
        pub collection: ContractAddress,
        pub success: bool,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ChiAttempted {
        #[key]
        pub wallet: ContractAddress,
        pub success: bool,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ShinAttempted {
        #[key]
        pub wallet: ContractAddress,
        pub signer_guid: felt252,
        pub success: bool,
    }

    #[storage]
    struct Storage {
        nft_contract: ContractAddress,
        owner: ContractAddress,
        // Configuration storage
        allowlist_length: u32,
        allowlisted_collections: Map<u32, ContractAddress>,
        quiz_length: u32,
        quiz_questions: Map<u32, ByteArray>,
        quiz_answer_hashes: Map<u32, felt252>,
    }

    #[abi(embed_v0)]
    impl TreasureHuntImpl of ITreasureHunt<ContractState> {
        fn complete_waza(ref self: ContractState, collection_address: ContractAddress) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // Verify the collection is allowlisted by reading from local storage
            let allowlist_length = self.allowlist_length.read();
            let mut is_allowlisted = false;
            let mut i: u32 = 0;
            loop {
                if i >= allowlist_length {
                    break;
                }
                let allowlisted_collection = self.allowlisted_collections.read(i);
                if allowlisted_collection == collection_address {
                    is_allowlisted = true;
                    break;
                }
                i += 1;
            };

            if !is_allowlisted {
                world
                    .emit_event(
                        @WazaAttempted {
                            wallet: caller, collection: collection_address, success: false
                        }
                    );
                panic!("Collection not allowlisted");
            }

            // Check ownership via ERC721 balance_of
            let balance = self.check_erc721_balance(collection_address, caller);
            if balance == 0 {
                world
                    .emit_event(
                        @WazaAttempted {
                            wallet: caller, collection: collection_address, success: false
                        }
                    );
                panic!("No tokens owned");
            }

            // Call NFT contract to record completion
            let nft_contract = self.nft_contract.read();
            let nft = IRoninPactDispatcher { contract_address: nft_contract };
            nft.complete_waza(caller);

            world
                .emit_event(
                    @WazaAttempted { wallet: caller, collection: collection_address, success: true }
                );
        }

        fn complete_chi(ref self: ContractState, answers: Array<felt252>) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // Verify answers (3 questions per user)
            if answers.len() != 3 {
                world.emit_event(@ChiAttempted { wallet: caller, success: false });
                panic!("Must answer 3 questions");
            }

            // Get the 3 questions for this wallet
            let question_indices = self.select_questions_for_wallet(caller);

            // Verify each answer by reading from local storage
            let mut i: u32 = 0;
            let mut all_correct = true;
            loop {
                if i >= 3 {
                    break;
                }
                let question_idx = *question_indices.at(i);
                let answer_hash = self.quiz_answer_hashes.read(question_idx);
                let submitted_answer = *answers.at(i);

                if submitted_answer != answer_hash {
                    all_correct = false;
                    break;
                }
                i += 1;
            };

            if !all_correct {
                world.emit_event(@ChiAttempted { wallet: caller, success: false });
                panic!("Incorrect answers");
            }

            // Call NFT contract to record completion
            let nft_contract = self.nft_contract.read();
            let nft = IRoninPactDispatcher { contract_address: nft_contract };
            nft.complete_chi(caller);

            world.emit_event(@ChiAttempted { wallet: caller, success: true });
        }

        fn complete_shin(ref self: ContractState, signer_guid: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // Verify the signer GUID is registered on the caller's Controller account
            let controller_dispatcher = ISignerListDispatcher { contract_address: caller };
            let is_valid_signer = controller_dispatcher.is_signer_in_list(signer_guid);

            if !is_valid_signer {
                world.emit_event(@ShinAttempted { wallet: caller, signer_guid, success: false });
                panic!("Signer not registered");
            }

            // Call NFT contract to record completion
            let nft_contract = self.nft_contract.read();
            let nft = IRoninPactDispatcher { contract_address: nft_contract };
            nft.complete_shin(caller);

            world.emit_event(@ShinAttempted { wallet: caller, signer_guid, success: true });
        }

        fn get_quiz_questions_for_wallet(
            self: @ContractState, wallet: ContractAddress
        ) -> Array<ByteArray> {
            let indices = self.select_questions_for_wallet(wallet);
            let mut questions = ArrayTrait::new();

            let mut i: u32 = 0;
            loop {
                if i >= 3 {
                    break;
                }
                let idx = *indices.at(i);
                let question = self.quiz_questions.read(idx);
                questions.append(question);
                i += 1;
            };

            questions
        }

        // Admin functions
        fn set_allowlist(ref self: ContractState, collections: Array<ContractAddress>) {
            self.assert_only_owner();

            let len = collections.len();
            self.allowlist_length.write(len);

            let mut i: u32 = 0;
            loop {
                if i >= len {
                    break;
                }
                let collection = *collections.at(i);
                self.allowlisted_collections.write(i, collection);
                i += 1;
            };
        }

        fn set_quiz(
            ref self: ContractState, questions: Array<ByteArray>, answer_hashes: Array<felt252>
        ) {
            self.assert_only_owner();

            assert(questions.len() == 10, 'Must provide 10 questions');
            assert(answer_hashes.len() == 10, 'Must provide 10 answers');

            self.quiz_length.write(10);

            let mut i: u32 = 0;
            loop {
                if i >= 10 {
                    break;
                }
                let question = questions.at(i);
                let answer_hash = *answer_hashes.at(i);
                self.quiz_questions.write(i, question.clone());
                self.quiz_answer_hashes.write(i, answer_hash);
                i += 1;
            };
        }

        fn get_allowlist_length(self: @ContractState) -> u32 {
            self.allowlist_length.read()
        }

        fn get_allowlisted_collection(self: @ContractState, index: u32) -> ContractAddress {
            self.allowlisted_collections.read(index)
        }

        fn get_quiz_length(self: @ContractState) -> u32 {
            self.quiz_length.read()
        }

        fn get_quiz_question(self: @ContractState, index: u32) -> ByteArray {
            self.quiz_questions.read(index)
        }

        fn get_quiz_answer_hash(self: @ContractState, index: u32) -> felt252 {
            self.quiz_answer_hashes.read(index)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"ronin_pact")
        }

        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner');
        }

        fn check_erc721_balance(
            self: @ContractState, collection: ContractAddress, owner: ContractAddress
        ) -> u256 {
            // Call balance_of on the ERC721 collection
            let mut calldata = ArrayTrait::new();
            calldata.append(owner.into());

            let balance_of_selector = selector!("balance_of");
            let result = starknet::syscalls::call_contract_syscall(
                collection, balance_of_selector, calldata.span()
            );

            match result {
                Result::Ok(mut ret_data) => {
                    if ret_data.len() == 0 {
                        return 0;
                    }
                    // Balance is u256, so we need to read two felts (low, high)
                    let low: felt252 = *ret_data.at(0);
                    let high: felt252 = if ret_data.len() > 1 {
                        *ret_data.at(1)
                    } else {
                        0
                    };
                    u256 { low: low.try_into().unwrap(), high: high.try_into().unwrap() }
                },
                Result::Err(_) => 0
            }
        }

        fn select_questions_for_wallet(
            self: @ContractState, wallet: ContractAddress
        ) -> Array<u32> {
            // Pseudo-random selection based on wallet address
            // Select 3 unique questions from the 10 available
            let mut questions = ArrayTrait::new();

            // Use poseidon hash with wallet address to generate deterministic randomness
            let seed: felt252 = wallet.into();
            let hash1 = poseidon_hash_span(array![seed, 1].span());
            let hash2 = poseidon_hash_span(array![seed, 2].span());
            let hash3 = poseidon_hash_span(array![seed, 3].span());

            // Convert to indices 0-9
            let q1: u256 = hash1.into();
            let q2: u256 = hash2.into();
            let q3: u256 = hash3.into();

            let idx1: u32 = (q1 % 10).try_into().unwrap();
            let mut idx2: u32 = (q2 % 10).try_into().unwrap();
            let mut idx3: u32 = (q3 % 10).try_into().unwrap();

            // Ensure uniqueness
            if idx2 == idx1 {
                idx2 = (idx2 + 1) % 10;
            }
            if idx3 == idx1 || idx3 == idx2 {
                idx3 = (idx3 + 1) % 10;
                if idx3 == idx1 || idx3 == idx2 {
                    idx3 = (idx3 + 1) % 10;
                }
            }

            questions.append(idx1);
            questions.append(idx2);
            questions.append(idx3);

            questions
        }
    }

    fn dojo_init(ref self: ContractState, nft_contract: ContractAddress, owner: ContractAddress) {
        // Store the NFT contract address and owner
        self.nft_contract.write(nft_contract);
        self.owner.write(owner);
    }
}
