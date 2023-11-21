try {
    const statuses = [""];
    if (args[0].tag == "TargetOnUse" && args[0].macroPass == "preTargetSave" && args[0].workflow.item && args[0].workflow.saveDetails && (args[0].workflow.item.effects.find(e => statuses.includes(e.name.toLowerCase()) || e.changes.find(c => statuses.find(s => c.value.toLowerCase().includes(s)))))) args[0].workflow.saveDetails.advantage = true;
} catch (err) {console.error("Status Save Advantage Macro - ", err)}