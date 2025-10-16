// Minimal Controller interface for checking signer ownership
// This is a local copy of the IMultipleOwners interface from controller-cairo
// to avoid the heavy dependency while still allowing runtime calls to Controller accounts

#[starknet::interface]
pub trait IMultipleOwners<T> {
    fn is_owner(self: @T, guid: felt252) -> bool;
}
