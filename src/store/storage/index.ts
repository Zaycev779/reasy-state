import { getGlobalData } from "../global/get";
import { IStore, Options, StorageOptions, StorageType } from "../types/store";
import { isObject, mergeDeep, stringify } from "../utils";
import { isClient } from "../utils/client";

const storagePrefix = "_res";

export const storageAction = <T extends IStore<T>>(
    actionType: StorageType,
    options?: Options<T>,
    initial?: T,
): IStore<T> | undefined => {
    if (options && options.storage && isClient) {
        const { key, storage } = options;
        const { type, mutators } = (
            isObject(storage) ? storage : { type: localStorage }
        ) as StorageOptions<T>;

        const name = storagePrefix + key;

        try {
            switch (actionType) {
                case StorageType.G: {
                    const data = type.getItem(name);

                    if (data) {
                        return mergeDeep(
                            actionType,
                            {},
                            initial,
                            mutators,
                            JSON.parse(data || "{}"),
                        );
                    }
                    return;
                }
                case StorageType.P: {
                    const toString = stringify(
                        mergeDeep(
                            actionType,
                            {},
                            mutators,
                            getGlobalData([key]),
                        ),
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
