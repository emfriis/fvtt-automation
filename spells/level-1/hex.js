// hex
// on use post effects
// damage bonus
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// create effects and reapply item
if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
    const item = tactor.items.find(i => i.name === "Hex" && i.type === "spell");
    const isReapply = lastArg.item.name !== "Hex";
    const conc = tactor.effects.find(e => e.data.label === "Concentrating");

    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

    let ability;
    if (isReapply) {
        ability = tactor.data.flags["midi-qol"]?.hexAbility;
        if (!ability) return;

        // check previous target
        const prevTarget = canvas.tokens.get(tactor.data.flags["midi-qol"]?.hexTarget);
        const prevTactor = prevTarget?.actor;
        if (prevTactor && prevTactor.data.data.attributes.hp.value !== 0) {
            ui.notifications.warn("Previous target still above 0 hit points");
            return;
        } else if (prevTactor) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: prevTactor.uuid, effects: [prevTactor.effects.find(e => e.data.label === "Hex" && e.data.origin === item.uuid)?.id] });
        }
    } else {
        const durationSeconds = lastArg.itemLevel > 4 ? 86400 : lastArg.itemLevel > 2 ? 28800 : 3600;

        // select ability
        let dialog = new Promise((resolve, reject) => {
            new Dialog({
                title: `Hex: Usage Configuration`,
                content: `
                    <p>Choose a type of ability check to give the target disadvantage on:</p>
                    <div class="form-group">
                        <select name="abilities"}>
                            <option value="str">Strength</option>
                            <option value="dex">Dexterity</option>
                            <option value="con">Consitution</option>
                            <option value="int">Intelligence</option>
                            <option value="wis">Wisdom</option>
                            <option value="cha">Charisma</option>
                        </select>
                    </div>
                `,
                buttons: {
                    Confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: (html) => resolve(html.find("[name=abilities]")[0].value)
                    },
                    Cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        ability = await dialog;
        if (!ability) return;

        // create self effect and update concentration
        let effectData1 = {
            label: "Hex Damage Bonus",
            icon: item.img,
            origin: item.uuid,
            disabled: false,
            flags: { dae: { itemData: item.data, token: tactorTarget.uuid, } },
            duration: { seconds: durationSeconds },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData1] });
        if (conc) {
            let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
            await concUpdate.push({ tokenUuid: tokenOrActor.uuid, actorUuid: tactor.uuid });
            await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: conc.id, duration: { seconds: durationSeconds } }] });
        }

        // create reapply item
        const itemData = mergeObject(duplicate(item.data), {
            name: "Reapply Hex",
            type: "feat",
            data: {
                components: {concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false},
            }
        }, {overwrite: true, inlace: true, insertKeys: true, insertValues: true});
        await tactor.createEmbeddedDocuments("Item", [itemData]);
    }

    // create target effect
    let effectData2 = {
        label: item.name,
        icon: item.img,
        changes: [
            { key: `flags.midi-qol.disadvantage.ability.check.${ability}`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
            { key: `flags.midi-qol.hex`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.tokenId, priority: 20 },
        ],
        origin: item.uuid,
        disabled: false,
        flags: { dae: { itemData: item.data, token: tactorTarget.uuid, } , core: { statusId: item.name }},
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData2] });

    // update self effect
    const sourceEffect = tactor.effects.find(e => e.data.label === "Hex Damage Bonus" && e.data.origin === item.uuid);
    const targetEffect = tactorTarget.effects.find(e => e.data.label === "Hex" && e.data.origin === item.uuid);
    if (sourceEffect && targetEffect) {
        const changes = [
            { key: `flags.dnd5e.DamageBonusMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.Hex`, priority: 20 },
            { key: `flags.midi-qol.hexAbility`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: ability, priority: 20 },
            { key: `flags.midi-qol.hexTarget`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.targets[0].id, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: targetEffect.uuid, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
        ];
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: sourceEffect.id, changes: changes }] });
    }
}

// mark damage bonus
if (args[0].tag === "DamageBonus" && ["mwak","rwak","msak","rsak"].includes(lastArg.item.data.actionType) && lastArg.targets.find(t => t.actor.data.flags["midi-qol"]?.hex?.includes(lastArg.tokenId))) {
    const diceMult = lastArg.isCritical ? 2 : 1;
    return { damageRoll: `${diceMult}d6[necrotic]`, flavor: "Hex" }
}

// remove reapply item
if (args[0] === "off" && lastArg.efData.label === "Hex Damage Bonus") {
    const removeItem = tactor.items.find(i => i.name === "Reapply Hex");
    if (removeItem) await tactor.deleteEmbeddedDocuments("Item", [removeItem.id]);
}