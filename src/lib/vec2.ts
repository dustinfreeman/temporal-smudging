//this type only exists to reduce verbosity; don't need to type "new Vec2" everywhere
export type V2 = [number, number];

export class Vec2 {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  static from(v2: V2) {
    return new Vec2(v2[0], v2[1]);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  equals(v: Vec2) {
    return v.x === this.x && v.y === this.y;
  }
  clone() {
    return new Vec2(this.x, this.y);
  }
  normalize() {
    const vm = this.magnitude();
    if (vm > 0) {
      return this.mulS(1 / vm);
    }
    return this.clone();
  }

  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  subtract(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mulS(s: number) {
    return new Vec2(this.x * s, this.y * s);
  }

  round() {
    //rounds vector to nearest int
    return new Vec2(Math.round(this.x), Math.round(this.y));
  }

  dot(v: Vec2) {
    return this.x * v.x + this.y * v.y;
  }
  cross(v: Vec2) {
    return this.x * v.y - this.y * v.x;
  }

  toString() {
    return this.x + ',' + this.y;
  }

  static angleBetween(a: Vec2, b: Vec2) {
    const dot = a.dot(b);
    const cross = a.cross(b);
    if (dot === 0) {
      if (cross > 0) {
        return Math.PI / 2;
      } else {
        return -Math.PI / 2;
      }
    }
    if (cross === 0) {
      return 0;
    }
    const theta = Math.acos(dot / (a.magnitude() * b.magnitude()));
    return theta * Math.sign(cross);
  }
}
