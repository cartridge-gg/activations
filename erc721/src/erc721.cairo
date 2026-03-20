#[starknet::contract]
mod ERC721 {
    use openzeppelin_access::accesscontrol::{AccessControlComponent, DEFAULT_ADMIN_ROLE};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};

    use starknet::ContractAddress;
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess}; // Map still needed for token_owners

    use starterpack::interface::IStarterpackImplementation as IStarterpack;
    use starterpack::types::item::ItemTrait;
    use starterpack::types::metadata::MetadataTrait;

    use openzeppelin_token::erc721::interface::IERC721Metadata;
    use crate::interface::{IERC721, IStarterpackRegistryDispatcher, IStarterpackRegistryDispatcherTrait};

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);

    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnlyImpl = ERC721Component::ERC721CamelOnlyImpl<ContractState>;

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
        description: ByteArray,
        token_count: u256,
        token_owners: Map<ContractAddress, u256>,
        starterpack_id: u32,
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
        owner: ContractAddress,
        name: ByteArray,
        symbol: ByteArray,
        description: ByteArray,
        base_uri: ByteArray,
    ) {
        self.erc721.initializer(name, symbol, base_uri);
        self.access_control.initializer();
        self.description.write(description);

        self.access_control._grant_role(DEFAULT_ADMIN_ROLE, owner);
        self.access_control._grant_role(MINTER_ROLE, owner);
    }

    #[abi(embed_v0)]
    impl ERC721AdminImpl of IERC721<ContractState> {
        fn add_minter(ref self: ContractState, minter: ContractAddress) {
            self.access_control.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.access_control._grant_role(MINTER_ROLE, minter);
        }

        fn set_starterpack(ref self: ContractState, registry: ContractAddress, name: ByteArray, description: ByteArray, image_uri: ByteArray) -> u32 {
            self.access_control.assert_only_role(DEFAULT_ADMIN_ROLE);
            let dispatcher = IStarterpackRegistryDispatcher { contract_address: registry };
            let this = starknet::get_contract_address();

            let item = ItemTrait::new(name: name.clone(), description: description.clone(), image_uri: image_uri.clone());
            let metadata = MetadataTrait::new(
                name: name,
                description: description,
                image_uri: image_uri,
                items: [item].span(),
                tokens: [].span(),
            ).jsonify();

            let starterpack_id = dispatcher
                .register(
                    implementation: this,
                    referral_percentage: 0,
                    reissuable: true,
                    price: core::num::traits::Zero::zero(),
                    payment_token: core::num::traits::Zero::zero(),
                    payment_receiver: Option::Some(this),
                    metadata: metadata,
                );

            self.starterpack_id.write(starterpack_id);
            starterpack_id
        }

        fn mint(ref self: ContractState, recipient: ContractAddress) {
            self.access_control.assert_only_role(MINTER_ROLE);

            let token_count = self.token_count.read();
            self.erc721.mint(recipient, token_count);
            self.token_owners.write(recipient, token_count);
            self.token_count.write(token_count + 1);
        }

        fn get_token_id(self: @ContractState, recipient: ContractAddress) -> u256 {
            self.token_owners.read(recipient)
        }

        fn get_starterpack_id(self: @ContractState) -> u32 {
            self.starterpack_id.read()
        }
    }

    #[abi(embed_v0)]
    impl StarterpackImpl of IStarterpack<ContractState> {
        fn on_issue(
            ref self: ContractState, recipient: ContractAddress, starterpack_id: u32, quantity: u32,
        ) {
            assert(self.starterpack_id.read() == starterpack_id, 'Invalid starterpack');
            self.mint(recipient);
        }

        fn supply(self: @ContractState, starterpack_id: u32) -> Option<u32> {
            Option::None
        }
    }

    #[abi(embed_v0)]
    impl MetadataImpl of IERC721Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.name()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.symbol()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.erc721._require_owned(token_id);
            let name = self.erc721.name();
            let description = self.description.read();
            let image = self.erc721._base_uri();
            format!("data:application/json,{{\"name\":\"{name}\",\"description\":\"{description}\",\"image\":\"{image}\"}}")
        }
    }
}
