class PointInSolid {
  /**
   * @param p coordinates of point to be tested
   * @param c opposit corners of the parallelepiped
   */

  static inParallelepiped(p, c) {
    const c0 = c[0];
    const c1 = c[1];
    const maxX = Math.max(c0.x, c1.x);
    const maxY = Math.max(c0.y, c1.y);
    const maxZ = Math.max(c0.z, c1.z);
    const minX = Math.min(c0.x, c1.x);
    const minY = Math.min(c0.y, c1.y);
    const minZ = Math.min(c0.z, c1.z);
    return minX <= p.x && p.x <= maxX && minY <= p.y && p.y <= maxY && minZ <= p.z && p.z <= maxZ;
  }

  /**
   * @param p coordinates of point to be tested
   * @param poly PIXI.Polygon defining the top\bottom face
   * @param z z points of the solid
   */

   static inRotatedParallelepiped(p, poly, z) {
    if(p.z < z[0] || p.z > z[1]) return false
    return poly.contains(p.x,p.y)
  }

  /**
   * @param p coordinates of point to be tested
   * @param c coordinates of center of the sphere
   * @param r radius of the sphere
   */

  static inSphere(p, c, r) {
    return this.getDist(c, p) <= r;
  }

    /**
   * @param p coordinates of point to be tested
   * @param c coordinates of center of the base of the cylinder
   * @param r radius of the cylinder
   * @param h height of the cylinder
   */

  static inCylinder(p, c, r, h){
    const dist = this.getDist({x:c.x,y:c.y,z:p.z}, p)
    return dist <= r && p.z <= h && p.z >= c.z
  }

  /**
   * @param p coordinates of point to be tested
   * @param t coordinates of apex point of cone
   * @param c coordinates of center of basement circle
   * @param a aperture in radians
   * @param h height of the cone
   */

  static inCone(p, t, c, a, h) {
    const a2 = a / 2;
    const apexToXVect = this.dif(t, p);
    const axisVect = this.dif(t, c);
    const iic =
      this.dotProd(apexToXVect, axisVect) /
        this.magn(apexToXVect) /
        this.magn(axisVect) >
      Math.cos(a2);
    if (!iic) return false;
    return this.getDist(t, p) <= h;
    return (
      this.dotProd(apexToXVect, axisVect) / this.magn(axisVect) <
      this.magn(axisVect)
    );
  }

  static getDist(p0, p1) {
    return Math.sqrt(
      Math.pow(p1.x - p0.x, 2) +
        Math.pow(p1.y - p0.y, 2) +
        Math.pow(p1.z - p0.z, 2)
    );
  }

  static dotProd(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  static dif(a, b) {
    return {x:a.x - b.x, y:a.y - b.y, z:a.z - b.z};
  }

  static magn(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  }
}
