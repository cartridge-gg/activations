use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC721<TContractState> {
    fn add_minter(ref self: TContractState, minter: ContractAddress);
    fn add_starterpack(ref self: TContractState, registry: ContractAddress, name: ByteArray, description: ByteArray, image_uri: ByteArray) -> u32;
    fn mint(ref self: TContractState, recipient: ContractAddress);
    fn get_token_id(self: @TContractState, recipient: ContractAddress) -> u256;
}

#[starknet::interface]
pub trait IStarterpackRegistry<TContractState> {
    fn register(
        ref self: TContractState,
        implementation: ContractAddress,
        referral_percentage: u8,
        reissuable: bool,
        price: u256,
        payment_token: ContractAddress,
        payment_receiver: Option<ContractAddress>,
        metadata: ByteArray,
    ) -> u32;
    fn update(
        ref self: TContractState,
        starterpack_id: u32,
        implementation: ContractAddress,
        referral_percentage: u8,
        reissuable: bool,
        price: u256,
        payment_token: ContractAddress,
        payment_receiver: Option<ContractAddress>,
    );
    fn update_metadata(ref self: TContractState, starterpack_id: u32, metadata: ByteArray);
}
