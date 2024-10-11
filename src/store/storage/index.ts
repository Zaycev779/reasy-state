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
    if (options && isClient()) {
        const { key, storage } = options;
        if (key && storage) {
            const { type, mutators } = (
                isObject(storage) ? storage : { type: localStorage }
            ) as StorageOptions<T>;

            const name = storagePrefix.concat(key);
            try {
                switch (actionType) {
                    case StorageType.G: {
                        const data = type.getItem(name);

                        if (data) {
                            const parse = JSON.parse(data || "{}");
                            return mergeDeep(
                                actionType,
                                {},
                                initial,
                                mutators,
                                parse,
                            );
                        }
                        return;
                    }
                    case StorageType.P: {
                        const data = getGlobalData([key]);
                        const toString = stringify(
                            mergeDeep(actionType, {}, mutators, data),
                        );
                        if (toString) {
                            type.setItem(name, toString);
                        }
                    }
                }
            } catch {}
        }
    }
    return;
};
