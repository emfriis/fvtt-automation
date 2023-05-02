// pack tactics - flags.midi-qol.advantage.attack.all
game.canvas.tokens.placeables.find(t => t.actor && !((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") && t.id !== canvas.tokens.controlled[0].id && t.id !== game.user.targets?.first().id && canvas.tokens.controlled[0].disposition === t.disposition && t.actor?.system?.attributes?.hp?.value > 0 && !(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) && MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5)

// blood frenzy - flags.midi-qol.advantage.attack.all
game.user.targets?.first()?.actor?.system?.attributes?.hp?.value < game.user.targets?.first()?.actor?.system?.attributes?.hp?.max

// ambusher - flags.midi-qol.advantage.attack.all
game.combat?.round === 1 && game.user.targets?.first()?.actor?.effects?.find(e => e.data.label === "Surprised")
