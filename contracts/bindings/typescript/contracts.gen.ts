import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_completeChi_calldata = (tokenId: BigNumberish, questions: Array<BigNumberish>, answers: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "complete_chi",
			calldata: [tokenId, questions, answers],
		};
	};

	const actions_completeChi = async (snAccount: Account | AccountInterface, tokenId: BigNumberish, questions: Array<BigNumberish>, answers: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_completeChi_calldata(tokenId, questions, answers),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_completeShin_calldata = (tokenId: BigNumberish, signer: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "complete_shin",
			calldata: [tokenId, signer],
		};
	};

	const actions_completeShin = async (snAccount: Account | AccountInterface, tokenId: BigNumberish, signer: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_completeShin_calldata(tokenId, signer),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_completeWaza_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "complete_waza",
			calldata: [tokenId],
		};
	};

	const actions_completeWaza = async (snAccount: Account | AccountInterface, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_completeWaza_calldata(tokenId),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_mint_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "mint",
			calldata: [],
		};
	};

	const actions_mint = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_mint_calldata(),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_setGames_calldata = (games: Array<string>): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "set_games",
			calldata: [games],
		};
	};

	const actions_setGames = async (snAccount: Account | AccountInterface, games: Array<string>) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_setGames_calldata(games),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_setPact_calldata = (pact: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "set_pact",
			calldata: [pact],
		};
	};

	const actions_setPact = async (snAccount: Account | AccountInterface, pact: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_setPact_calldata(pact),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_setQuiz_calldata = (answers: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "set_quiz",
			calldata: [answers],
		};
	};

	const actions_setQuiz = async (snAccount: Account | AccountInterface, answers: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_setQuiz_calldata(answers),
				"ronin_quest",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			completeChi: actions_completeChi,
			buildCompleteChiCalldata: build_actions_completeChi_calldata,
			completeShin: actions_completeShin,
			buildCompleteShinCalldata: build_actions_completeShin_calldata,
			completeWaza: actions_completeWaza,
			buildCompleteWazaCalldata: build_actions_completeWaza_calldata,
			mint: actions_mint,
			buildMintCalldata: build_actions_mint_calldata,
			setGames: actions_setGames,
			buildSetGamesCalldata: build_actions_setGames_calldata,
			setPact: actions_setPact,
			buildSetPactCalldata: build_actions_setPact_calldata,
			setQuiz: actions_setQuiz,
			buildSetQuizCalldata: build_actions_setQuiz_calldata,
		},
	};
}