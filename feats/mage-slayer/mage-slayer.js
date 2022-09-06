// mage slayer
// requires MIDI-QOL, DAE

const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const targetToken = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

async function msCheck(workflow) {
	let target = Array.from(workflow.targets)[0];
    if (!target) return;
	let targetId = target.id ?? target._id;
	let attackerToken = canvas.tokens.get(workflow.tokenId);

    if (["spell"].includes(workflow.item.data.type) && lastArg.tokenId == targetId && MidiQOL.getDistance(targetToken, attackerToken, false) <= 5) {
		const effectData = {
            changes: [
                {
                    key: "flags.midi-qol.advantage.ability.save.all",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: 1,
                    priority: 20,
                }
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            label: `Mage Slayer Save Advantage`,
        };
        await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}

async function applyDis() {
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    for (let t of workflow.hitTargets) {
        tAct = t.actor ? t.actor : t;
        const effectData = {
            changes: [
                {
                    key: "flags.midi-qol.disadvantage.concentration",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: 1,
                    priority: 20,
                }
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["isDamaged"] } },
            duration: {turns: 1, startTime: game.time.worldTime},
            label: `Mage Slayer Save Disadvantage`,
        };
        await tAct.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
}

if (args[0] === "on") {
    let hookId = Hooks.on("midi-qol.preCheckSaves", msCheck);
    DAE.setFlag(tactor, "msHook", hookId);
}

if (args[0] === "off") {
    const flag = await DAE.getFlag(tactor, "msHook");
	if (flag) {
		Hooks.off("midi-qol.preCheckSaves", flag);
		await DAE.unsetFlag(tactor, "msHook");
	}
}

if (args[0].macroPass === "preDamageApplication") {
    await applyDis();
}