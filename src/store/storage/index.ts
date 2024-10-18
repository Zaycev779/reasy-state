import { getGlobalData } from "../global/get";
import { Options, StorageOptions, StorageType } from "../types/store";
import { isObject, mergeDeep, stringify } from "../utils";
import { isClient } from "../utils/client";

export const storageAction = <T>(
    actionType: StorageType,
    options?: Options<T>,
    initial?: T,
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
