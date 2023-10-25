//------------ pack tactics - flags.midi-qol.advantage.attack.all
//game.canvas.tokens.placeables.find(t => t.actor && !((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") && t.id !== canvas.tokens.controlled[0].id && t.id !== game.user.targets?.first().id && canvas.tokens.controlled[0].disposition === t.disposition && t.actor?.system?.attributes?.hp?.value > 0 && !(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label))) && MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5)
//game.canvas.tokens.placeables.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value==="custom"||t.actor?.system?.details?.type?.value==="")&&t.actor?.system?.details?.type?.custom==="")&&t.id!==canvas.tokens.controlled[0].id&&t.id!==game.user.targets?.first().id&&canvas.tokens.controlled[0].disposition===t.disposition&&t.actor?.system?.attributes?.hp?.value>0&&!(t.actor?.effects?.find(e=>["Incapacitated","Unconscious","Paralyzed","Petrified","Stunned"].includes(e.label)))&&MidiQOL.getDistance(t,game.user.targets?.first(),false)<=5)
//game.canvas.tokens.placeables.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value==="custom"||t.actor?.system?.details?.type?.value==="")&&t.actor?.system?.details?.type?.custom==="")&&t.id!==workflow.token.id&&t.id!==[...workflow.targets][0].id&&t.disposition===[...workflow.targets][0].disposition&&t.actor?.system?.attributes?.hp?.value>0&&!t.actor?.effects?.find(e=>["Incapacitated","Unconscious","Paralyzed","Petrified","Stunned"].includes(e.label))&&MidiQOL.getDistance(t,[...workflow.targets][0],false)<10)
game?.canvas?.tokens?.placeables?.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value=="custom"||t.actor?.system?.details?.type?.value=="")&&t.actor?.system?.details?.type?.custom=="")&&t!=workflow.token&&t!=[...workflow.targets][0]&&t?.document?.disposition==workflow.token?.document?.disposition&&!MidiQOL.checkIncapacitated(t.actor)&&MidiQOL.computeDistance(t,[...workflow.targets][0],false)<10)

//-------- blood frenzy - flags.midi-qol.advantage.attack.all
//game.user.targets?.first()?.actor?.system?.attributes?.hp?.value < game.user.targets?.first()?.actor?.system?.attributes?.hp?.max
//game.user.targets?.first()?.actor?.system?.attributes?.hp?.value<game.user.targets?.first()?.actor?.system?.attributes?.hp?.max
[...workflow.targets][0].actor.system.attributes.hp.value<[...workflow.targets][0].actor.system.attributes.hp.max

//--------- ambusher - flags.midi-qol.advantage.attack.all
//game.combat?.round === 1 && game.user.targets?.first()?.actor?.effects?.find(e => e.label === "Surprised")
//game.combat?.round===1&&game.user.targets?.first()?.actor?.effects?.find(e=>e.label==="Surprised")
game.combat?.round===1&&[...workflow.targets][0].actor.effects.find(e=>e.label==="Surprised")

//----------- chill touch - flags.midi-qol.disadvantage.attack.all
//(["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.race?.toLowerCase())||["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.type?.value?.toLowerCase()))&&game.user.targets?.first()?.id=="@token"
(workflow.actor.system.details?.race?.toLowerCase().includes("undead")||workflow.actor.system.details?.type?.value?.toLowerCase().includes("undead"))&&[...workflow.targets][0].id==="@token"

//---------- paralyzed - flags.midi-qol.grants.critical.all
//MidiQOL.getDistance(workflow.token,[...workflow.targets][0],false)<10
MidiQOL.computeDistance(workflow.token,[...workflow.targets][0],false)<10

//--------- assassiante - flags.midi-qol.advantage.attack.all + flags.midi-qol.critical.mwak
//game.combat?.round===1&&game.combat.turn<Object.entries(game.combat.turns).find(i=>i[1].tokenId===game.user.targets?.first().id)[0]
//game.combat?.round===1&&game.user.targets?.first()?.actor?.effects?.find(e=>e.label==="Surprised")
game.combat?.round===1&&game.combat.turn<Object.entries(game.combat.turns).find(t=>t[1].tokenId===[...workflow.targets][0].id)[0]
game.combat?.round===1&&[...workflow.targets][0].actor?.effects?.find(e=>e.label==="Surprised")

//-------blur flags.midi-qol.grants.disadvantage.attack.all
//MidiQOL.getDistance(workflow.token,[...workflow.targets][0],false)>Math.max(workflow.actor.attributes.senses.blindsight,workflow.actor.attributes.senses.tremorsense,workflow.actor.attributes.senses.truesight)
MidiQOL.computeDistance(workflow.token,[...workflow.targets][0],false)>Math.max(workflow.actor.attributes.senses.blindsight,workflow.actor.attributes.senses.tremorsense,workflow.actor.attributes.senses.truesight)

//------protection from evil and good flags.midi-qol.grants.disadvantage.attack.all
["aberration","celestial","elemental","fey","fiend","undead"].find(t=>workflow.actor.system.details?.race?.toLowerCase().includes(t)||workflow.actor.system.details?.type?.value?.toLowerCase().includes(t))
