// Minimal EIP-191 signer implementation for Discord integration
// Based on controller-cairo's Eip191Signer but without heavy dependencies
// See https://github.com/cartridge-gg/controller-cairo/blob/main/src/signer/signer_signature.cairo

use starknet::EthAddress;
use core::poseidon;

// Signer type constant - must match controller-cairo's implementation
const EIP191_SIGNER_TYPE: felt252 = 'Eip191 Signer';

// Helper function matching controller-cairo's implementation exactly
#[inline(always)]
fn poseidon_2(a: felt252, b: felt252) -> felt252 {
    let (hash, _, _) = poseidon::hades_permutation(a, b, 2);
    hash
}

/// EIP-191 signer struct - contains only the Ethereum address
#[derive(Drop, Copy, Serde, PartialEq)]
pub struct Eip191Signer {
    pub eth_address: EthAddress,
}

/// Simplified Signer enum - only supports Eip191 for our use case
#[derive(Drop, Copy, Serde, PartialEq)]
pub enum Signer {
    Eip191: Eip191Signer,
}

/// Trait for converting signers to GUIDs
pub trait SignerTrait {
    fn into_guid(self: Signer) -> felt252;
}

/// Implementation of SignerTrait
pub impl SignerTraitImpl of SignerTrait {
    /// Converts an Eip191 signer to its GUID
    fn into_guid(self: Signer) -> felt252 {
        match self {
            Signer::Eip191(signer) => {
                poseidon_2(EIP191_SIGNER_TYPE, signer.eth_address.into())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Signer, Eip191Signer, SignerTrait, EIP191_SIGNER_TYPE, poseidon_2};
    use starknet::EthAddress;

    #[test]
    fn test_into_guid() {
        // Create a test Ethereum address using try_into
        let eth_addr: EthAddress = 0x1234567890abcdef_felt252.try_into().unwrap();
        let signer = Signer::Eip191(Eip191Signer { eth_address: eth_addr });

        // Compute GUID
        let guid = signer.into_guid();

        // Verify it's deterministic using the same method
        let expected_guid = poseidon_2(EIP191_SIGNER_TYPE, 0x1234567890abcdef_felt252);
        assert(guid == expected_guid, 'GUID mismatch');
    }

    #[test]
    fn test_guid_deterministic() {
        // Same input should produce same GUID
        let eth_addr: EthAddress = 0xdeadbeef_felt252.try_into().unwrap();
        let signer1 = Signer::Eip191(Eip191Signer { eth_address: eth_addr });
        let signer2 = Signer::Eip191(Eip191Signer { eth_address: eth_addr });

        assert(signer1.into_guid() == signer2.into_guid(), 'Not deterministic');
    }

    #[test]
    fn test_different_addresses_different_guids() {
        // Different addresses should produce different GUIDs
        let eth_addr1: EthAddress = 0x1111_felt252.try_into().unwrap();
        let eth_addr2: EthAddress = 0x2222_felt252.try_into().unwrap();

        let signer1 = Signer::Eip191(Eip191Signer { eth_address: eth_addr1 });
        let signer2 = Signer::Eip191(Eip191Signer { eth_address: eth_addr2 });

        assert(signer1.into_guid() != signer2.into_guid(), 'GUIDs should differ');
    }
}
