//------------ pack tactics - flags.midi-qol.advantage.attack.all
//game.canvas.tokens.placeables.find(t => t.actor && !((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") && t.id !== canvas.tokens.controlled[0].id && t.id !== game.user.targets?.first().id && canvas.tokens.controlled[0].disposition === t.disposition && t.actor?.system?.attributes?.hp?.value > 0 && !(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label))) && MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5)
//game.canvas.tokens.placeables.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value==="custom"||t.actor?.system?.details?.type?.value==="")&&t.actor?.system?.details?.type?.custom==="")&&t.id!==canvas.tokens.controlled[0].id&&t.id!==game.user.targets?.first().id&&canvas.tokens.controlled[0].disposition===t.disposition&&t.actor?.system?.attributes?.hp?.value>0&&!(t.actor?.effects?.find(e=>["Incapacitated","Unconscious","Paralyzed","Petrified","Stunned"].includes(e.label)))&&MidiQOL.getDistance(t,game.user.targets?.first(),false)<=5)

game.canvas.tokens.placeables.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value==="custom"||t.actor?.system?.details?.type?.value==="")&&t.actor?.system?.details?.type?.custom==="")&&t.id!==tokenId&&t.id!==targetId&&t.disposition===canvas.tokens.get(tokenId).disposition&&t.actor?.system?.attributes?.hp?.value>0&&!t.actor?.effects?.find(e=>["Incapacitated","Unconscious","Paralyzed","Petrified","Stunned"].includes(e.label))&&MidiQOL.getDistance(t,canvas.tokens.get(targetId),false)<10)

//-------- blood frenzy - flags.midi-qol.advantage.attack.all
//game.user.targets?.first()?.actor?.system?.attributes?.hp?.value < game.user.targets?.first()?.actor?.system?.attributes?.hp?.max
//game.user.targets?.first()?.actor?.system?.attributes?.hp?.value<game.user.targets?.first()?.actor?.system?.attributes?.hp?.max

canvas.tokens.get(targetId).actor.system.attributes.hp.value<canvas.tokens.get(targetId).actor.system.attributes.hp.max

//--------- ambusher - flags.midi-qol.advantage.attack.all
//game.combat?.round === 1 && game.user.targets?.first()?.actor?.effects?.find(e => e.label === "Surprised")
//game.combat?.round===1&&game.user.targets?.first()?.actor?.effects?.find(e=>e.label==="Surprised")

game.combat?.round===1&&canvas.tokens.get(targetId).actor.effects.find(e=>e.label==="Surprised")

//----------- chill touch - flags.midi-qol.disadvantage.attack.all
//(["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.race?.toLowerCase())||["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.type?.value?.toLowerCase()))&&game.user.targets?.first()?.id=="@token"

(canvas.tokens.get(tokenId).actor.system.details?.race?.toLowerCase().includes("undead")||canvas.tokens.get(tokenId).actor.system.details?.type?.value?.toLowerCase().includes("undead"))&&targetId==="@token"

//---------- paralyzed - flags.midi-qol.grants.critical.all
MidiQOL.getDistance(canvas.tokens.get(workflow.tokenId),canvas.tokens.get(targetId),false)<10

//--------- assassiante - flags.midi-qol.advantage.attack.all + flags.midi-qol.critical.mwak
//game.combat?.round===1&&game.combat.turn<Object.entries(game.combat.turns).find(i=>i[1].tokenId===game.user.targets?.first().id)[0]
//game.combat?.round===1&&game.user.targets?.first()?.actor?.effects?.find(e=>e.label==="Surprised")

game.combat?.round===1&&game.combat.turn<Object.entries(game.combat.turns).find(t=>t[1].tokenId===targetId)[0]
game.combat?.round===1&&canvas.tokens.get(targetId).actor?.effects?.find(e=>e.label==="Surprised")