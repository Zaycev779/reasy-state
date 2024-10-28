import { Options, StorageOptions, StorageType } from "../types/store";
import {
    isObject,
    mergeDeep,
    Mutators,
    parse,
    stringify,
    isClient,
} from "../utils";

export const storageAction = <T>(
    actionType: StorageType = StorageType.G,
    options: Options<T>,
    mergeValue: T | undefined,
    storage = options.storage,
): T | undefined => {
    if (storage && isClient) {
        const type = (storage as StorageOptions<T>).type || localStorage;
        const mutators = (storage as StorageOptions<T>)[Mutators];
        const name = "E$" + options.key;
        try {
            if (actionType === StorageType.G) {
                const data = type.getItem(name);
                return (
                    data &&
                    mergeDeep(actionType, {}, mergeValue, mutators, parse(data))
                );
            }

            type.setItem(
                name,
                stringify(mergeDeep(actionType, {}, mutators, mergeValue)),
            );
        } catch {}
    }

    return;
};
