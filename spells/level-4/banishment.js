// banishment
// effect itemacro

// set hidden and maybe set massive negative elevation ???

const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.tokenUuid);

if (args[0] === "on") {
  await target.update({hidden : true}); // hide targeted token
  ChatMessage.create({content: "Target was banished"});

}

if (args[0]=== "off") {
  await target.update({hidden : false}); // unhide token
  ChatMessage.create({content: "Banished target returned"});
}