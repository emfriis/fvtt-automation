// stillness of mind
// on use

if (args[0].tag === "OnUse") {
    const tokenOrActor = await fromUuid(args[0].actorUuid);
    const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const effects = tactor.effects.filter(i => ["Charmed", "Frightened"].includes(i.data.label));
    const selectOptions = effects.reduce((list, activeEffect) => {
        let condition = activeEffect.data.label;
        list.push(`<option value="${condition}">${condition}</option>`);
        return list;
    }, []);
    if (selectOptions.length === 0) return ui.notifications.error("There are no valid effects to remove");
    const content = `<form class="flexcol"><div class="form-group"><select id="element">${selectOptions.join('')}</select></div></form>`;
    new Dialog({
        title:"Stillness of Mind",
        content: content,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Remove',
                callback: async (html) => {
                    let element = html.find('#element').val();
                    let effect = tactor.effects.find(i => i.data.label === element);
                    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                    let chatMessage = game.messages.get(args[0].itemCardId);
                    let chatContent = `<div class="midi-qol-nobox"><div class="midi-qol-flex-container"><div>Cures ${element}:</div><div class="midi-qol-target-npc midi-qol-target-name" id="${args[0].tokenId}"> ${tactor.name}</div><div><img src="${tokenOrActor.data.img}" width="30" height="30" style="border:0px"></img></div></div></div>`;
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