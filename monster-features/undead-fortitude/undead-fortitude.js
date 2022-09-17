// undead fortitude world macro

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP, damageDetail: i?.damageDetail }));
    if (!attackWorkflow) return;
    attackWorkflow.forEach( async (a) => {
        let tokenOrActor = await fromUuid(a?.tokenUuid);
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        if (!tactor.items.find(i => i.name === "Undead Fortitude")) return;
        if (a?.damageDetail.find(d => Array.isArray(d) && d[0]?.type === "radiant") || workflow?.isCritical || a?.oldHP < 1) return;
        const rollOptions = { chatMessage: true, fastForward: true };
        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactor.uuid, ability: "con", options: rollOptions });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total >= a?.appliedDamage + 5) {
            tactor.update({"data.attributes.hp.value" : 1});
        }
    }); 
});

// undead fortitude

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "each") {
    const flag = await DAE.getFlag(tactor, "fortHook");
	if (!flag) {
        let hookId = Hooks.on("preUpdateToken", async (scene, tokenData, updateData, options) => {
            let hp = getProperty(updateData, "actorData.data.attributes.hp.value")
            let undeadActor = game.actors.get(tokenData.actorId)
            let token = canvas.tokens.get(tokenData._id)
            let feature = undeadActor.items.find(i => i.name === "Undead Fortitude")
            if (hp === 0 && (feature !== null) && !options.skipUndeadCheck) {
                console.log("test");
                let content = `
                <form>
                    <div class="form-group">
                        <label for="num">Damage to target: </label>
                        <input id="num" name="num" type="number" min="0"></input>
                    </div>
                </form>`;
                new Dialog({
                    title: "Undead Fortitude Save",
                    content: content,
                    buttons: {
                        one: {
                            label: "Radiant Damage or Crit",
                            callback: () => {
                                token.update({hp: 0}, {skipUndeadCheck: true})
                                return;
                            },
                        },
                        two: {
                            label: "Normal Damage",
                            callback: async (html) => {
                                let roll = await token.actor.rollAbilitySave(`con`);
                                let number = Number(html.find("#num")[0].value);
                                console.log(number)
                                if (roll.total >= (5 + number)) {
                                    console.log("survives")
                                    token.update({"actorData.data.attributes.hp.value": 1 }, {skipUndeadCheck: true});
                                } else if(roll.total < (5 + number)) {
                                    console.log("dies")
                                    token.update({"actorData.data.attributes.hp.value": 0}, {skipUndeadCheck: true})
                                }
                        },
                        },
                    },
                }).render(true);
            return false;
            } else return true;
        });
        DAE.setFlag(tactor, "fortHook", hookId);
    }
}

if (args[0] === "off") {
    const flag = await DAE.getFlag(tactor, "fortHook");
	if (flag) {
		Hooks.off("preUpdateToken", flag);
		await DAE.unsetFlag(tactor, "fortHook");
	}
}

