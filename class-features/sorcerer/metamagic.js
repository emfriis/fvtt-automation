// metamagic

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const usesItem = tactor.items.find(i => i.name === "Sorcery Points");
if (!usesItem || !usesItem.data.data.uses.value) return;

if (args[0].tag !== "OnUse" || lastArg.item.type !== "spell") return;

try {
    const item = await fromUuid(lastArg.uuid);
    if (lastArg.macroPass === "preItemRoll" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(item.data.data.activation.type)) {
        let metamagicContent = "";
        let carefulItem = tactor.items.find(i => i.name === "Metamagic: Careful Spell");
        if (carefulItem && item.data.data.save?.dc && item.data.data.save?.ability) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="careful"><img src="${carefulItem.data.img}" style="border:0px; width: 50px; height:50px;">Careful Spell<br>(1 Sorcery Point)</label>`;
        let distantItem = tactor.items.find(i => i.name === "Metamagic: Distant Spell");
        if (distantItem && (item.data.data.range?.value || item.data.data.range?.units === "touch")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="distant"><img src="${distantItem.data.img}" style="border:0px; width: 50px; height:50px;">Distant Spell<br>(1 Sorcery Point)</label>`;
        let extendedItem = tactor.items.find(i => i.name === "Metamagic: Extended Spell");
        if (extendedItem && item.data.data.duration?.value) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="extended"><img src="${extendedItem.data.img}" style="border:0px; width: 50px; height:50px;">Extended Spell<br>(1 Sorcery Point)</label>`;
        let heightenedItem = tactor.items.find(i => i.name === "Metamagic: Heightened Spell")
        if (heightenedItem && item.data.data.save?.dc && item.data.data.save?.ability && usesItem.data.data.uses.value >= 3) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="heightened"><img src="${heightenedItem.data.img}" style="border:0px; width: 50px; height:50px;">Heightened Spell<br>(3 Sorcery Points)</label>`;
        let quickenedItem = tactor.items.find(i => i.name === "Metamagic: Quickened Spell") 
        if (quickenedItem && item.data.data.activation.type === "action" && !tactor.effects.find(i => i.data.label === "Bonus Action")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="quickened"><img src="${quickenedItem.data.img}" style="border:0px; width: 50px; height:50px;">Quickened Spell<br>(1 Sorcery Point)</label>`;
        let subtleItem = tactor.items.find(i => i.name === "Metamagic: Subtle Spell");
        if (subtleItem && (item.data.data.components?.vocal || item.data.data.components?.somatic)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="subtle"><img src="${subtleItem.data.img}" style="border:0px; width: 50px; height:50px;">Subtle Spell<br>(1 Sorcery Point)</label>`;
        let transmutedItem = tactor.items.find(i => i.name === "Metamagic: Transmuted Spell");
        if (transmutedItem && item.data.data.damage?.parts?.length && !["healing", "temphp"].includes(item.data.data.damage.parts[0][1])) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="transmuted"><img src="${transmutedItem.data.img}" style="border:0px; width: 50px; height:50px;">Transmuted Spell<br>(1 Sorcery Point)</label>`;
        let twinnedItem = tactor.items.find(i => i.name === "Metamagic: Twinned Spell");
        if (twinnedItem && ["action", "bonus"].includes(item.data.data.activation.type) && ["ally", "creature", "enemy"].includes(item.data.data.target.type) && item.data.data.target.value === 1 && usesItem.data.data.uses.value >= Math.max(1, lastArg.spellLevel)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="twinned"><img src="${twinnedItem.data.img}" style="border:0px; width: 50px; height:50px;">Twinned Spell (${Math.max(1, lastArg.spellLevel)}<br>Sorcery Point${Math.max(1, lastArg.spellLevel) > 1 ? "s" : ""})</label>`;
        if (metamagicContent === "") return;
        let content = `
            <style>
            .metamagic .form-group {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: flex-start;
            }

            .metamagic .radio-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                justify-items: center;
                flex: 1 0 25%;
                line-height: normal;
            }

            .metamagic .radio-label input {
                display: none;
            }

            .metamagic img {
                border: 0px;
                width: 50px;
                height: 50px;
                flex: 0 0 50px;
                cursor: pointer;
            }

            /* CHECKED STYLES */
            .metamagic [type=radio]:checked + img {
                outline: 2px solid #f00;
            }
            </style>
            <form class="metamagic">
            <div class="form-group" id="metamagics">
                ${metamagicContent}
            </div>
            <div>
                <p>(${usesItem.data.data.uses.value} Sorcery Point${usesItem.data.data.uses.value > 1 ? "s" : ""} Remaining)</p>
            </div>
            </form>
        `;
        let dialog = new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Metamagic",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let metamagic = $("input[type='radio'][name='metamagic']:checked").val();
                            if (metamagic === "careful") {
                                const effectData = {
                                    changes: [{ key: "flags.midi-qol.carefulSpell", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },],
                                    disabled: false,
                                    label: "Metamagic: Careful Spell",
                                    flags: { dae: { specialDuration: ["1Spell"] } }
                                }
                                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                                let targeting =  new Promise(async (resolve, reject) => {
                                    new Dialog({
                                        title: "Metamagic: Careful Spell",
                                        content: `<p>Target any creatures you want to protect</p>`,
                                        buttons: {
                                            Ok: {
                                                label: "Ok",
                                                callback: () => {resolve(true)},
                                            },
                                        },
                                        default: "Ok",
                                        close: () => {resolve(false)}
                                    }).render(true);
                                });
                                await targeting;
                                await usesItem.update({ "data.uses.value": usesItem.data.data.value - 1 });
                            }
                            if (metamagic === "quickened") {
                                if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactor.uuid });
                                await usesItem.update({ "data.uses.value": usesItem.data.data.value - 1 });
                            }
                            if (metamagic === "twinned") {
                                await usesItem.update({ "data.uses.value": usesItem.data.data.value - Math.max(1, lastArg.spellLevel) });
                            }
                            resolve(true);
                        },
                    },
                },
                default: "Confirm",
            }).render(true);
        });
        await dialog;
    } else if (lastArg.macroPass === "postDamageRoll" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(item.data.data.activation.type)) {
        if (!(tactor.items.find(i => i.name === "Metamagic: Empowered Spell") && item.data.data.damage?.parts?.length && !["healing", "temphp"].includes(item.data.data.damage.parts[0][1]))) return;

    }
} catch (err) {
    console.error("Metamagic macro error", err);
}