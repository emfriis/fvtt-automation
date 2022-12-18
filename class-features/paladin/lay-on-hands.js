// lay on hands
// on use

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (lastArg.tag === "OnUse") {
    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

    let creatureTypes = ["undead", "construct"];
    let illegal = creatureTypes.some(t => (tactorTarget.data.data.details?.race || tactorTarget.data.data.details?.type?.value)?.toLowerCase()?.includes(t));
    if (illegal) return ui.notifications.error(`You cannot use Lay on Hands on this target.`);
    
    let item = tactor.items.find(i => i.name === "Healing Pool");
    if (!item || !item.data.data.uses.value) return ui.notifications.error("No points to spend left in healing pool");
    let maxHeal = Math.max(item.data.data.uses.value, tactorTarget.data.data.attributes.hp.max - tactorTarget.data.data.attributes.hp.value);

    let content = `<p>Which <strong>Action</strong> would you like to do? [${item.data.data.uses.value}] points remaining.</p>`;
    let buttons = item.data.data.uses.value >= 5 ? { cure: { label: "Cure Condition", callback: () => cure() }, heal: { label: "Heal", callback: () => heal() } } : { heal: { label: "Heal", callback: () => heal() } }
    new Dialog({
        title: "Lay on Hands",
        content: content,
        buttons: buttons,
        default: "heal"
    }).render(true);

    // Condition Curing Function
    function cure() {
        let condition_list = ["Diseased", "Poisoned"];
        let effect = tactorTarget.effects.filter(i => condition_list.includes(i.data.label));
        let selectOptions = "";
        for (let i = 0; i < effect.length; i++) {
            let condition = effect[i].data.label;
            selectOptions += `<option value="${condition}">${condition}</option>`;
        }
        if (selectOptions === "") {
            return ui.notifications.warn(`There's nothing to Cure on ${lastArg.targets[0].name}.`);
        } else {
            let content_cure = `<p><em>Lay on Hands on ${lastArg.targets[0].name}.</em></p><p>Choose a Condition to Cure | [${item.data.data.uses.value}/${item.data.data.uses.max}] charges left.</p><form class="flexcol"><div class="form-group"><select id="element">${selectOptions}</select></div></form>`;
            new Dialog({
                title: `Lay on Hands: Curing`,
                content: content_cure,
                buttons: {
                    cure: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Cure!',
                        callback: async (html) => {
                            let element = html.find('#element').val();
                            let effect = tactorTarget.effects.find(i => i.data.label === element);
                            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorTarget.uuid, effects: [effect.id] });
                            item.update({"data.uses.value" : item.data.data.uses.value - 5});
                            let chatContent = `<div class="midi-qol-nobox"><div class="midi-qol-flex-container"><div>Cures ${element}:</div><div class="midi-qol-target-npc midi-qol-target-name" id="${lastArg.targets[0].data.id}"> ${lastArg.targets[0].name}</div><div><img src="${lastArg.targets[0].data.img}" width="30" height="30" style="border:0px"></img></div></div></div>`;
                            await wait(500);
                            let chatMessage = game.messages.get(lastArg.itemCardId);
                            let content = duplicate(chatMessage.data.content);
                            let searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
                            let replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${chatContent}`;
                            content = content.replace(searchString, replaceString);
                            chatMessage.update({ content: content });
                        }
                    }
                },
                default: "cure"
            }).render(true);
        }
    }
    
    // Healing Function
    function heal() {
        let content_heal = `<p><em>${tactor.name} lays hands on ${lastArg.targets[0].name}.</em></p><p>How many HP do you want to restore to ${lastArg.targets[0].name}?</p><form class="flexcol"><div class="form-group"><label for="num">HP to Restore: (Max = ${maxHeal})</label><input id="num" name="num" type="number" min="0" max="${maxHeal}"></input></div></form>`;
        new Dialog({
            title: `Lay on Hands: Healing`,
            content: content_heal,
            buttons: {
                heal: {
                    icon: '<i class="fas fa-check"></i>', label: 'Heal', callback: async (html) => {
                        let number = Math.floor(Number(html.find('#num')[0].value));
                        if (number < 1 || number > maxHeal) {
                            return ui.notifications.warn(`Invalid number of charges entered = ${number}.`);
                        } else {
                            const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                            if (applyDamage) await applyDamage.execute("ApplyDamage", tactor.uuid, tokenOrActorTarget.uuid, number, "healing", "magiceffect");
                            item.update({"data.uses.value" : item.data.data.uses.value - number});
                        }
                    }
                }
            },
            default: "heal"
        }).render(true);
    }
}