import { isClient } from "../utils/client";

declare global {
    namespace EStorage {
        let store: Record<string, any>;
        let map: Record<string, string[]>;
        let storeId: number;
        const mapId: WeakMap<object, number>;
    }
}

const storageInitial = () => ({
    store: {},
    map: {},
    storeId: 0,
    mapId: new WeakMap(),
});

if (!("EStorage" in globalThis)) {
    globalThis.EStorage = storageInitial();
}

export const Storage = isClient()
    ? EStorage
    : (storageInitial() as typeof EStorage);
