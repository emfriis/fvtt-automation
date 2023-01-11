// set token elevation
// trigger on enter or exit drawing

if (args && args.length > 1) {
    console.warn(region);
    let exitval = parseFloat(args[0]);
    let enterval = parseFloat(args[1]);
    let elevation = 0;
    if (event && event === MLT.ENTER) {
        elevation = enterval;
        if (token && token.actor && (token.data.elevation < enterval || !token.actor.data.data.attributes.movement.fly)) token.update({ "elevation": elevation });
    } else if (event && event === MLT.LEAVE) {
        elevation = exitval;
        console.warn(token && token.actor && !token.actor.data.data.attributes.movement.fly)
        if (token && token.actor && !token.actor.data.data.attributes.movement.fly) token.update({ "elevation": elevation });
    }
}