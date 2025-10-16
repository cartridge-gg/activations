use starknet::ContractAddress;

// Owner configuration
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninOwner {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub owner: ContractAddress,
}

// Pact NFT contract address
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninPact {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub pact: ContractAddress,
}

// Controller contract address
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninController {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub controller: ContractAddress,
}

// Allowlisted game collections
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninGames {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub games: Array<ContractAddress>,
}

// Quiz answer hashes
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninAnswers {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub answers: Array<felt252>,
}
