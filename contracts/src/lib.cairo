pub mod systems {
    pub mod actions;
}

pub mod models;

pub mod controller {
    pub mod eip191;
    pub mod interface;
}

pub mod token {
    pub mod pact;
    pub mod svg;
}

#[cfg(test)]
mod tests {
    mod actions;
    mod mocks;
    mod svg;
}
