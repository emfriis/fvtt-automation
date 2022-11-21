// shield master world macro
// uses handler of user-socket-functions - "useDialog"

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    if (!workflow?.token || !workflow?.targets || !["save"].includes(workflow.item.data.data.actionType)) return;
    if (workflow.item.data.data.save.ability !== "dex") return;
    let targets = Array.from(workflow.targets)
    if (targets.length > 1) return;
    for (let t = 0; t < targets.length; t++) {
        let token = targets[t];
        if (!token?.actor) continue;
        if (!token.actor.items.find(i => i.data.name === "Shield Master")) continue;
        let shieldAC = token.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data?.equipped)?.data?.data?.armor?.value;
        if (!shieldAC) continue;
        const effectData = {
            changes: [
                { key: "data.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: shieldAC, priority: 20, }
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            label: `Shield Master Save Bonus`,
        };
        await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    };
});

Hooks.on("midi-qol.postCheckSaves", async (workflow) => {
    if (!workflow?.token || !workflow?.targets || !["save"].includes(workflow.item.data.data.actionType)) return;
    if (workflow.item.data.data.save.ability !== "dex") return;
    if (workflow.item.data.data.damage.parts.length === 0) return;
    let targets = Array.from(workflow.targets)
    for (let t = 0; t < targets.length; t++) {
        let token = targets[t];
        if (!token?.actor) continue;
        if (!token.actor.items.find(i => i.data.name === "Shield Master")) continue;
        if (Array.from(workflow.failedSaves).includes(token)) continue;
        let shield = token.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data?.equipped);
        if (!shield) continue;
        let player = await playerForActor(token.actor);
        let socket = socketlib.registerModule("user-socket-functions");
        let useShield = false;
        useShield = await socket.executeAsUser("useDialog", player.id, { title: `Shield Master`, content: `Use your reaction to reduce damage to zero?` });
        if (useShield) {
            const effectData = {
                changes: [
                    { key: "data.traits.di.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }
                ],
                disabled: false,
                label: `Shield Master Damage Reduction`,
            };
            await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            Hooks.once("midi-qol.RollComplete", async () => {
                const ef = token.actor.effects.find(i => i.data.label === "Shield Master Damage Reduction");
                await token.actor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
            });
            if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: token.actor.uuid });
        };
    };
});