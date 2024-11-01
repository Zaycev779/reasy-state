import { ValueOf } from "../types";
import { Options, StorageOptions, StorageType } from "../types/store";
import { mergeDeep, Mutators, parse, stringify, isClient } from "../utils";

export const storageAction = <T>(
    actionType: ValueOf<typeof StorageType> = StorageType.G,
    { storage, key }: Options<T>,
    mergeValue: T | undefined,
    data?: any,
): T | undefined => {
    if (storage && isClient) {
        try {
            const type = (storage as StorageOptions<T>).type || localStorage;
            const mutators = (storage as StorageOptions<T>)[Mutators];

            return actionType === StorageType.G
                ? (data = type.getItem(key)) &&
                      mergeDeep(
                          actionType,
                          {},
                          mergeValue,
                          mutators,
                          parse(data),
                      )
                : type.setItem(
                      key,
                      stringify(
                          mergeDeep(actionType, {}, mutators, mergeValue),
                      ),
                  );
        } finally {
        }
    }
};
