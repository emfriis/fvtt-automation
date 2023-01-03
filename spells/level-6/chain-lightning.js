// chain lightning
// on use post targeting

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const itemUuid = lastArg.uuid;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preambleComplete" && lastArg.targets.length === 1) {

    const sourceToken = canvas.tokens.get(lastArg.targets[0].id);
    const sourceTokenGS = sourceToken.w / canvas.grid.size;
    const radius = 30;
    const size = ((sourceTokenGS / canvas.grid.size) + 0.5 + (radius / canvas.dimensions.distance)) * 2;
    const userColor = game.user?.data?.color ? "0x" + game.user.data.color.replace(/^#/, '') : 0x0D26FF;
    const filePath = "modules/autoanimations/src/images/teleportCircle.png";
    const fileAnim = "jb2a.chain_lightning.secondary.blue";
    const fileSound = "https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/attack/lightning-attack-2.ogg";
    const maxTargets = lastArg.spellLevel - 3;

    function sequencerEffect(target, origin = null) {
        new Sequence()
            .effect()
            .atLocation(origin)
            .stretchTo(target)
            .file(Sequencer.Database.entryExists(fileAnim))
            .repeats(1, 200, 300)
            .randomizeMirrorY()
            .sound()
            .file(fileSound)
        .play();
    }

    sequencerEffect(sourceToken, token);

    let aaSeq01 = new Sequence()
        aaSeq01.effect()
        .file(filePath)
        .atLocation(sourceToken)
        .size(size, {gridUnits: true})
        .fadeIn(500)
        .scaleIn(0, 500)
        .fadeOut(500)
        .name("chain-lightning-radius")
        .belowTokens(true)
        .persist(true)
        .opacity(0.5)
        .filter("Glow", {
            distance: 10,
            outerStrength: 5,
            innerStrength: 5,
            color: userColor,
            quality: 0.2,
        })
        .forUsers(Array.from(game.users).map(user => user.id))
    aaSeq01.play()

    let targetsDialog =  new Promise(async (resolve, reject) => {
        new Dialog({
            title: `${lastArg.item.name}`,
            content: `<p>Target up to ${maxTargets} creatures within 30 feet of the first target.</p>`,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => { resolve(Array.from(game.user?.targets)) },
                },
            },
            default: "Ok",
            close: () => { resolve(false) },
        }).render(true);
    });
    let targets = await targetsDialog;

    if (!targets) {
        Sequencer.EffectManager.endEffects({ name: "chain-lightning-radius" });
        return ui.notifications.warn(`No Additional Targets Selected`);
    }
    if (targets.length > maxTargets) {
        Sequencer.EffectManager.endEffects({ name: "chain-lightning-radius" });
        return ui.notifications.warn(`Too many targets selected (${maxTargets} Maximum)`);
    }

    let finalTargets = [sourceToken];
    for (let t = 0; t < targets.length; t++) {
        if (MidiQOL.getDistance(sourceToken, targets[t], false) <= 30 && sourceToken.document.uuid !== targets[t].document.id) {
            finalTargets.push(targets[t]);
            sequencerEffect(targets[t], sourceToken);
        }
    }
    let hook = Hooks.on("midi-qol.preCheckSaves", async (workflowNext) => {
        if (workflowNext.uuid === itemUuid) {
            workflowNext.targets = new Set(finalTargets);
            workflowNext.hitTargets = new Set(finalTargets);
            Hooks.off("midi-qol.preCheckSaves", hook);
        }
    });
    Sequencer.EffectManager.endEffects({ name: "chain-lightning-radius" });
}