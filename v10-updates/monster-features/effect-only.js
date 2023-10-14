// pack tactics - flags.midi-qol.advantage.attack.all
game.canvas.tokens.placeables.find(t => t.actor && !((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") && t.id !== canvas.tokens.controlled[0].id && t.id !== game.user.targets?.first().id && canvas.tokens.controlled[0].disposition === t.disposition && t.actor?.system?.attributes?.hp?.value > 0 && !(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label))) && MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5)

game.canvas.tokens.placeables.find(t=>t.actor&&!((t.actor?.system?.details?.type?.value==="custom"||t.actor?.system?.details?.type?.value==="")&&t.actor?.system?.details?.type?.custom==="")&&t.id!==canvas.tokens.controlled[0].id&&t.id!==game.user.targets?.first().id&&canvas.tokens.controlled[0].disposition===t.disposition&&t.actor?.system?.attributes?.hp?.value>0&&!(t.actor?.effects?.find(e=>["Incapacitated","Unconscious","Paralyzed","Petrified","Stunned"].includes(e.label)))&&MidiQOL.getDistance(t,game.user.targets?.first(),false)<=5)

// blood frenzy - flags.midi-qol.advantage.attack.all
game.user.targets?.first()?.actor?.system?.attributes?.hp?.value < game.user.targets?.first()?.actor?.system?.attributes?.hp?.max

game.user.targets?.first()?.actor?.system?.attributes?.hp?.value<game.user.targets?.first()?.actor?.system?.attributes?.hp?.max

// ambusher - flags.midi-qol.advantage.attack.all
game.combat?.round === 1 && game.user.targets?.first()?.actor?.effects?.find(e => e.label === "Surprised")

game.combat?.round===1&&game.user.targets?.first()?.actor?.effects?.find(e=>e.label==="Surprised")

// chill touch
(["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.race?.toLowerCase())||["undead"].includes(canvas.tokens.controlled[0].actor.system.details?.type?.value?.toLowerCase()))&&game.user.targets?.first()?.id=="@token"

// danger sense
(game.actors.find(a=>a.system.abilities.str.value==@abilities.str.value&&!a.effects.find(e=>["blinded","deafened","incapacitated"].includes(e.label.toLowerCase()))))

if (this.abilityId === "dex" && !actor.effects.find(e => ["blinded","deafened","incapacitated"].includes(e.label.toLowerCase()))) this.roll.hasAdvantage = true;