import { DojoProvider, ExtractAbiTypes } from "@dojoengine/core";
import { compiledAbi } from "../../dojo/compiled-abi";
import { dojoConfig } from "../../lib/config";

type RoninQuestAbi = ExtractAbiTypes<typeof compiledAbi>;
type RoninQuestActions = RoninQuestAbi["interfaces"]["ronin_quest::systems::actions::IActions"];

export const dojoProvider = new DojoProvider<RoninQuestActions>(
    dojoConfig.manifest,
    dojoConfig.rpcUrl
);
