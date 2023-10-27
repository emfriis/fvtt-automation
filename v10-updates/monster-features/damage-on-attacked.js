// damageItems - semicolon separated
// itemArgs format - comma separated 
// actionTypes - breakline separated i.e., actionTypes=mwak|msak WHICH ACTION TYPES TRIGGER DAMAGE
// isHit - i.e., isHit=true DOES ATTACK NEED TO DEAL DAMAGE TO TRIGGER DAMAGE
// range - i.e., range=5 WHAT RANGE DOES ATTACK NEED TO BE IN TO TRIGGER DAMAGE
// damageRoll - rollable string i.e., damageRoll=3d6 HOW MUCH DAMAGE
// damageType - damage type i.e., damageType=fire WHAT TYPE OF DAMAGE 
// killAnim - i.e., killAnim=true WHETHER TO KILL ITEM ANIMATION

try {
	if (args[0].tag != "OnUse" && args[0].macroPass != "isAttacked") return;
    const damageItems = args[0].options.actor.flags["midi-qol"]?.damageOnAttacked?.replace(" ", "")?.split(";");
    damageItems.forEach(async d => {
        const damageItem = d?.split(",");
        if (damageItem?.length < 2) return;
        const actionTypesValue = damageItem.find(i => i?.includes("attackTypes="))?.replace("attackTypes=","");
        const actionTypes = actionTypesValue ? actionTypesValue[0]?.split("+") : ["mwak", "rwak", "msak", "rsak"];
        const isHitValue = damageItem.find(i => i?.includes("isHit="))?.replace("isHit=","");
        const isHit = !isHitValue || isHitValue == "false" ? false : true;
        const rangeValue = damageItem.find(i => i?.includes("range="))?.replace("range=","");
        const range = !rangeValue ? 9999 : isNaN(rangeValue) ? undefined : +rangeValue;
        const damageRoll = damageItem.find(i => i?.includes("damageRoll="))?.replace("damageRoll=","");
        const damageType = damageItem.find(i => i?.includes("damageType="))?.replace("damageType=","");
        const killAnimValue = damageItem.find(i => i?.includes("killAnim="))?.replace("killAnim=","");
        const killAnim = !killAnimValue || killAnimValue == "false" ? false : true;
        const sourceEffect = args[0].options.actor.effects.find(e => e.changes.find(c => c.value.replace(" ", "").replace(";", "") == d));
        const itemName = sourceEffect ? sourceEffect.label : "Damage";
        const itemImg = sourceEffect ? sourceEffect.icon : "icons/svg/explosion.svg";
        if (!actionTypes || !range || !damageRoll || !damageType) return console.error("Invalid Damage On Attacked arguments:", "actor =", args[0].options.actor, "token =", args[0].options.token, "actionTypes =", actionTypes, "isHit =", isHit, "range =", range, "damageRoll =", damageRoll, "damageType =", damageType, "killAnim =", killAnim);
        if (!actionTypes.includes(args[0].item.system.actionType) || MidiQOL.computeDistance(args[0].workflow.token, args[0].options.token, false) > range) return console.warn("Damage On Attacked conditions not met");
        if (isHit) {
            let hook1 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    await applyDamage(args[0].workflow.actor, damageRoll, damageType, itemName, itemImg, killAnim);
                    Hooks.off("midi-qol.postActiveEffects", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowComplete => {
                if (workflowComplete.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.RollComplete", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
        } else {
            await applyDamage(args[0].workflow.actor, damageRoll, damageType, itemName, itemImg, killAnim);
        }
    });
} catch (err) {console.error("Damage On Attacked Macro - ", err)}

async function applyDamage(actor, damageRoll, damageType, itemName, itemImg, killAnim) {
    const itemData = {
        name: itemName,
        img: itemImg,
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "other",
            damage: { parts: [[damageRoll, damageType]] }
        },
        flags: { autoanimations: { isEnabled: killAnim } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    await MidiQOL.completeItemUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
}