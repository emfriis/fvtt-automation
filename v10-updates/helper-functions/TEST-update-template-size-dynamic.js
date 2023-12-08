Hooks.on("preUpdateMeasuredTemplate", async (document, updates, options, id) => {
	try {
		if (!updates.distance && !updates.width) return;
		const distanceDiff = (updates.distance - document.distance) / ((updates.distance + document.distance) / 2)
		const widthDiff = (updates.width - document.width) / ((updates.width + document.width) / 2)
		//const effect = document?.flags?.sequencer?.effects[0][1]; //await fromUuid(document.uuid + '.data.flags.sequencer.effects.' + document?.flags?.sequencer?.effects[0][1]._id);
		const effect = await fromUuid(document.uuid + '.flags.sequencer.effects.' + document?.flags?.sequencer?.effects[0][1]._id);
		console.error(effect, distanceDiff, widthDiff);
		if (!effect && (!distanceDiff && !widthDiff)) return;
		if (document.t == "circle") {
			if (distanceDiff) { //document.update({ size: { width: effect.size.width * (1 + distanceDiff), height: effect.size.height * (1 + distanceDiff) } })
				effect.size.width = effect.size.width * (1 + distanceDiff);
				effect.size.height = effect.size.height * (1 + distanceDiff);
			}
		}
	} catch (err) {console.error("preUpdateMeasuredTemplate Hook Macro - ", err)}
});

//TRY UPDATE EMBEEDED DOCUMENT FOR ANIMATION ID