const lastArg=args[args.length-1];
let effectData={flags:{dae:{specialDuration:["turnStart"]}},changes:[{key:`StatusEffect`,mode:5, value:`Convenient Effect: Poisoned`,priority:20}]};
await MidiQOL.socket().executeAsGM("createEffects",{actorUuid:lastArg.actorUuid,effects:[effectData]});