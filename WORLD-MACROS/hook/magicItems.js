// magicItems

Hooks.on(`renderMyCoolCharacterSheet`, (app, html, data) => {
    if (window.MagicItems && window.MagicItems.bindCharacterSheet) {
        window.MagicItems.bindCharacterSheet(app, html, data);
    }
});
  
Hooks.on(`renderMyCoolItemSheet`, (app, html, data) => {
    if (window.MagicItems && window.MagicItems.bindItemSheet) {
        window.MagicItems.bindItemSheet(app, html, data);
    }
});