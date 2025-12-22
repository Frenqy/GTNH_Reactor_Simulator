export class MaterialsList {
    static componentMaterialsMap: Map<string, MaterialsList> = MaterialsList.initComponentMaterials();
    materials: Map<string, number> = new Map<string, number>();
    constructor(...materials: (MaterialsList | number | string)[]) {
        if (materials != undefined) {
            this.add(materials);
        }
    }

    private static initComponentMaterials() {
        // TODO
        return new Map<string, MaterialsList>();
    }

    add(materials: (MaterialsList | number | string)[]) {
        let itemCount = 1;
        for (const material of materials) {
            if (material instanceof String) {
                const materialName: string = material as string;
                if (this.materials.has(materialName)) {
                    this.materials.set(materialName, this.materials.get(materialName)! + itemCount);
                } else {
                    this.materials.set(materialName, itemCount);
                }
                itemCount = 1;
            } else if (material instanceof Number) {
                itemCount = (material as number) * 2;
            } else if (material instanceof MaterialsList) {
                for (const entrySet of material.materials.entries()) {
                    if (this.materials.has(entrySet[0])) {
                        this.materials.set(entrySet[0], this.materials.get(entrySet[0])! + itemCount * entrySet[1]);
                    } else {
                        this.materials.set(entrySet[0], itemCount * entrySet[1]);
                    }
                }
                itemCount = 1;
            }
        }
    }
}
