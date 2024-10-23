import { Options, StorageOptions, StorageType } from "../types/store";
import { isObject, mergeDeep, Mutators, parse, stringify } from "../utils";
import { isClient } from "../utils/client";

export const storageAction = <T>(
    actionType: StorageType = StorageType.G,
    options: Options<T> | undefined,
    mergeValue: T | undefined,
): T | undefined => {
    if (options && options.storage && isClient) {
        const { key, storage } = options;
        const { type = localStorage } = (
            isObject(storage) ? storage : {}
        ) as StorageOptions<T>;
        const mutators = (storage as StorageOptions<T>)[Mutators];
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
                            parse(data),
                        )
                    );
                }
                case StorageType.P:
                    type.setItem(
                        name,
                        stringify(
                            mergeDeep(actionType, {}, mutators, mergeValue),
                        ),
                    );
            }
        } catch {}
    }

    return;
};
