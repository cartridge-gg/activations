#[starknet::interface]
pub trait IERC721<TContractState> {
    fn get_starterpack_id(self: @TContractState) -> u32;
    fn set_base_uri(ref self: TContractState, base_uri: ByteArray);
}

#[starknet::contract]
mod ERC721 {
    use openzeppelin_access::accesscontrol::{AccessControlComponent, DEFAULT_ADMIN_ROLE};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starterpack::interface::IStarterpackImplementation as IStarterpack;
    use starterpack::types::item::ItemTrait;
    use starterpack::types::metadata::MetadataTrait;
    use crate::interface::{IStarterpackRegistryDispatcher, IStarterpackRegistryDispatcherTrait};

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);

    // ERC721 mixin includes SRC5, so embed AccessControl without its SRC5
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;

    // Internal impls
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        access_control: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        starterpack: u32,
        token_id: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        owner: ContractAddress,
        minter: ContractAddress, // 0x03eb03b8f2be0ec2aafd186d72f6d8f3dd320dbc89f2b6802bca7465f6ccaa43
        price: u256,
    ) {
        self.erc721.initializer(name, symbol, base_uri);
        self.access_control.initializer();
        self.access_control._grant_role(DEFAULT_ADMIN_ROLE, owner);
        self.access_control._grant_role(MINTER_ROLE, minter);

        let dispatcher = IStarterpackRegistryDispatcher { contract_address: minter };
        let this = starknet::get_contract_address();
        let item = ItemTrait::new(name: "name", description: "description", image_uri: "");
        let metadata = MetadataTrait::new(
            name: "Nums Starterpack",
            description: "This starterpack contains Nums games",
            image_uri: "",
            items: [item].span(),
            tokens: [].span(),
        )
            .jsonify();
        let starterpack_id = dispatcher
            .register(
                implementation: this,
                referral_percentage: 0,
                reissuable: false,
                price: price,
                payment_token: core::num::traits::Zero::zero(),
                payment_receiver: Option::Some(this),
                metadata: metadata,
            );
        self.starterpack.write(starterpack_id);
    }

    #[abi(embed_v0)]
    impl StarterpackImpl of IStarterpack<ContractState> {
        fn on_issue(
            ref self: ContractState, recipient: ContractAddress, starterpack_id: u32, quantity: u32,
        ) {
            // [Check] Starterpack ID
            let stored_id = self.starterpack.read();
            assert(stored_id == starterpack_id, 'Starterpack: ID mismatch');

            // [Check] Caller is allowed
            self.access_control.assert_only_role(MINTER_ROLE);

            // [Effect] Read token ID
            let token_id = self.token_id.read();
            self.token_id.write(token_id + 1);

            // [Effect] Mint token
            self.erc721.mint(recipient, token_id);
        }

        fn supply(self: @ContractState, starterpack_id: u32) -> Option<u32> {
            Option::None
        }
    }

    #[abi(embed_v0)]
    impl ERC721Impl of super::IERC721<ContractState> {
        fn get_starterpack_id(self: @ContractState) -> u32 {
            self.starterpack.read()
        }

        fn set_base_uri(ref self: ContractState, base_uri: ByteArray) {
            self.access_control.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.erc721._set_base_uri(base_uri);
        }
    }
}
