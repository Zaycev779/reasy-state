type Storage = {
    store: Record<string, any>;
    map: Record<string, string[]>;
    id: number;
    mapId: WeakMap<object, number>;
};

export const Storage: Storage = {
    store: {},
    map: {},
    id: 0,
    mapId: new WeakMap(),
};
