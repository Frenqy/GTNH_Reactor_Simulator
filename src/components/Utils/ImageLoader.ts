import type { ImgData } from "./Defines";

export class ImageLoader {
    static IMAGE_CACHE: Map<string, string> = new Map<string, string>();

    static initImages(data: ImgData[]) {
        data.forEach((item) => {
            this.IMAGE_CACHE.set(item.name, item.data);
        });
    }

    static getImage(imageName: string): string {
        if (this.IMAGE_CACHE.has(imageName)) {
            return this.IMAGE_CACHE.get(imageName)!;
        } else {
            return "";
        }
    }
}
