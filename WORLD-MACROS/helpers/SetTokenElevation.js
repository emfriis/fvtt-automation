// set token elevation
// trigger on enter or exit drawing

if (args && args.length > 1 && token && region && token.data.elevation >= (region.data.flags?.levels?.rangeBottom ?? -9999) && token.data.elevation <= (region.data.flags?.levels?.rangeTop ?? 9999)) {
    let enterVal = parseFloat(args[0]);
    let exitVal = parseFloat(args[1]);
    if (event && event === MLT.ENTER && token.actor && (token.data.elevation < enterVal || token.actor.data.data.attributes.movement.fly <= 0)) {
        token.update({ "elevation": enterVal });
    } else if (event && event === MLT.LEAVE && token.actor && token.actor.data.data.attributes.movement.fly <= 0) {
        token.update({ "elevation": exitVal });
    }
}