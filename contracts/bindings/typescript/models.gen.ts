import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `ronin_quest::models::RoninAnswers` struct
export interface RoninAnswers {
	game_id: BigNumberish;
	answers: Array<BigNumberish>;
}

// Type definition for `ronin_quest::models::RoninGames` struct
export interface RoninGames {
	game_id: BigNumberish;
	games: Array<string>;
}

// Type definition for `ronin_quest::models::RoninPact` struct
export interface RoninPact {
	game_id: BigNumberish;
	pact: string;
}

// Type definition for `ronin_quest::controller::eip191::Eip191Signer` struct
export interface Eip191Signer {
	eth_address: EthAddress;
}

// Type definition for `ronin_quest::controller::eip191::Signer` enum
export const signer = [
	'Eip191',
] as const;
export type Signer = {
	Eip191: Eip191Signer,
};
export type SignerEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	ronin_quest: {
		RoninAnswers: RoninAnswers,
		RoninGames: RoninGames,
		RoninPact: RoninPact,
		Eip191Signer: Eip191Signer,
	},
}
export const schema: SchemaType = {
	ronin_quest: {
		RoninAnswers: {
			game_id: 0,
			answers: [0],
		},
		RoninGames: {
			game_id: 0,
			games: [""],
		},
		RoninPact: {
			game_id: 0,
			pact: "",
		},
		Eip191Signer: {
		eth_address: EthAddress,
		},
	},
};
export enum ModelsMapping {
	RoninAnswers = 'ronin_quest-RoninAnswers',
	RoninGames = 'ronin_quest-RoninGames',
	RoninPact = 'ronin_quest-RoninPact',
	Eip191Signer = 'ronin_quest-Eip191Signer',
	Signer = 'ronin_quest-Signer',
}
