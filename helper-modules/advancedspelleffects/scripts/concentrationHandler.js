import { aseSocket } from "./aseSockets.js";
import * as utilFunctions from "./utilityFunctions.js";
//Importing spells
import { darkness } from "./spells/darkness.js";
import { detectMagic } from "./spells/detectMagic.js";
import { callLightning } from "./spells/callLightning.js";
import { fogCloud } from "./spells/fogCloud.js";
import { summonCreature } from "./spells/summonCreature.js";
import { witchBolt } from "./spells/witchBolt.js";
import { vampiricTouch } from "./spells/vampiricTouch.js";
import { moonBeam } from "./spells/moonBeam.js";
import { wallOfForce } from "./spells/wallOfForce.js";
import { detectStuff } from "./spells/detectStuff.js";
import { wallSpell } from "./spells/wallSpell.js";

export class concentrationHandler {

    static registerHooks() {
        Hooks.on("deleteActiveEffect", concentrationHandler._handleConcentration);
    }

    static async _handleConcentration(activeEffect) {
        console.log("Handling removal of Concentration: ", activeEffect);
        const isGM = utilFunctions.isFirstGM();
        //console.log("Is first GM: ", isGM);
        if (!isGM) return;
        if (activeEffect.data.label != 'Concentration' && activeEffect.data.label != game.i18n.localize("ASE.ConcentratingLabel")) return;
        let origin = activeEffect.data.origin?.split(".");
        //console.log("Origin: ", origin);
        if (!origin || origin?.length < 4) return false;
        let itemId = origin[5] ?? origin[3];
        let casterActor;
        let casterToken;
        let effectSource;
        if (origin[0] == "Actor") {
            casterActor = game.actors.get(origin[1]);
            casterToken = await casterActor.getActiveTokens()[0];
        }
        else {
            casterToken = canvas.tokens.get(origin[3]);
            casterActor = casterToken.actor;
        }
        effectSource = casterActor.items.get(itemId).name;
        //console.log("ASE Concentration removed - Effect Source: ", effectSource);
        let item = casterActor.items.filter((item) => item.name == effectSource)[0] ?? undefined;
        if (!item) return;
        let aseEnabled = item.getFlag("advancedspelleffects", 'enableASE') ?? false;
        let effectOptions = item.getFlag("advancedspelleffects", 'effectOptions') ?? {};
        if (!aseEnabled) return;
        const spellEffect = item.getFlag("advancedspelleffects", 'spellEffect') ?? undefined;

        switch (spellEffect) {
            case game.i18n.localize("ASE.Darkness"):
                await darkness.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.DetectMagic'):
                await detectMagic.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.DetectStuff'):
                await detectStuff.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.CallLightning'):
                await callLightning.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.FogCloud'):
                await fogCloud.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.WitchBolt'):
                await witchBolt.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.VampiricTouch'):
                await vampiricTouch.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.Moonbeam'):
                await moonBeam.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.WallOfForce'):
                await wallOfForce.handleConcentration(casterActor, casterToken, effectOptions);
                return;
            case game.i18n.localize('ASE.WallSpell'):
                await wallSpell.handleConcentration(casterActor, casterToken, effectOptions);
                return;
        }
        if (effectSource.includes(game.i18n.localize("ASE.Summon"))) {
            summonCreature.handleConcentration(casterActor, casterToken, effectOptions);
            return;
        }
        console.log("ASE: Effect source not recognized...");
    }

    static async addConcentration(actor, item) {
        //console.log("item in addConcentration: ", item);
        let selfTarget = item.actor.token ? item.actor.token.object : utilFunctions.getSelfTarget(item.actor);
        if (!selfTarget)
            return;

        let concentrationName = game.i18n.localize("ASE.ConcentratingLabel");
        const inCombat = (game.combat?.turns.some(combatant => combatant.token?.id === selfTarget.id));
        const effectData = {
            changes: [],
            origin: item.uuid,
            disabled: false,
            icon: "modules/advancedspelleffects/icons/concentrate.png",
            label: concentrationName,
            duration: {},
            flags: { "advancedspelleffects": { isConcentration: item?.uuid } }
        };
        const convertedDuration = utilFunctions.convertDuration(item.data.data.duration, inCombat);
        if (convertedDuration?.type === "seconds") {
            effectData.duration = { seconds: convertedDuration.seconds, startTime: game.time.worldTime };
        }
        else if (convertedDuration?.type === "turns") {
            effectData.duration = {
                rounds: convertedDuration.rounds,
                turns: convertedDuration.turns,
                startRound: game.combat?.round,
                startTurn: game.combat?.turn
            };
        }
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        //console.log("Done creating and adding effect to actor...");
        return true;
        // return await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

    }

}