// dimension door
// on use
// Credit to Auto Animations for the macro

const sourceToken = canvas.tokens.get(args[0].tokenId);
const sourceTokenGS = sourceToken.w / canvas.grid.size;
const sizes = ["tiny","sm","med","lg","huge","grg"];
const validTarget = args[0].targets.length && args[0].targets[0].data.disposition === sourceToken.data.disposition && MidiQOL.getDistance(sourceToken, args[0].targets[0], false) <= 5 && args[0].targets[0].actor && sizes.indexOf(args[0].targets[0].actor.data.data.traits.size) <= sizes.indexOf(sourceToken.actor.data.data.traits.size);
const targetToken = validTarget ? args[0].targets[0] : null;
if (args[0].targets.length && !validTarget) ui.notifications.warn("Target cannot be teleported with you");
const radius = 500;
const userColor = game.user?.data?.color ? "0x" + game.user.data.color.replace(/^#/, '') : 0x0D26FF;
const filePath = "modules/autoanimations/src/images/teleportCircle.png";
const fileIn = "jb2a.misty_step.01.purple";
const fileOut = "jb2a.misty_step.02.purple";
const fileSound = "https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/effect/teleport-1.ogg";

let aaSeq01 = new Sequence()
    aaSeq01.effect()
    .file(filePath)
    .atLocation(sourceToken)
    .size(((sourceTokenGS / canvas.grid.size) + 0.5 + (radius / canvas.dimensions.distance)) * 2, {gridUnits: true})
    .fadeIn(500)
    .scaleIn(0, 500)
    .fadeOut(500)
    .name("teleportation")
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

let pos;
canvas.app.stage.addListener('pointerdown', event => {
    if (event.data.button !== 0) { return }
    pos = event.data.getLocalPosition(canvas.app.stage);

    let topLeft = canvas.grid.getTopLeft(pos.x, pos.y);

    if (checkDistance(sourceToken, { x: topLeft[0], y: topLeft[1] }) <= radius) {
        deleteTemplatesAndMove();
        canvas.app.stage.removeListener('pointerdown');
    } else {
        ui.notifications.warn("Selected location not in range");
    };
});

async function deleteTemplatesAndMove() {

    let gridPos = canvas.grid.getTopLeft(pos.x, pos.y);
    let centerPos;
    if (canvas.scene.gridType === 0) {
        centerPos = [gridPos[0] + sourceToken.w, gridPos[1] + sourceToken.w];
    } else {
        centerPos = canvas.grid.getCenter(pos.x, pos.y);
    }

    Sequencer.EffectManager.endEffects({ name: "teleportation" });

    let aaSeq = new Sequence();
    aaSeq.effect()
        .file(fileIn)
        .atLocation(sourceToken)
        .size(sourceTokenGS, {gridUnits: true})
        .randomRotation()
    aaSeq.sound()
        .file(fileSound)
    aaSeq.wait(250)
    aaSeq.animation()
        .on(sourceToken)
        .opacity(0)
        .teleportTo({ x: gridPos[0], y: gridPos[1] })
    if (targetToken) aaSeq.animation()
        .on(targetToken)
        .opacity(0)
        .teleportTo({ x: gridPos[0], y: gridPos[1] - 100 })
    aaSeq.effect()
        .file(fileOut)
        .atLocation({ x: centerPos[0], y: centerPos[1] })
        .size(sourceTokenGS, {gridUnits: true})
        .randomRotation()
    aaSeq.wait(1250)
    aaSeq.animation()
        .on(sourceToken)
        .opacity(1)
    if (targetToken) aaSeq.animation()
        .on(targetToken)
        .opacity(1)
    aaSeq.play()
};

// Credit to TPosney / Midi-QOL for the Range Check
function checkDistance(source, target) {
    var x, x1, y, y1, d, r, segments = [], rdistance, distance;
    for (x = 0; x < source.data.width; x++) {
        for (y = 0; y < source.data.height; y++) {
            const origin = new PIXI.Point(...canvas.grid.getCenter(source.data.x + (canvas.dimensions.size * x), source.data.y + (canvas.dimensions.size * y)));
            for (x1 = 0; x1 < 1; x1++) {
                for (y1 = 0; y1 < 1; y1++) {
                    const dest = new PIXI.Point(...canvas.grid.getCenter(target.x + (canvas.dimensions.size * x1), target.y + (canvas.dimensions.size * y1)));
                    const r = new Ray(origin, dest);
                    segments.push({ ray: r });
                };
            };
        };
    };
    if (segments.length === 0) {
        return -1;
    };
    rdistance = canvas.grid.measureDistances(segments, { gridSpaces: true });
    distance = rdistance[0];
    rdistance.forEach(d => {
        if (d < distance)
            distance = d;
    });
    return distance;
};