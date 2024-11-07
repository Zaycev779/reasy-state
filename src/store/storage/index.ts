import { Options, StorageOptions, StorageType } from "../types/store";
import { mergeDeep, Mutators, parse, stringify, isClient } from "../utils";

export const storageAction = <T>(
    { storage, key }: Options<T>,
    mergeValue: T | undefined,
    actionType?: 1,
    data?: any,
): T | undefined => {
    if (storage && isClient) {
        try {
            const type = (storage as StorageOptions<T>).type || localStorage;
            const mutators = (storage as StorageOptions<T>)[Mutators];

            return actionType
                ? (data = type.getItem(key)) &&
                      mergeDeep(
                          StorageType.G,
                          {},
                          mergeValue,
                          mutators,
                          parse(data),
                      )
                : type.setItem(
                      key,
                      stringify(
                          mergeDeep(StorageType.P, {}, mutators, mergeValue),
                      ),
                  );
        } finally {
        }
    }
};
