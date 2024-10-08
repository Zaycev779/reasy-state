import { getGlobalData } from "../get-global";
import { IStore, Options, StorageType } from "../types/store";
import { mergeDeep } from "../utils";

const storagePrefix = "RES_";

export const loadStorage = <T extends IStore<T>>(
    options?: Options<T>,
    initial?: T,
): IStore<T> | undefined => {
    if (options) {
        const { key, storage } = options;
        if (key && storage) {
            const { type, mutators } =
                typeof storage === "object"
                    ? storage
                    : { type: localStorage, mutators: undefined };
            try {
                const data = type.getItem(storagePrefix.concat(key));
                if (data) {
                    const parse = JSON.parse(data || "{}");
                    return mergeDeep(
                        StorageType.GET,
                        {},
                        initial,
                        mutators,
                        parse,
                    );
                }
            } catch {}
        }
    }
    return undefined;
};

export const pushStorage = <T extends IStore<T>>(
    options?: Options<T>,
): IStore<T> | undefined => {
    if (options) {
        const { key, storage } = options;
        if (key && storage) {
            try {
                const { type, mutators } =
                    typeof storage === "object"
                        ? storage
                        : { type: localStorage, mutators: undefined };

                const data = getGlobalData([key]);
                const toString = JSON.stringify(
                    mergeDeep(StorageType.PUT, {}, mutators, data),
                );
                type.setItem(storagePrefix.concat(key), toString);
            } catch (e) {
                throw e;
            }
        }
    }
    return;
};
