//turn undead
try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete") game.user.updateTokenTargets(args[0].targets.filter(t => ["undead"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)) || ["undead"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)).map(t => t.id)));
} catch (err) {console.error("Turn the Unholy Macro - ", err);}

//turn the faithless
try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete") game.user.updateTokenTargets(args[0].targets.filter(t => ["fey", "fiend"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)) || ["fey", "fiend"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)).map(t => t.id)));
} catch (err) {console.error("Turn the Unholy Macro - ", err);}

//turn the unholy
try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete") game.user.updateTokenTargets(args[0].targets.filter(t => ["undead", "fiend"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)) || ["undead", "fiend"].some(c => t.actor.system.details?.type?.value?.toLowerCase()?.includes(c)).map(t => t.id)));
} catch (err) {console.error("Turn the Unholy Macro - ", err);}
