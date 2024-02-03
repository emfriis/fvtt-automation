try {
    if (args[0].workflow.overchannel) {
        let newDamageRoll = args[0].workflow.damageRoll;
        newDamageRoll.terms.forEach(async t => {
            if (!t.faces) return;
            t.results.forEach(async r => {
                if (r.result >= t.faces) return;
                Object.assign(r, { rerolled: true, active: false });
                t.results.push({ result: t.faces, active: true, hidden: true });
                newDamageRoll._total = newDamageRoll._evaluateTotal();
            });
            await args[0].workflow.setDamageRoll(newDamageRoll);
        });
    }
    if (args[0].tag != "DamageBonus" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || args[0].item.type != "spell" || args[0].spellLevel == 0 || args[0].spellLevel > 5 || !["msak", "rsak", "save", "other"].includes(item.system.actionType) || args[0].damageRoll.terms.find(t => ["healing", "temphp", "midi-none", ""].includes(t.flavor.toLowerCase())) || !((item.flags?.["tidy5e-sheet"]?.parentClass.toLowerCase().includes("wizard") || item.system.chatFlavor).toLowerCase().includes("wizard") || (!item.flags?.["tidy5e-sheet"]?.parentClass && !item.system.chatFlavor && ["prepared", "always"].includes(item.system?.preparation?.mode)))) return;
    const uses = args[0].actor.flags["midi-qol"]?.overchannel;
    const usesEffect = args[0].actor.effects.find(e => e.name.includes("Overchannel Fatigue"));
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Overchannel",
        content: `
        <form id="use-form">
            <p>Use Overchannel to maximise damage?</p>
            ${uses ? "<p>(You have already used this ability " + uses + " time(s) since your last Long Rest. Using it again will inflict " + (+uses + 1) * args[0].spellLevel + "d12 Necrotic damage.)</p>" : ""}
        </form>
        `,
        buttons: {
            confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: () => {resolve(true)}
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => {resolve(false)}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    useFeat = await dialog;
    if (!useFeat) return;
    let newDamageRoll = args[0].workflow.damageRoll;
	newDamageRoll.terms.forEach(async t => {
		if (!t.faces) return;
		t.results.forEach(async r => {
			if (r.result >= t.faces) return;
			Object.assign(r, { rerolled: true, active: false });
            t.results.push({ result: t.faces, active: true, hidden: true });
            newDamageRoll._total = newDamageRoll._evaluateTotal();
		});
		await args[0].workflow.setDamageRoll(newDamageRoll);
	});
    if (uses && usesEffect) {
        const effectData = {
            changes: [{ key: "system.traits.dr.value", mode: 0, value: "-necrotic", priority: 20 }, { key: "system.traits.di.value", mode: 0, value: "-necrotic", priority: 20 }],
            name: "Overchannel Damage Override",
            origin: args[0].item.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["1Spell","isDamaged","endCombat"] } }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const itemData = {
            name: "Overchannel Fatigue",
            img: "icons/magic/water/projectile-ice-snowball.webp",
            type: "feat",
            system: {
                activation: { type: "special" },
                target: { type: "self" },
                actionType: "other",
                damage: { parts: [[`${(+uses + 1) * args[0].spellLevel}d12`, "necrotic"]] }
            },
            flags: { autoanimations: { isEnabled: true } }
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
        await MidiQOL.completeItemUse(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false });
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: usesEffect.id, changes: [{ key: "flags.midi-qol.overchannel", mode: 0, value: +uses + 1, priority: 20 }] }] });
    } else {
        const effectData = {
            changes: [{ key: "flags.midi-qol.overchannel", mode: 0, value: 1, priority: 20 }],
            name: "Overchannel Fatigue",
            icon: "icons/magic/water/projectile-ice-snowball.webp",
            origin: args[0].item.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    args[0].workflow.overchannel = false;
} catch (err) {console.error("Overchannel Macro - ", err)}