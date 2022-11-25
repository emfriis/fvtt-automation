// thorns world macro
// flag syntax range(int[range]),damageDice(str[rollable]),damageType(str[damage]),saveDC(str["none"] or int[dc]),saveType(str["none" or abil]),saveDamage(str["none" or "nodam" or "halfdam"]),magicEffect(str["none" or "magiceffect"])

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function applyDamage(tokenUuid, actor, damageDice, damageType, saveDC, saveType, saveDamage, magicEffect) {
    const itemData = {
        name: `${damageType.charAt(0).toUpperCase() + damageType.slice(1)} Damage`,
        img: "icons/skills/melee/strike-slashes-orange.webp",
        type: "feat",
        "flags.midiProperties": {
            magiceffect: (magicEffect === "magiceffect" ? true : false),
            nodam: (saveDamage === "nodam" ? true : false),
            halfdam: (saveDamage === "halfdam" ? true : false)
        },
        data: {
            "activation.type": "none",
            actionType: (saveDC === "none" ? "other" : "save"),
            damage: { parts: [[damageDice, damageType]] },
            save: { dc: (saveDC === "none" ? null : parseInt(saveDC)), ability: (saveType === "none" ? null : saveType), scaling: "flat" },
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
            const thorns = t.actor.data.flags["midi-qol"].thorns.split(",");
            if (["mwak","msak"].includes(workflow.item.data.data.actionType) && MidiQOL.getDistance(t, workflow.token, false) <= parseInt(thorns[0])) {
                await applyDamage(workflow?.tokenUuid, t.actor, thorns[1], thorns[2], thorns[3], thorns[4], thorns[5], thorns[6]);
            }
        });
    } catch(err) {
        console.error(`thorns macro error`, err);
    }
});