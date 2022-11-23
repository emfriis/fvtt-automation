// armor of agathys world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function applyDamage(source, target) {
	const item = source.actor.items.find(i => i.data.name === "Armor of Agathys");
	const damageRoll = await new Roll(`${source.actor.data.flags["midi-qol"]?.agathys * 5 ?? 5}[cold]`).evaluate({ async: false });
	const workflowItemData = duplicate(item.data);
	workflowItemData.data.components.concentration = false;
	workflowItemData.data.duration = { value: null, units: "inst" };
	workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };
	setProperty(workflowItemData, "flags.itemacro", {});
	setProperty(workflowItemData, "flags.midi-qol", {});
	setProperty(workflowItemData, "flags.dae", {});
	setProperty(workflowItemData, "effects", []);
	delete workflowItemData._id;
	workflowItemData.name = `${workflowItemData.name}`;
	await new MidiQOL.DamageOnlyWorkflow(
    source.actor,
    source.data,
    damageRoll.total,
    "cold",
    [target],
    damageRoll,
    {
        flavor: `(${CONFIG.DND5E.damageTypes["cold"]})`,
        itemCardId: "new",
        itemData: workflowItemData,
        isCritical: false,
    });
};

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    try {
        if (!workflow?.actor) return;
        workflow?.hitTargets.forEach(async (t) => {
            if (!t?.actor || !t.actor.effects.find(i => i.data.label === "Armor of Agathys")) return;
            if (["mwak","msak"].includes(workflow.item.data.data.actionType) && MidiQOL.getDistance(t, workflow.token, false) <= 10) {
                await applyDamage(t, workflow?.token);
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