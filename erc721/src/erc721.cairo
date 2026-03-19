#[starknet::interface]
pub trait IERC721<TContractState> {
    fn mint(ref self: TContractState, to: starknet::ContractAddress, token_id: u256);
    fn set_base_uri(ref self: TContractState, base_uri: ByteArray);
}

#[starknet::contract]
mod ERC721 {
    use starknet::ContractAddress;
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};

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
        minter: ContractAddress,
    ) {
        self.erc721.initializer(name, symbol, base_uri);
        self.access_control.initializer();
        self.access_control._grant_role(DEFAULT_ADMIN_ROLE, owner);
        self.access_control._grant_role(MINTER_ROLE, minter);
    }

    #[abi(embed_v0)]
    impl ERC721Impl of super::IERC721<ContractState> {
        fn mint(ref self: ContractState, to: ContractAddress, token_id: u256) {
            self.access_control.assert_only_role(MINTER_ROLE);
            self.erc721.mint(to, token_id);
        }

        fn set_base_uri(ref self: ContractState, base_uri: ByteArray) {
            self.access_control.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.erc721._set_base_uri(base_uri);
        }
    }
}

#[cfg(test)]
mod tests {
    use snforge_std::{
        declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
        stop_cheat_caller_address,
    };
    use core::serde::Serde;
    use starknet::ContractAddress;
    use super::{IERC721Dispatcher, IERC721DispatcherTrait};
    use openzeppelin_token::erc721::interface::{
        IERC721Dispatcher as OzIERC721Dispatcher,
        IERC721DispatcherTrait as OzIERC721DispatcherTrait,
    };

    fn OWNER() -> ContractAddress {
        'OWNER'.try_into().unwrap()
    }

    fn MINTER() -> ContractAddress {
        'MINTER'.try_into().unwrap()
    }

    fn USER() -> ContractAddress {
        'USER'.try_into().unwrap()
    }

    fn USER2() -> ContractAddress {
        'USER2'.try_into().unwrap()
    }

    fn deploy() -> ContractAddress {
        let contract = declare("ERC721").unwrap().contract_class();
        let mut calldata: Array<felt252> = array![];
        let name: ByteArray = "TestNFT";
        let symbol: ByteArray = "TNFT";
        let base_uri: ByteArray = "ipfs://base/";
        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        base_uri.serialize(ref calldata);
        OWNER().serialize(ref calldata);
        MINTER().serialize(ref calldata);
        let (addr, _) = contract.deploy(@calldata).unwrap();
        addr
    }

    #[test]
    fn test_mint() {
        let addr = deploy();
        let nft = IERC721Dispatcher { contract_address: addr };
        let oz = OzIERC721Dispatcher { contract_address: addr };

        start_cheat_caller_address(addr, MINTER());
        nft.mint(USER(), 1);
        stop_cheat_caller_address(addr);

        assert(oz.owner_of(1) == USER(), 'wrong owner after mint');
        assert(oz.balance_of(USER()) == 1, 'wrong balance after mint');
    }

    #[test]
    fn test_transfer() {
        let addr = deploy();
        let nft = IERC721Dispatcher { contract_address: addr };
        let oz = OzIERC721Dispatcher { contract_address: addr };

        start_cheat_caller_address(addr, MINTER());
        nft.mint(USER(), 1);
        stop_cheat_caller_address(addr);

        start_cheat_caller_address(addr, USER());
        oz.transfer_from(USER(), USER2(), 1);
        stop_cheat_caller_address(addr);

        assert(oz.owner_of(1) == USER2(), 'wrong owner after transfer');
        assert(oz.balance_of(USER()) == 0, 'sender balance not 0');
        assert(oz.balance_of(USER2()) == 1, 'receiver balance not 1');
    }

    #[test]
    #[should_panic]
    fn test_mint_unauthorized() {
        let addr = deploy();
        let nft = IERC721Dispatcher { contract_address: addr };

        start_cheat_caller_address(addr, USER());
        nft.mint(USER(), 1);
    }
}
