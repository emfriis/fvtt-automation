// counterspell
// uses handler of user-socket-functions - "useDialog"

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels) throw new Error("requisite module(s) missing");

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); };

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
};

const fileSource = "jb2a.impact.004.blue";
const fileRanged = "jb2a.energy_strands.range.standard.blue";
const fileTarget = "jb2a.impact.005.blue";
const fileSound = "https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/effect/dispel-1.ogg";
async function sequencerEffect(source, target) {
    if (game.modules.get("sequencer")?.active && hasProperty(Sequencer.Database.entries, "jb2a")) {
        new Sequence().effect().file(fileSource).atLocation(source).scaleToObject(1.5).sound().file(fileSound).play();
        new Sequence().effect().file(fileRanged).atLocation(source).stretchTo(target).play();
        new Sequence().wait(1250).effect().file(fileTarget).atLocation(target).scaleToObject(3).play();
    };
};

Hooks.on("midi-qol.preambleComplete", async (workflow) => {
    if (!workflow?.token || !["spell"].includes(workflow.item.data.type)) return;
    if (workflow?.actor?.effects.find(i => i.data.label === "Metamagic: Subtle Spell") && !workflow.item.data.data?.components?.material) return;
    let counterTokens = await canvas.tokens.placeables.filter(t => {
        let token = (
            t?.actor && // exists
            t?.document.uuid !== workflow.token.document.uuid && // not caster
            t?.data.disposition !== workflow.token.data.disposition && // not friendly
            t?.actor.items.find(i => i.data.name === "Counterspell" && i.data.type === "spell") && // has feature
            !t?.actor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated") && // can react
            MidiQOL.getDistance(t, workflow.token, false) <= 60 && // in range
            (game.modules.get('conditional-visibility')?.api?.canSee(t, workflow.token) && _levels?.advancedLosTestVisibility(t, workflow.token)) && // can see
            Object.keys(t.actor.data.data.spells).find(i => (i === "pact" && t.actor.data.data.spells[i].level >= 3 && t.actor.data.data.spells[i].value > 0) || (parseInt(i.slice(-1)) >= 3 && t.actor.data.data.spells[i].value > 0)) // can cast
        );
        return token;
    });
    if (counterTokens?.length === 0) return;
    for (let c = 0; c < counterTokens.length; c++) {
        let token = counterTokens[c];
        if (!token?.actor) return;
        let player = await playerForActor(token?.actor);
        let socket = socketlib.registerModule("user-socket-functions");
        let verbal = workflow.item.data.data?.components?.verbal;
        let somatic = workflow.item.data.data?.components?.somatic;
        let material = workflow.item.data.data?.components?.material;
        let useCounter = false;
        useCounter = await socket.executeAsUser("useDialog", player.id, { title: `Counterspell`, content: `
            Use your reaction to cast counterspell? <br>
            (Spell cast with components: ${verbal && (somatic || material) ? "verbal, " : verbal ? "verbal" : ""}${somatic && material ? "somatic, " : somatic ? "somatic" : ""}${material ? "material" : ""})
            ` 
        });
        if (useCounter) {
            let counterCast = false;
            counterCast = await MidiQOL.completeItemRoll(token.actor.items.find(i => i.name === "Counterspell" && i.data.type === "spell"), { targetUuids: [workflow.token.document.uuid] });
            sequencerEffect(token, workflow.token);
            if (!counterCast?.countered) {
                let level = counterCast.itemLevel;
                if (level >= workflow.itemLevel) {
                    if (!workflow.item.name.toLowerCase().includes("counter")) return false;
                    workflow.countered = true;
                } else {
                    let rollOptions = { chatMessage: true, fastForward: true };
                    let roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "abil", targetUuid: token.actor.uuid, ability: (token.actor.data.data.attributes?.spellcasting ?? "int"), options: rollOptions });
                    if (game.dice3d) game.dice3d.showForRoll(roll);
                    if (roll.total >= workflow.itemLevel + 10) {
                        if (!workflow.item.name.toLowerCase().includes("counter")) return false;
                        workflow.countered = true;
                    };
                };
            };
        };
    };
});