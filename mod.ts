export type Rng = {
    /** 
     * Generate a random number between 0 and 1
     */
    random: () => number;
    /**
     * Generate a random unsigned 32 bit integer
     */
    next: () => number
    /**
     * Generate a random number between min and max
     */
    range: (min: number, max: number) => number
    /**
     * shuffle an array
     */
    shuffle: <T>(array: T[]) => T[]
}

function fisherYatesShuffle<T>(array: T[], random: Rng["random"] = Math.random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = random() * (i + 1) | 0;
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

function xorshift32(x: number) {
    return () => {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return x >>> 0;
    }
}

export async function createRng(seed: string): Promise<Rng> {
    const data = new TextEncoder().encode(seed);
    const hash = await crypto.subtle
        .digest("SHA-256", data)
        .then(buf => new Uint32Array(buf));
    const initialState = (hash[0] ?? 0) | (hash[1] ?? 0) << 8 | (hash[2] ?? 0) << 16 | (hash[3] ?? 0) << 24
    const next = xorshift32(initialState)
    const random = () => next() / 0xffffffff
    return {
        next,
        random,
        shuffle: <T>(a: T[]) => fisherYatesShuffle(a, random),
        range: (min: number, max: number) => min + random() * (max - min)
    } satisfies Rng
}