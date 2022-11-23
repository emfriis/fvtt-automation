// fs: protection world macro
// uses handler of user-socket-functions - "useDialog"

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels || !game.modules.get("perfect-vision")?.active) throw new Error("requisite module(s) missing");

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    try {
        if (!workflow?.token || !workflow?.targets || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
        let protTokens = await canvas.tokens.placeables.filter(t => {
            let token = (
                t?.actor && // exists
                t?.document.uuid !== workflow.token.document.uuid && // not attacker
                t?.actor.items.find(i => i.data.name === "Fighting Style: Protection") && // has feature
                t?.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped) && // shield equipped
                !t?.actor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated") && // can react
                (game.modules.get('conditional-visibility')?.api?.canSee(t, workflow.token) && _levels?.advancedLosTestVisibility(t, workflow.token)) // can see
            );
            return token;
        });
        if (protTokens.length === 0) return;
        for (let t = 0; t < workflow.targets.size; t++) {
            let token = Array.from(workflow.targets)[t];
            if (!token?.actor) return;
            for (let p = 0; p < protTokens.length; p++) {
                let prot = protTokens[p];
                if (MidiQOL.getDistance(prot, token, false) > 5 || prot.data.disposition === -token.data.disposition || prot.document.uuid === token.document.uuid) return;
                let player = await playerForActor(prot?.actor);
                let socket = socketlib.registerModule("user-socket-functions");
                let useProtect = false;
                useProtect = await socket.executeAsUser("useDialog", player.id, { title: `Fighting Style: Protection`, content: `Use your reaction to impose disadvantage on attack against ${token.name}?` });
                if (useProtect) {
                    workflow.disadvantage = true;
                    if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: prot.actor.uuid });
                }
            }
        }
    } catch(err) {
        console.error(`fighting style: protection macro error`, err);
    }
});