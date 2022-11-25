// armor of agathys world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function applyDamage(tokenUuid, actor, damageDice, damageType) {
    const itemData = {
        name: "Armor of Agathys",
        img: "icons/magic/water/ice-crystal-white.webp",
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
            if (!t?.actor || !t.actor.data.flags["midi-qol"]?.agathys) return;
            if (["mwak","msak"].includes(workflow.item.data.data.actionType) && MidiQOL.getDistance(t, workflow.token, false) <= 10) {
                await applyDamage(workflow?.tokenUuid, t.actor, t.actor.data.flags["midi-qol"].agathys * 5, "cold");
            };
            workflow?.damageList.forEach(async (d) => {
                if (d.tokenId !== t.id || d.newTempHP === d.oldTempHP) return;
                if (d.newTempHP < 1 || d.newTempHP > d.oldTempHP) {
                    let effect = t.actor.effects.find(i => i.data.label === "Armor of Agathys");
                    t.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
                }
            });
        });
    } catch(err) {
        console.error(`armor of agathys macro error`, err);
    }
});