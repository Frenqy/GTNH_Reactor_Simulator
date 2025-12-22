export class BigintStorage {
    storedValue: bigint;

    constructor(storedValue: bigint = 0n) {
        this.storedValue = storedValue;
    }

    store(value: number, max: number) {
        if (value < 0 || value > max) {
            throw new Error("");
        }
        this.storedValue = this.storedValue * BigInt(max + 1) + BigInt(value);
    }

    extract(max: number): number {
        const oldValue = this.storedValue;
        this.storedValue = oldValue / BigInt(max + 1);
        return Number(oldValue % BigInt(max + 1));
    }

    static inputBase64(code: string) {
        const bin = atob(code);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return new BigintStorage(BigInt("0x" + hex));
    }

    outputBase64(): string {
        let binary = "";
        let bytes = null;
        if (this.storedValue === 0n) {
            bytes = new Uint8Array([0]);
        } else {
            let hex = this.storedValue.toString(16);
            if (hex.length % 2) hex = "0" + hex;
            const len = hex.length / 2;
            bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
            }
        }
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
