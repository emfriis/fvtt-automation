// relentless world macro

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
    if (!attackWorkflow) return;
    attackWorkflow.forEach( async (a) => {
        let tokenOrActor = await fromUuid(a?.tokenUuid);
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        let featItem = await tactor.items.find(i => i.name === "Relentless");
        let damageThreshold = getProperty(tactor.data.flags, "midi-qol.relentlessThreshold");
        if (!featItem || !featItem.data.data.uses.value || featItem.data.data.uses.value === 0 || !damageThreshold || a?.oldHP < 1) return;
        if (a?.appliedDamage > 0 && a?.newHP < 1 && a?.appliedDamage <= damageThreshold) {
            tactor.update({"data.attributes.hp.value" : 1});
            featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
        }
    }); 
});

// relentless
// args[1] is threshold for damage allowing feature usage

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceItem = await fromUuid(lastArg.efData.origin);
const tactorItem = await tactor.items.find(i => i.name === sourceItem.name);
const damageThreshold = args[1];

async function damageCheck(workflow) {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenId: i?.tokenId, hpDamage: i?.hpDamage, newHP: i?.newHP })).filter(i => i.tokenId === lastArg.tokenId);
    if (!attackWorkflow || tactorItem.data.data.uses.value < 1) return;
    let lastAttack = attackWorkflow[attackWorkflow.length - 1];
    if (lastAttack?.hpDamage > 0 && lastAttack?.newHP < 1 && lastAttack?.hpDamage <= damageThreshold) {
        new Dialog({
            title: "Relentless: Use Feature?",
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => {
                        tactor.update({"data.attributes.hp.value": 1});
				        let uncon = tactor.effects.find(i => i.data.label === "Unconscious");
				        if (uncon) actor.deleteEmbeddedDocuments("ActiveEffect", [uncon.id]);
                        let objUpdate = new Object();
                        objUpdate['data.uses.value'] = tactorItem.data.data.uses.value - 1;
                        tactorItem.update(objUpdate);
                    },
                },
                Cancel: {
                    label: "Cancel",
                },
            },
            default: "Cancel",
        }).render(true);
    }
}

if (args[0] === "each") { // start of turn macros always run on combat start
    const flag = await DAE.getFlag(tactor, "relHook");
    if (!flag) {
        let hookId = Hooks.on("midi-qol.RollComplete", damageCheck);
        DAE.setFlag(tactor, "relHook", hookId);
    }
}

if (args[0] === "off") {
    const flag = await DAE.getFlag(tactor, "relHook");
	if (flag) {
		Hooks.off("midi-qol.RollComplete", flag);
		await DAE.unsetFlag(tactor, "relHook");
	}
}