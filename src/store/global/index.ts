type Storage = {
    store: Record<string, any>;
    map: Record<string, string[]>;
    id: number;
    mId: WeakMap<object, number>;
};

export const Storage: Storage = {
    store: {},
    map: {},
    id: 0,
    mId: new WeakMap(),
};
