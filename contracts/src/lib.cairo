pub mod systems {
    pub mod actions;
}

pub mod models;

pub mod controller {
    pub mod eip191;
    pub mod interface;
}

pub mod tokens {
    pub mod pact;
}

#[cfg(test)]
mod tests {
    mod actions;
    mod mocks;
}
