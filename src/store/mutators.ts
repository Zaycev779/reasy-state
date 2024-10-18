import { getGlobalData } from "./global/get";
import { updateStore } from "./global/update";
import { Options, UpdateType } from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    concat,
    entries,
    getParams,
    isDefaultObject,
    Mutators,
} from "./utils";

const reduceMutators = <T extends object>(
    store: T,
    value: (key: string, val: any) => any,
) =>
    entries(store).reduce((prev, entrie) => assign(prev, value(...entrie)), {});

export const generateMutators = <T extends object>(
    storeId: string,
    values: T,
    options?: Options<any>,
    prevKey: string[] = [],
): any =>
    reduceMutators(values, (key, val) => {
        if (key === Mutators) {
            return reduceMutators(val, (key, fn) => ({
                [capitalizeKeysToString(concat(prevKey, key))]: (
                    ...args: any
                ) => {
                    const storePath = concat([storeId], prevKey),
                        get = () => getGlobalData(storePath),
                        set = (arg: any, type: UpdateType = UpdateType.S) => {
                            updateStore(
                                storePath,
                                getParams(arg, get()),
                                options,
                                type,
                            );
                            return get();
                        },
                        patch = (arg: any) => set(arg, UpdateType.P);

                    return getParams(fn({ set, get, patch }, get()), ...args);
                },
            }));
        }
        return (
            isDefaultObject(val) &&
            generateMutators(storeId, val, options, concat(prevKey, key))
        );
    });
