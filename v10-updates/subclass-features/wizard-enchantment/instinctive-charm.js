//reaction=="isAttacked"&&!traits.ci.value.has("charmed")&&MidiQOL.computeDistance(canvas.tokens.get(targetId),canvas.tokens.get(tokenId),false)<=30&&MidiQOL.canSee(canvas.tokens.get(targetId),canvas.tokens.get(tokenId))&&!target.flags["midi-qol"]?.instinctiveCharm?.includes(actorUuid)&&canvas.tokens.placeables.find(t=> t.actor&&MidiQOL.typeOrRace(t.actor)&&t.id!=targetId&&t.id!=tokenId&&MidiQOL.canSense(canvas.tokens.get(tokenId),t)&&(MidiQOL.computeDistance(canvas.tokens.get(tokenId),t,false)<=item.range.long??item.range.value))

try {
    if (args[0].macroPass != "postActiveEffects") return;
    if (args[0].failedSaves.length) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.grants.attack.fail.all", mode: 0, value: "1", priority: 20 }],
            disabled: false,
            name: args[0].item.name,
            icon: args[0].item.img,
            duration: { seconds: 7, rounds: 1, seconds: 1 },
            flags: { dae: { specialDuration: ["1Reaction", "isAttacked", "combatEnd"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    } else {
        const effect = args[0].actor.effects.find(e => e.name.includes(args[0].item.name + " Failures"));
        if (effect && args[0].actor.flags["midi-qol"].instinctiveCharm) {
            const changes = [{ key: "flags.midi-qol.instinctiveCharm", mode: 0, value: args[0].actor.flags["midi-qol"].instinctiveCharm + args[0].targets[0].actor.uuid, priority: 20 }];
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
        } else {
            const effectData = {
                changes: [{ key: "flags.midi-qol.instinctiveCharm", mode: 0, value: args[0].targets[0].actor.uuid, priority: 20 }],
                disabled: false,
                name: args[0].item.name + " Failures",
                icon: args[0].item.img,
                flags: { dae: { specialDuration: ["longRest"] } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        }
    } 
} catch (err)  {console.error("Instinctive Charm Macro - ", err)}

/*
try {
    if (args[0].macroPass != "postActiveEffects") return;
    if (args[0].failedSaves.length) {
        const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
        const possibleTargets = canvas.tokens.placeables.filter(t => t.actor && MidiQOL.typeOrRace(t.actor) && t.id != args[0].workflow.token.id && t.id != args[0].targets[0].id && MidiQOL.canSense(args[0].targets[0], t) && (MidiQOL.computeDistance(args[0].targets[0], t, false) <= attackWorkflow.item.system.range.long ?? attackWorkflow.item.system.range.value));
        if (!possibleTargets.length) {
            const effectData = {
                changes: [{ key: "flags.midi-qol.grants.attack.fail.all", mode: 0, value: "1", priority: 20 }],
                disabled: false,
                name: args[0].item.name,
                icon: args[0].item.img,
                duration: { seconds: 7, rounds: 1, seconds: 1 },
                flags: { dae: { specialDuration: ["1Reaction", "isAttacked", "combatEnd"] } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        } else if (possibleTargets.length == 1) {
            attackWorkflow.targets = new Set([possibleTargets[0]]);
        } else {
            const closestDistance = possibleTargets.reduce((acc, curr) => Math.min(MidiQOL.computeDistance(args[0].targets[0], acc, false), MidiQOL.computeDistance(args[0].targets[0], curr, false)));
            const closestTargets = possibleTargets.filter(t => MidiQOL.computeDistance(args[0].targets[0], t, false) == closestDistance);
            if (closestTargets.length == 1) {
                attackWorkflow.targets = new Set([closestTargets[0]]);
            } 
            let targetContent = "";
            closestTargets.forEach((target) => { targetContent += `<label class="radio-label"><input type="radio" name="target" value="${target.id}"><img src="${target.texture.src ?? target.document.texture.src}" style="border: 0px; width 50px; height: 50px;"></label>` });
            const content = `
                <style>
                .target .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
                .target .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
                .target .radio-label input { display: none; }
                .target img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
                .target [type=radio]:checked + img { outline: 2px solid #f00; }
                </style>
                <div style="display: flex; flex-direction: row; align-items: center; text-align: center; justify-content: center;">
                    <p>Choose a new target for the attack:</p>
                </div>
                <form class="target">
                <div class="form-group" id="targets">
                    ${targetContent}
                </div>
                </form>
            `;
            let target = await new Promise((resolve) => {
                new Dialog({
                    title: "Instinctive Charm",
                    content: content,
                    buttons: {
                        Confirm: { 
                            label: "Confirm",
                            callback: async () => {
                                let newTarget = canvas.tokens.get($("input[type='radio'][name='target']:checked").val());
                                if (!newTarget) newTarget = closestTargets[0];
                                resolve(newTarget);
                            }
                        }
                    },
                    close: () => {
                        let newTarget = canvas.tokens.get($("input[type='radio'][name='target']:checked").val());
                        if (!newTarget) newTarget = closestTargets[0];
                        resolve(newTarget);
                    }
                }).render(true);
            });
            if (!target) {
                const effectData = {
                    changes: [{ key: "flags.midi-qol.grants.attack.fail.all", mode: 0, value: "1", priority: 20 }],
                    disabled: false,
                    name: args[0].item.name,
                    icon: args[0].item.img,
                    duration: { seconds: 7, rounds: 1, seconds: 1 },
                    flags: { dae: { specialDuration: ["1Reaction", "isAttacked", "combatEnd"] } }
                };
                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
            } else {
                attackWorkflow.targets = new Set([target]);
            }
        }
    } else {
        const effect = args[0].actor.effects.find(e => e.name.includes(args[0].item.name + " Failures"));
        if (effect && args[0].actor.flags["midi-qol"].instinctiveCharm) {
            const changes = [{ key: "flags.midi-qol.instinctiveCharm", mode: 0, value: args[0].actor.flags["midi-qol"].instinctiveCharm + args[0].targets[0].actor.uuid, priority: 20 }];
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
        } else {
            const effectData = {
                changes: [{ key: "flags.midi-qol.instinctiveCharm", mode: 0, value: args[0].targets[0].actor.uuid, priority: 20 }],
                disabled: false,
                name: args[0].item.name + " Failures",
                icon: args[0].item.img,
                flags: { dae: { specialDuration: ["longRest"] } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        }
    } 
} catch (err)  {console.error("Instinctive Charm Macro - ", err)}
*/