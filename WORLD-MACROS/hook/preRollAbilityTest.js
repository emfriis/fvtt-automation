// preRollAbilityTest

function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target) ?? true;
    let canSeeLOS = !_levels?.advancedLosTestInLos(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target) ?? true;
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ?? 9999), Math.max(token.data.dimSight, token.data.brightSight));
	    if (!vision || vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

Hooks.on("Actor5e.preRollAbilityTest", async (actor, rollData, abilityId) => {
    try {
        // frightened
        if (!rollData.disadvantage && actor.data.flags["midi-qol"].fear && !actor.data.data.traits.ci.value.includes("frightened")) {
            try {
                console.warn("Frightened activated");
                const token = actor?.token ?? canvas.tokens.placeables.find(t => t.actor.uuid === actor?.uuid);
                if (token) {
                    let fearIds = actor.data.flags["midi-qol"].fear.split("+");
                    for (let f = 0; f < fearIds.length; f++) {
                        let fearToken = canvas.tokens.get(fearIds[f]);
                        if (fearToken && canSee(token, fearToken)) {
                            rollData.disadvantage = true;
                            console.warn("Frightened used");
                            break;
                        }
                    }
                }
            } catch(err) {
                console.error("Frightened error", err);
            }
        }

        // remarkable athlete
        if (actor.data.flags["midi-qol"].remarkableAthlete && ["con", "dex", "str"].includes(abilityId)) {
            try {
                console.warn("Remarkable Athelete activated");
                rollData.parts.push(`${Math.ceil(actor.data.data.attributes.prof / 2)}`);
                console.warn("Remarkable Athelete used");
            } catch(err) {
                console.error("Remarkable Athelete error", err);
            }
        }
    } catch (err) {
        console.error("preRollAbilityTest error", err);
    }
});