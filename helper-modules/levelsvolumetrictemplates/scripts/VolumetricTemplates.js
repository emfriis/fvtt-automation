class VolumetricTemplates {
  static compute3Dtemplate(t, tokensToCheck = canvas.tokens.placeables) {
    const percentSetting = game.settings.get(
      "levelsvolumetrictemplates",
      "volPercent"
    );
    const collisionSetting = game.settings.get(
      "levelsvolumetrictemplates",
      "checkCollision"
    );
    let targets = [];
    let debugPreviewData = [];
    const unitToPx = canvas.dimensions.size / canvas.dimensions.distance;
    let tElevation = t.data.flags.levels?.elevation * unitToPx ?? 0;
    let special = t.data.flags.levels?.special * unitToPx;
    special = !special ? 0 : special;
    const cToken = canvas.tokens.controlled[0] || _levels.lastTokenForTemplate;
    if (LevelsVolumetricTemplates.dynamicSwap) {
      LevelsVolumetricTemplates.tools.toggleVolumetric = this.dynamicSwap(
        t.data.t,
        special
      );
      if (
        t.data.t === CONST.MEASURED_TEMPLATE_TYPES.CONE &&
        cToken &&
        t.data.flags.levels?.elevation == cToken.data.elevation
      ) {
        tElevation = Math.round(
          cToken.data.elevation + (_levels.getTokenLOSheight(cToken) - cToken?.data?.elevation) * 0.8
        );
        t._object?.document
          .setFlag("levels", "elevation", tElevation)
          .then(() => {
            t._object.draw();
          });
        tElevation *= unitToPx;
      }
    }
    const precision = LevelsVolumetricTemplates.tools.toggleVolumetric ? 5 : 50;
    for (let token of tokensToCheck) {
      if (LevelsVolumetricTemplates.tools.ignoreSelf && token == cToken)
        continue;
      if (
        LevelsVolumetricTemplates.tools.ignoreFriendly &&
        cToken &&
        token.data.disposition == cToken.data.disposition
      )
        continue;
      if (token.actor?.effects?.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) continue;
      const o = {
        x: t.data.x,
        y: t.data.y,
        z: tElevation,
      };
      if (
        collisionSetting &&
        _levels.testCollision(
          {
            x: t.data.x,
            y: t.data.y,
            z: t.data.flags.levels?.elevation || 0,
          },
          {
            x: token.center.x,
            y: token.center.y,
            z: token.data.elevation + (token.losHeight-token.data.elevation) / 2,
          },
          "collision"
        )
      )
        continue;
      //do distance check
      if(PointInSolid.getDist(o, {x: token.center.x, y: token.center.y, z: token.data.elevation * unitToPx }) > t.data.distance * unitToPx * 2) continue;
      let inSolid = false;
      const a = (t.data.direction * Math.PI) / 180;
      const angle = (t.data.angle * Math.PI) / 180;
      const d = t.data.distance * unitToPx;

      const points = VolumetricTemplates.getTokenPoints(
        token,
        unitToPx,
        precision,
        tElevation,
      );
      let validPoints = 0;
      for (let p of points) {
        switch (t.data.t) {
          case CONST.MEASURED_TEMPLATE_TYPES.CIRCLE:
            if (
              LevelsVolumetricTemplates.tools.toggleCylinder ||
              !LevelsVolumetricTemplates.tools.toggleVolumetric
            ) {
              if (
                VolumetricTemplates.computeCylinder(p, o, t, unitToPx, special)
              )
                validPoints++;
            } else {
              if (VolumetricTemplates.computeSphere(p, o, t, unitToPx))
                validPoints++;
            }

            break;
          case CONST.MEASURED_TEMPLATE_TYPES.CONE:
            if (LevelsVolumetricTemplates.tools.toggleVolumetric) {
              if (VolumetricTemplates.computeCone(o, a, d, p, angle))
                validPoints++;
            } else {
              if (
                p.z == o.z &&
                VolumetricTemplates.computeCone(o, a, d, p, angle)
              ) {
                validPoints++;
              }
            }
            break;
          case CONST.MEASURED_TEMPLATE_TYPES.RAY:
            if (
              VolumetricTemplates.computeRay(t, unitToPx, o, a, d, p, special)
            )
              validPoints++;
            break;
          case CONST.MEASURED_TEMPLATE_TYPES.RECTANGLE:
            if (VolumetricTemplates.computeParal(o, a, d, p, special))
              validPoints++;
            break;
        }
      }
      const volPercent = (validPoints * 100) / points.length;
      if (volPercent >= percentSetting) inSolid = true;
      if (inSolid) targets.push(token.id);
      debugPreviewData.push({
        token: token,
        vol: volPercent,
        inSolid: inSolid,
      });

    }
    if (
      game.settings.get("levelsvolumetrictemplates", "debugMode") &&
      game.user.isGM
    )
    
      {
        for(let d of debugPreviewData){
          console.log(
            d.token?.data.name,
            " in solid: ",
            d.inSolid,
            "vol percent",
            d.vol
          );
        }

        this.debugVolume(debugPreviewData);
      }
    game.user.updateTokenTargets(targets);
    game.user.broadcastActivity({targets: game.user.targets.ids});
    return(targets);  // CHANGED TO RETURN TARGETS FOR AURA MACRO USAGE - CALLABLE VIA "VolumetricTemplates.compute3Dtemplate(template)" WHERE template IS placeable
  }

  static getTokenPoints(token, unitToPx, precision, tElevation) {
    let collisionTestPoints = [];
    let tokenLOSh = token.losHeight;
    if (LevelsVolumetricTemplates.tools.toggleVolumetric) {
      for (
        let zC = token.data.elevation * unitToPx;
        zC <= tokenLOSh * unitToPx;
        zC +=
          (tokenLOSh * unitToPx - token.data.elevation * unitToPx) / precision
      ) {
        for (
          let yC = token.y;
          yC <= token.y + token.h;
          yC += token.h / precision
        ) {
          for (
            let xC = token.x;
            xC <= token.x + token.w;
            xC += token.w / precision
          ) {
            collisionTestPoints.push({ x: xC, y: yC, z: zC });
          }
        }
      }
    } else {
      let zC = token.data.elevation * unitToPx;
      if(tElevation/unitToPx >= token.data.elevation && tElevation/unitToPx <= tokenLOSh) zC = tElevation;
      for (
        let yC = token.y;
        yC <= token.y + token.h;
        yC += token.h / precision
      ) {
        for (
          let xC = token.x;
          xC <= token.x + token.w;
          xC += token.w / precision
        ) {
          collisionTestPoints.push({ x: xC, y: yC, z: zC });
        }
      }
    }

    return collisionTestPoints;
  }

  static computeParal(o, a, d, p, h) {
    const rc1 = {
      x: o.x + Math.cos(a) * d,
      y: o.y + Math.sin(a) * d,
    };
    return PointInSolid.inParallelepiped(p, [
      o,
      { x: rc1.x, y: rc1.y, z: o.z + h },
    ]);
  }

  static computeRay(t, unitToPx, o, a, d, p, h) {
    const wp = (t.data.width * unitToPx) / 2;
    const c1 = { x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d };
    const points = [
      { x: o.x + (wp * (o.y - c1.y)) / d, y: o.y - (wp * (o.x - c1.x)) / d },
      { x: o.x - (wp * (o.y - c1.y)) / d, y: o.y + (wp * (o.x - c1.x)) / d },
      { x: c1.x - (wp * (o.y - c1.y)) / d, y: c1.y + (wp * (o.x - c1.x)) / d },
      { x: c1.x + (wp * (o.y - c1.y)) / d, y: c1.y - (wp * (o.x - c1.x)) / d },
    ];
    const poly = new PIXI.Polygon(points);
    return PointInSolid.inRotatedParallelepiped(p, poly, [o.z, o.z + h]);
  }

  static computeCone(o, a, d, p, angle) {
    const bc = {
      x: o.x + Math.cos(a) * d,
      y: o.y + Math.sin(a) * d,
      z: o.z,
    };
    return PointInSolid.inCone(p, o, bc, angle, d);
  }

  static computeSphere(p, o, t, unitToPx) {
    return PointInSolid.inSphere(p, o, t.data.distance * unitToPx);
  }

  static computeCylinder(p, o, t, unitToPx, h) {
    return PointInSolid.inCylinder(p, o, t.data.distance * unitToPx, h);
  }

  static dynamicSwap(templateType, special) {
    const isCylinder = LevelsVolumetricTemplates.tools.toggleCylinder;
    const isSpecial = !special ? false : true;

    switch (templateType) {
      case CONST.MEASURED_TEMPLATE_TYPES.CIRCLE:
        if (isCylinder && !isSpecial) return false;
        else return true;
        break;
      case CONST.MEASURED_TEMPLATE_TYPES.CONE:
        return true;
        break;
      case CONST.MEASURED_TEMPLATE_TYPES.RAY:
        return isSpecial;
        break;
      case CONST.MEASURED_TEMPLATE_TYPES.RECTANGLE:
        return isSpecial;
        break;
    }
  }

  static debugVolume(debugPreviewData) {
    let c = new PIXI.Container();
    canvas.controls.debug.children.find((c) => c.name === "volumetricTemplatesDebug")?.destroy();
    c.name = "volumetricTemplatesDebug";
    for (let debugData of debugPreviewData) {
      const tip = Math.round(debugData.vol * 100) / 100 + "%";
      const style = CONFIG.canvasTextStyle.clone();
      style.fontSize =
        Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 12) * 0.7;
      style.fontSize *=
        Math.min(debugData.token.data.width, debugData.token.data.height) *
        debugData.token.data.scale;
      style.fill = debugData.inSolid ? 0x00fc43 : 0xff0000;
      const text = new PreciseText(tip, style);
      text.y = -text.height / 2 + debugData.token.center.y;
      text.x = -text.width / 2 + debugData.token.center.x;
      c.addChild(text);
    }
    canvas.controls.debug.addChild(c);
  }
}

Hooks.on("createMeasuredTemplate", async (data, id, userId) => {
  if(userId==game.user.id)VolumetricTemplates.compute3Dtemplate(data);
});

Hooks.on("deleteMeasuredTemplate", async (t, data, id) => {
  let child = canvas.controls.debug.children.find((c) => (c.name = id));
  if (child) canvas.controls.debug.removeChild(child);
});
