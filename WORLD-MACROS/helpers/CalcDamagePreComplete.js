// calculate damage
let sumDamage = 0;
let totalDamage = 0;
let totalDamageParts = [];
if (workflow.item.data.data.damage.parts && !(workflow.item.data.data.save.dc && (workflow.superSavers.has(token) || (workflow.item.data.flags.midiProperties.nodam && !workflow.failedSaves.has(token))))) {
    try {
        console.warn("Calculate Damage activated");
        for (let d = 0; d < workflow.damageDetail?.length ?? 0; d++) {
            let damage = workflow.damageDetail[d].damage;
            let damagePart = damage;
            let type = workflow.damageDetail[d].type;
            let isPhysical = ["bludgeoning","piercing","slashing"].includes(type);
            let isAdamantine = workflow.item.data.data?.properties?.ada;
            let isSilver = workflow.item.data.data?.properties?.sil;
            let isMagic = workflow.item.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect || workflow.item.data.flags?.midiProperties?.magiceffect || workflow.item.data.flags?.midiProperties?.magicdam || workflow.item.data.data?.properties?.mgc;
            let isSpell = workflow.item.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect;
            let drApplied = false;
            let dvApplied = false;
            // apply generic immunity
            if (tactor.data.data.traits.di.value.includes(type)) continue;
            // apply physical immunity
            if (isPhysical) {
                if (tactor.data.data.traits.di.value.includes("physical") && !isMagic) { 
                    continue;
                }
                if (tactor.data.data.traits.di.value.includes("adamant") && !isAdamantine && !isMagic) {
                    continue;
                }
                if (tactor.data.data.traits.di.value.includes("silver") && !isSilver && !isMagic) { 
                    continue;
                }
            }
            // apply magic immunity
            if (isMagic) {
                if (tactor.data.data.traits.di.value.includes("magic")) {
                    continue;
                }
                if (tactor.data.data.traits.di.value.includes("spell") && isSpell) {
                    continue;
                }
            } else if (tactor.data.data.traits.di.value.includes("nonmagic")) {
                continue;
            }
            // apply damage reduction
            let drAll = getProperty(tactor.data, `flags.midi-qol.DR.all`) || 0;
            let drAction = getProperty(tactor.data, `flags.midi-qol.DR.${workflow.item.data.data.actionType}`) || 0;
            let drType = getProperty(tactor.data, `flags.midi-qol.DR.${type}`) || 0;
            let drPhysical = isPhysical && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.physical`) || 0 : 0;
            let drNonPhysical = !isPhysical ? getProperty(tactor.data, `flags.midi-qol.DR.non-physical`) || 0 : 0;
            let drAdamantine = isPhysical && !isAdamantine && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-adamant`) || 0 : 0;
            let drSilver = isPhysical && !isSilver && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-silver`) || 0 : 0;
            let drMagic = isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.magic`) || 0 : 0;
            let drNonMagic = !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-magic`) || 0 : 0;
            let drTotal = drAll + drAction + drType + drPhysical + drNonPhysical + drAdamantine + drSilver + drMagic + drNonMagic;
            damage -= drTotal;
            sumDamage += damage;
            // apply generic resistance
            if (tactor.data.data.traits.dr.value.includes(type)) {
                damage /= 2;
                drApplied = true;
            }
            // apply physical resistance
            if (isPhysical) {
                if (!drApplied && tactor.data.data.traits.dr.value.includes("physical") && !isMagic) { 
                    damage /= 2;
                    drApplied = true;
                }
                if (!drApplied && tactor.data.data.traits.dr.value.includes("adamant") && !isAdamantine && !isMagic) {
                    damage /= 2;
                    drApplied = true;
                }
                if (!drApplied && tactor.data.data.traits.dr.value.includes("silver") && !isSilver && !isMagic) { 
                    damage /= 2;
                    drApplied = true;
                }
            }
            // apply magic resitance
            if (isMagic) {
                if (!drApplied && tactor.data.data.traits.dr.value.includes("magic")) {
                    damage /= 2;
                    drApplied = true;
                }
                if (!drApplied && tactor.data.data.traits.dr.value.includes("spell") && isSpell) {
                    damage /= 2;
                    drApplied = true;
                }
            } else if (!drApplied && tactor.data.data.traits.dr.value.includes("nonmagic")) {
                damage /= 2;
                drApplied = true;
            }
            // apply generic vulnerability
            if (tactor.data.data.traits.dv.value.includes(type)) {
                damage *= 2;
                dvApplied = true;
            }
            // apply physical vulnerability
            if (isPhysical) {
                if (!dvApplied && tactor.data.data.traits.dv.value.includes("physical") && !isMagic) { 
                    damage *= 2;
                    drApplied = true;
                }
                if (!dvApplied && tactor.data.data.traits.dv.value.includes("adamant") && !isAdamantine && !isMagic) {
                    damage *= 2;
                    drApplied = true;
                }
                if (!dvApplied && tactor.data.data.traits.dv.value.includes("adamant") && !isSilver && !isMagic) { 
                    damage *= 2;
                    drApplied = true;
                }
            }
            // apply magic vulnerability
            if (isMagic) {
                if (!dvApplied && tactor.data.data.traits.dv.value.includes("magic")) {
                    damage *= 2;
                    drApplied = true;
                }
                if (!dvApplied && tactor.data.data.traits.dv.value.includes("spell") && isSpell) {
                    damage *= 2;
                    drApplied = true;
                }
            } else if (!dvApplied && tactor.data.data.traits.dv.value.includes("nonmagic")) {
                damage *= 2;
                dvApplied = true;
            }
            // apply half damage
            if (workflow.item.data.data.save.dc && (workflow.semiSuperSavers.has(token) || (workflow.item.data.flags.midiProperties.halfdam && workflow.failedSaves.has(token)))) {
                damage /= 2;
            }
            if (workflow.item.data.data.save.dc && workflow.item.data.data.formula?.includes(type)) {
                damage /= 2;
            }
            if (tactor.data.flags["midi-qol"].uncannyDodge) {
                damage /= 2;
            }
            // append to total damage
            totalDamage += Math.floor(damage);
            totalDamageParts.push({ damagePart: damagePart, damageTotal: Math.floor(damage), resist: drApplied, vuln: dvApplied });
        }
        console.warn("Calculate Damage used", sumDamage, totalDamage);
    } catch (err) {
        console.error("Calculate error", err);
    }
}