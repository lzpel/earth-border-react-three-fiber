export default class RandomXorShift {
	private x: number;
	private y: number;
	private z: number;
	private w: number;
    constructor(seed = 88675123) {
        this.x = 123456789;
        this.y = 362436069;
        this.z = 521288629;
        this.w = seed;
    }

    // XorShiftアルゴリズム
    next() {
        const t = this.x ^ (this.x << 11);
        this.x = this.y;
        this.y = this.z;
        this.z = this.w;
        this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
        return this.w >>> 0; // 符号なし整数を返す
    }

    // min以上max未満の乱数を生成する
    nextInt(min:number, max:number) {
        const r = Math.abs(this.next());
        return min + (r % (max - min));
    }

    // 0以上1以下の乱数を生成する
    nextFloat() {
		const LIM=10000
        return this.nextInt(0, LIM)/LIM;
    }
}