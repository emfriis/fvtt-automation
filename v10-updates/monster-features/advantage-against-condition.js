try {
    const statuses = [""];
    if (workflow.item && workflow.saveDetails && (workflow.item.effects.find(e => statuses.includes(e.label.toLowerCase()) || e.changes.find(c => statuses.find(s => c.value.toLowerCase().includes(s)))))) workflow.saveDetails.advantage = true;
} catch (err) {console.error("Status Save Advantage Macro - ", err)}