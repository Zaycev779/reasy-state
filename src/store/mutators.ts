import { getGlobalData } from "./global/get";
import { updateStore } from "./global/update";
import { IStore, Options, UpdateType } from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    concat,
    entries,
    getParams,
    isAFunction,
    isDefaultObject,
    isNotMutator,
} from "./utils";

const reduceMutators = <T extends IStore<T>>(
    store: T,
    value: (key: string, val: any) => any,
) =>
    entries(store).reduce(
        (prev, [key, val]) => assign(prev, value(key, val)),
        {},
    );

export const generateMutators = <T extends IStore<T>>(
    storeId: string,
    values: T,
    options?: Options<any>,
    prevKey: string[] = [],
): any =>
    reduceMutators(values, (key, val) =>
        isNotMutator(capitalizeName(key))
            ? isDefaultObject(val) &&
              generateMutators<IStore<T>>(
                  storeId,
                  val,
                  options,
                  concat(prevKey, key),
              )
            : createMutators(val, prevKey, concat([storeId], prevKey), options),
    );

export const createMutators = (
    values: Record<string, Function>,
    path: string[],
    storePath: string[],
    options?: Options<any>,
) => {
    const pathName = path[0] + capitalizeKeysToString(path.slice(1));
    const get = () => getGlobalData(storePath);
    const set = (arg: any, type: UpdateType = UpdateType.S) => {
        updateStore(storePath, getParams(arg, get()), options, type);
        return get();
    };
    const patch = (arg: any) => set(arg, UpdateType.P);

    return reduceMutators(values, (key, val) => ({
        [pathName + capitalizeName(key)]: (...args: any) => {
            const fn = val({ set, get, patch }, get());
            return getParams(fn, ...args);
        },
    }));
};
