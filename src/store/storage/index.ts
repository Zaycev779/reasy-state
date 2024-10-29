import { ValueOf } from "../types";
import { Options, StorageOptions, StorageType } from "../types/store";
import { mergeDeep, Mutators, parse, stringify, isClient } from "../utils";

export const storageAction = <T>(
    actionType: ValueOf<typeof StorageType> = StorageType.G,
    { storage, key }: Options<T>,
    mergeValue: T | undefined,
): T | undefined => {
    if (storage && isClient) {
        try {
            const type = (storage as StorageOptions<T>).type || localStorage;
            const mutators = (storage as StorageOptions<T>)[Mutators];

            if (actionType === StorageType.G) {
                const data = type.getItem(key);
                return (
                    data &&
                    mergeDeep(actionType, {}, mergeValue, mutators, parse(data))
                );
            }

            type.setItem(
                key,
                stringify(mergeDeep(actionType, {}, mutators, mergeValue)),
            );
        } catch {}
    }

    return;
};
