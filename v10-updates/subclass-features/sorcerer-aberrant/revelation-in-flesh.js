try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects") {
		let usesItem = args[0].actor.items.find(i => i.name == "Font of Magic" && i.system.uses?.value);
        if (!usesItem) return;
		let uses = usesItem.system.uses.value;
        let changes = [];
		await new Promise((resolve) => {
			new Dialog({
				title: "Revelation in Flesh",
				content: `
                <form id="use-form">
                    <p>Choose a number of features to gain for 10 minutes:</p>
                    <div class="form-group">
                        <input id="see" type="checkbox" name="consumeCheckbox">
                        <p>You can see any invisible creature within 60 feet of you, provided it isn't behind total cover.</p>
                    </div>
                    <div class="form-group">
                        <input id="fly" type="checkbox" name="consumeCheckbox">
                        <p>You gain a flying speed equal to your walking speed, and you can hover.</p>
                    </div>
                    <div class="form-group">
                        <input id="swim" type="checkbox" name="consumeCheckbox">
                        <p>You gain a swimming speed equal to twice your walking speed, and you can breathe underwater.</p>
                    </div>
                    <div class="form-group">
                        <input id="squeeze" type="checkbox" name="consumeCheckbox">
                        <p>You can move through any space as narrow as 1 inch without squeezing, and you can spend 5 feet of movement to escape from nonmagical restraints or being grappled.</p>
                    </div>
                    <p>(Each feature costs 1 Sorcery Point - ${uses} Sorcery Points Remaining)</p>
                </form>
				`,
				buttons: {
					confirm: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: () => {
							if ($("#see").is(":checked")) changes.push({ key: "ATL.detectionModes.seeInvisibility.range", mode: 4, value: "60", priority: "20" });
                            if ($("#fly").is(":checked")) changes.push({ key: "system.attributes.movement.fly", mode: 4, value: `${args[0].actor.system.attributes.movement.walk}`, priority: "20" });
                            if ($("#swim").is(":checked")) changes.push({ key: "system.attributes.movement.swim", mode: 4, value: `${args[0].actor.system.attributes.movement.walk}`, priority: "20" });
                            if ($("#squeeze").is(":checked")) changes.push({ key: "flags.midi-qol.revelationInFleshSqueeze", mode: 0, value: "1", priority: "20" });
                            if (changes.length > uses) {
                                return ui.notifications.warn("Not enough Sorcery Points");
                            } else {
                                resolve(true)
                            }
						}
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
		if (!changes.length) return;
		const effectData = {
			name: args[0].item.name,
			icon: args[0].item.img,
			origin: args[0].item.uuid,
			disabled: false,
            duration: { seconds: 600 },
			changes: changes
		}
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
		await usesItem.update({"system.uses.value": Math.max(0, usesItem.system.uses.value - changes.length)});
	}
} catch (err)  {console.error("Revelation in Flesh Macro - ", err); }