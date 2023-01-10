// magicItems

Hooks.on(`renderActorSheet5e`, (app, html, data) => {
    if (window.MagicItems && window.MagicItems.bindCharacterSheet) {
        window.MagicItems.bindCharacterSheet(app, html, data);
    }
});
  
Hooks.on(`renderActorSheet`, (app, html, data) => {
    if (window.MagicItems && window.MagicItems.bindItemSheet) {
        window.MagicItems.bindItemSheet(app, html, data);
    }
});