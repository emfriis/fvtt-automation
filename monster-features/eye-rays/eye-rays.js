// eye rays (beholder)
// on use pre item roll

const lastArg = args[args.length - 1];

const roll = new Roll(`1d10`).evaluate({ async: false });
if (game.dice3d) game.dice3d.showForRoll(roll);

let rayData;


const itemData = mergeObject(duplicate(sourceItem.data), rayData);