// lesser restoration

if (args[0].tag === "OnUse" && args[0].targetUuids.length > 0) {
    const tokenOrActorTarget = await fromUuid(args[0].targetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    const effects = tactorTarget.effects.filter(i => ["Blinded", "Deafened", "Paralyzed", "Diseased", "Poisoned"].includes(i.data.label));
    const selectOptions = effects.reduce((list, activeEffect) => {
        let condition = activeEffect.data.label;
        list.push(`<option value="${condition}">${condition}</option>`);
        return list;
    }, []);
    if (selectOptions.length === 0) return ui.notifications.error("There are no valid effects to cure on the target");
    const content = `<form class="flexcol"><div class="form-group"><select id="element">${selectOptions.join('')}</select></div></form>`;
    new Dialog({
        title:"Lesser Restoration",
        content: content,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Cure',
                callback: async (html) => {
                    let element = html.find('#element').val();
                    let effect = tactorTarget.effects.find(i => i.data.label === element);
                    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorTarget.uuid, effects: [effect.id] });
                    let chatMessage = game.messages.get(args[0].itemCardId);
                    let chatContent = `<div class="midi-qol-nobox"><div class="midi-qol-flex-container"><div>Cures ${element}:</div><div class="midi-qol-target-npc midi-qol-target-name" id="${args[0].targets[0].data._id}"> ${args[0].targets[0].name}</div><div><img src="${args[0].targets[0].data.img}" width="30" height="30" style="border:0px"></img></div></div></div>`;
                    let content = duplicate(chatMessage.data.content);
                    let searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
                    let replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${chatContent}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                    ui.chat.scrollBottom();
                }
            }
        },
        default: "yes"
    }).render(true);
}