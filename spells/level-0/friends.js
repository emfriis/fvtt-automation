// friends

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const friendsSource = canvas.tokens.get(args[1]);

if (args[0] === "on") {
    if (tokenOrActor.data.disposition === -1) {
        let friends = tactor.effects.find(i => i.data === lastArg.efData);
		if (friends) await tactor.deleteEmbeddedDocuments("ActiveEffect", [friends.id]);
    }
}

if (args[0] === "off") {
    if (tokenOrActor.data.disposition === -1) return;
    tokenOrActor.update({"disposition" : -1});
    if (!friendsSource) return;
    new Dialog({
		title: "Friends",
		content: `
		<form id="friends-form">
            <p>The Friends spell expires on ${tactor.name}.</p>
			<p>You become magically hostile towards ${friendsSource.name}.</p>
		</form>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: "Ok",
			},
		},
		default: "one",
	}).render(true);
}