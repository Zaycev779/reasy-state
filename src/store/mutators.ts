import { _setStoreValueEvent } from "./events";
import { getGlobalData } from "./get-global";
import { IGenerate, IStore, UpdateType } from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    entries,
    getParams,
    isAFunction,
    isDefaultObject,
    isNotMutator,
} from "./utils";

export const generateMutators = <T extends IStore<T>>(
    storeId: string,
    values: T,
    prevKey: string[] = [],
): IGenerate<T> =>
    entries(values).reduce((result, [key, val]) => {
        if (!key) return result;
        const keyName = capitalizeName(key);
        const path = prevKey.concat(key);
        return assign(
            result,
            isNotMutator(keyName)
                ? isDefaultObject(val) &&
                      generateMutators<IStore<T>>(storeId, val, path)
                : createMutators(
                      val as any,
                      prevKey,
                      [storeId].concat(prevKey),
                  ),
        );
    }, {} as IGenerate<T>);

export const createMutators = (
    values: Record<string, Function>,
    path: string[],
    storePath: string[],
) => {
    const pathName = path[0] + capitalizeKeysToString(path.slice(1));
    const get = () => getGlobalData(storePath);
    const set = (arg: any, type: UpdateType = "set") => {
        const params = getParams(arg, get());
        _setStoreValueEvent(storePath, params, type);
        return get();
    };
    const patch = (arg: any) => set(arg, "patch");

    return entries(values).reduce(
        (prev, [key, val]) =>
            assign(prev, {
                [pathName.concat(capitalizeName(key))]: (...args: any) => {
                    const fn = val({ set, get, patch }, get());
                    return isAFunction(fn) ? fn(...args) : fn;
                },
            }),
        {},
    );
};
