// thorns world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function applyDamage(tokenUuid, actor, damageDice, damageType) {
    const itemData = {
        name: `${damageType.charAt(0).toUpperCase() + damageType.slice(1)} Damage`,
        img: "icons/skills/melee/strike-slashes-orange.webp",
        type: "feat",
        data: {
            "activation.type": "none",
            actionType: "other",
            damage: { parts: [[damageDice, damageType]] },
            target: { value: null, width: null, units: null, type: "creature" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [tokenUuid] };
    await MidiQOL.completeItemRoll(item, options);
};

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    try {
        if (!workflow?.actor) return;
        workflow?.hitTargets.forEach(async (t) => {
            if (!t?.actor || !t.actor.data.flags["midi-qol"]?.thorns) return;
            if (["mwak","msak"].includes(workflow.item.data.data.actionType) && MidiQOL.getDistance(t, workflow.token, false) <= 5) {
                const thorns = t.actor.data.flags["midi-qol"].thorns.split(",");
                await applyDamage(workflow?.tokenUuid, t.actor, thorns[0], thorns[1]);
            }
        });
    } catch(err) {
        console.error(`thorns macro error`, err);
    }
});