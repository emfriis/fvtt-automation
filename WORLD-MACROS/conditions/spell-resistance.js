// spell resistance world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    try {
        if (!workflow?.actor || workflow?.item.data.type !== "spell" || workflow.item.data.data.actionType !== "save") return;
        const targets = Array.from(workflow?.targets);
        const resist = ["Spell Resilience", "Spell Resistance"];
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token?.actor;
            if (tactor.effects.find(e => resist.includes(e.data.label)) || tactor.items.find(i => resist.includes(i.name))) {
                const effectData = {
                    changes: [ { key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, } ],
                    disabled: false,
                    flags: { dae: { specialDuration: ["isSave"] } },
                    label: "Spell Save Advantage"
                }
                await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            }
        }
    } catch(err) {
        console.error(`spell resistance macro error`, err);
    }
});