try {
    const lastArg = args[args.length - 1];
    if (args[0] != "on" || (game.combat && lastArg.tokenId == game.combat.current?.tokenId)) return;
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1])?.actor;
    const dmgData = lastArg.efData.changes.find(c => c.key == "flags.midi-qol.OverTime").value.split(",");
    const label = dmgData.find(d => /\s*label\s*=/.test(d))?.replace(/\s*label\s*=/, "")?.trim();
    const damageRoll = dmgData.find(d => /\s*damageRoll\s*=/.test(d))?.replace(/\s*damageRoll\s*=/, "").trim();
    const damageType = dmgData.find(d => /\s*damageType\s*=/.test(d))?.replace(/\s*damageType\s*=/, "").trim();
    const saveDamage = dmgData.find(d => /\s*saveDamage\s*=/.test(d))?.replace(/\s*saveDamage\s*=/, "").trim();
    const saveAbility = dmgData.find(d => /\s*saveAbility\s*=/.test(d))?.replace(/\s*saveAbility\s*=/, "").trim();
    const saveDC = dmgData.find(d => /\s*saveDC\s*=/.test(d))?.replace(/\s*saveDC\s*=/, "").trim();
    const saveMagic = dmgData.find(d => /\s*saveMagic\s*=/.test(d))?.replace(/\s*saveAbility\s*=/, "").trim() == "true" ? true : false;
    const killAnim = dmgData.find(d => /\s*killAnim\s*=/.test(d))?.replace(/\s*killAnim\s*=/, "").trim() == "true" ? true : false;
    if (!damageRoll || !damageType || (saveAbility && !saveDC) || (saveDC && !saveAbility)) return console.error("Invalid Arguments for Template Aura Entry Damage Macro");
    const itemData = {
        name: label ?? lastArg.efData.name,
        img: lastArg.efData.icon,
        type: "feat",
        flags: { midiProperties: { magiceffect: saveMagic, fulldam: saveDamage == "fulldamage" ? true : false, halfdam: saveDamage == "halfdamage" ? true : false, nodam: saveDamage == "nodamage" ? true : false }, autoanimations: { isEnabled: !killAnim } },
        system: {
            activation: { type: "special" },
            target: { value: 1, type: "creature", prompt: false },
            actionType: saveAbility && saveDC ? "save" : "other",
            consume: { type: null, target: null, amount: null, scale: false },
            uses: { prompt: false },
            damage: { parts: [[damageRoll, damageType]] },
            save: { ability: saveAbility ?? null, dc: saveDC ?? null, scaling: "flat" }
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: source ?? actor });
    await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
} catch (err) {console.error("Template Aura Entry Damage Macro - ", err)}