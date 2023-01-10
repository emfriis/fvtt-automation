async function calculateTokenCover(sourceToken, targetToken) {
    let distance = MidiQOL.getDistance(sourceToken, targetToken, false);
    let padd = 4;
    let blockingToken = canvas.tokens.placeables.find(p => {
        let distanceToSource = MidiQOL.getDistance(p, sourceToken, false);
        let block = (
            p?.actor && // exists
            !(p.actor.data.data.details?.type?.value?.length < 3) && // is a creature
            distanceToSource < distance && // is closer to source than target
            segmentBoxIntersection(
                { x: sourceToken.center.x, y: sourceToken.center.y, z: sourceToken.losHeight },
                { x: targetToken.center.x, y: targetToken.center.y, z: targetToken.losHeight == targetToken.data.elevation ? targetToken.data.elevation + 0.001 : targetToken.losHeight },
                { x: p.x + padd, y: p.y + padd, z: p.data.elevation, },
                { x: p.x + p.w - padd, y: p.y + p.h - padd, z: p.losHeight }
            )
        );
        return block;  
    });

    return blockingToken ? true : false;
}

async function segmentBoxIntersection(p0, p1, b0, b1) {
    const x0 = p0.x;
    const y0 = p0.y;
    const z0 = p0.z;
    const x1 = p1.x;
    const y1 = p1.y;
    const z1 = p1.z;
    const faces = [
        [
            //Back Face
            { x: b0.x, y: b0.y, z: b0.z },
            { x: b0.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b0.y, z: b0.z },
        ],
        [
            //Front Face
            { x: b0.x, y: b1.y, z: b0.z },
            { x: b0.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b0.z },
        ],
        [
            //Left Face
            { x: b0.x, y: b0.y, z: b0.z },
            { x: b0.x, y: b0.y, z: b1.z },
            { x: b0.x, y: b1.y, z: b1.z },
            { x: b0.x, y: b1.y, z: b0.z },
        ],
        [
            //Right Face
            { x: b1.x, y: b0.y, z: b0.z },
            { x: b1.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b0.z },
        ],
    ];

    //check if a line intersects a box
    async function boxCollisionTest() {
        for (let face of faces) {
            //declare points in 3d space of the rectangle created by the wall
            const wx1 = face[0].x;
            const wx2 = face[1].x;
            const wx3 = face[2].x;
            const wy1 = face[0].y;
            const wy2 = face[1].y;
            const wy3 = face[2].y;
            const wz1 = face[0].z;
            const wz2 = face[1].z;
            const wz3 = face[2].z;
            const wallBotTop = [Math.min(wz1, wz2, wz3), Math.max(wz1, wz2, wz3)];

            //calculate the parameters for the infinite plane the rectangle defines
            const A = wy1 * (wz2 - wz3) + wy2 * (wz3 - wz1) + wy3 * (wz1 - wz2);
            const B = wz1 * (wx2 - wx3) + wz2 * (wx3 - wx1) + wz3 * (wx1 - wx2);
            const C = wx1 * (wy2 - wy3) + wx2 * (wy3 - wy1) + wx3 * (wy1 - wy2);
            const D =
            -wx1 * (wy2 * wz3 - wy3 * wz2) -
            wx2 * (wy3 * wz1 - wy1 * wz3) -
            wx3 * (wy1 * wz2 - wy2 * wz1);

            //solve for p0 p1 to check if the points are on opposite sides of the plane or not
            const P1 = A * x0 + B * y0 + C * z0 + D;
            const P2 = A * x1 + B * y1 + C * z1 + D;

            //don't do anything else if the points are on the same side of the plane
            if (P1 * P2 > 0) continue;

            //calculate intersection point
            const t =
            -(A * x0 + B * y0 + C * z0 + D) /
            (A * (x1 - x0) + B * (y1 - y0) + C * (z1 - z0)); //-(A*x0 + B*y0 + C*z0 + D) / (A*x1 + B*y1 + C*z1)
            const ix = x0 + (x1 - x0) * t;
            const iy = y0 + (y1 - y0) * t;
            const iz = Math.round(z0 + (z1 - z0) * t);

            //return true if the point is inisde the rectangle
            const isb = isBetween(
            { x: Math.min(wx1, wx2, wx3), y: Math.min(wy1, wy2, wy3) },
            { x: Math.max(wx1, wx2, wx3), y: Math.max(wy1, wy2, wy3) },
            { x: ix, y: iy }
            );
            if (isb && iz <= wallBotTop[1] && iz >= wallBotTop[0]) return true;
        }
        return false;
    }

    //Check if a point in 2d space is betweeen 2 points
    async function isBetween(a, b, c) {
        //test
        //return ((a.x<=c.x && c.x<=b.x && a.y<=c.y && c.y<=b.y) || (a.x>=c.x && c.x >=b.x && a.y>=c.y && c.y >=b.y))

        const dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
        if (dotproduct < 0) return false;

        const squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (dotproduct > squaredlengthba) return false;

        return true;
    }

    return boxCollisionTest();
}