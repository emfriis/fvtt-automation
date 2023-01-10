let LevelsVolumetricTemplates = {};
LevelsVolumetricTemplates.tools = {};
LevelsVolumetricTemplates.tools.toggleVolumetric = false;
LevelsVolumetricTemplates.tools.handMode = false;
Hooks.on("getSceneControlButtons", (controls, b, c) => {
  controls
    .find((c) => c.name == "measure")
    .tools.push(
      {
        name: "toggleCylinder",
        title: game.i18n.localize("levels.controls.toggleCylinder.name"),
        icon: "fas fa-database",
        toggle: true,
        active: LevelsVolumetricTemplates.tools.toggleCylinder || false,
        onClick: (toggle) => {
          LevelsVolumetricTemplates.tools.toggleCylinder = toggle;
        },
      },
      {
        name: "handMode",
        title: game.i18n.localize("levels.controls.handMode.name"),
        icon: "fas fa-hand-sparkles",
        toggle: true,
        visible: !LevelsVolumetricTemplates.dynamicSwap ?? false,
        active: LevelsVolumetricTemplates.tools.handMode || false,
        onClick: (toggle) => {
          LevelsVolumetricTemplates.tools.handMode = toggle;
        },
      },
      {
        name: "ignoreSelf",
        title: game.i18n.localize("levels.controls.ignoreSelf.name"),
        icon: "fas fa-user-slash",
        toggle: true,
        visible: true,
        active: LevelsVolumetricTemplates.tools.ignoreSelf || false,
        onClick: (toggle) => {
          LevelsVolumetricTemplates.tools.ignoreSelf = toggle;
        },
      },
      {
        name: "ignoreFriendly",
        title: game.i18n.localize("levels.controls.ignoreFriendly.name"),
        icon: "fas fa-users-slash",
        toggle: true,
        visible: true,
        active: LevelsVolumetricTemplates.tools.ignoreFriendly || false,
        onClick: (toggle) => {
          LevelsVolumetricTemplates.tools.ignoreFriendly = toggle;
        },
      },
      {
        name: "toggleVolumetric",
        title: game.i18n.localize("levels.controls.toggleVolumetric.name"),
        icon: "fas fa-cube",
        toggle: true,
        visible: !LevelsVolumetricTemplates.dynamicSwap ?? false,
        active: LevelsVolumetricTemplates.tools.toggleVolumetric || false,
        onClick: (toggle) => {
          LevelsVolumetricTemplates.tools.toggleVolumetric = toggle;
        },
      }
    );
});

Hooks.on("init", () => {
  game.settings.register("levelsvolumetrictemplates", "volPercent", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.volPercent.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.volPercent.hint"
    ),
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 100,
      step: 1,
    },
    default: 25,
  });

  game.settings.register("levelsvolumetrictemplates", "dynamicSwap", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.dynamicSwap.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.dynamicSwap.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (setting) => {
      if (setting) LevelsVolumetricTemplates.tools.handMode = false;
      LevelsVolumetricTemplates.dynamicSwap = setting;
    },
  });

  game.settings.register("levelsvolumetrictemplates", "checkCollision", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.checkCollision.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.checkCollision.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("levelsvolumetrictemplates", "3dtemplatedefault", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.3dtemplatedefault.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.3dtemplatedefault.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("levelsvolumetrictemplates", "handModeDefault", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.handModeDefault.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.handModeDefault.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("levelsvolumetrictemplates", "debugMode", {
    name: game.i18n.localize(
      "levelsvolumetrictemplates.settings.debugMode.name"
    ),
    hint: game.i18n.localize(
      "levelsvolumetrictemplates.settings.debugMode.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  LevelsVolumetricTemplates.tools.toggleVolumetric = game.settings.get(
    "levelsvolumetrictemplates",
    "3dtemplatedefault"
  );
  LevelsVolumetricTemplates.dynamicSwap = game.settings.get(
    "levelsvolumetrictemplates",
    "dynamicSwap"
  );
  LevelsVolumetricTemplates.tools.handMode =
    LevelsVolumetricTemplates.dynamicSwap
      ? false
      : game.settings.get("levelsvolumetrictemplates", "handModeDefault");
});
