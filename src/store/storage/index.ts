import { Options, StorageOptions, StorageType } from "../types/store";
import { isObject, mergeDeep, stringify } from "../utils";
import { isClient } from "../utils/client";

export const storageAction = <T>(
    actionType: StorageType = StorageType.G,
    options: Options<T> | undefined,
    mergeValue: T | undefined,
): T | undefined => {
    if (options && options.storage && isClient) {
        const { key, storage } = options;
        const { type = localStorage, mutators } = (
            isObject(storage) ? storage : {}
        ) as StorageOptions<T>;

        const name = "E$" + key;

        try {
            switch (actionType) {
                case StorageType.G: {
                    const data = type.getItem(name);
                    return (
                        data &&
                        mergeDeep(
                            actionType,
                            {},
                            mergeValue,
                            mutators,
                            JSON.parse(data),
                        )
                    );
                }
                case StorageType.P: {
                    const toString = stringify(
                        mergeDeep(actionType, {}, mutators, mergeValue),
                    );

                    if (toString) {
                        type.setItem(name, toString);
                    }
                }
            }
        } catch {}
    }

    return;
};
