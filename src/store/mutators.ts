import { getGlobalData } from "./get-global";
import { updateStore } from "./global";
import { IGenerate, IStore, Options, UpdateType } from "./types/store";
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
    options?: Options<any>,
    prevKey: string[] = [],
): IGenerate<T> =>
    entries<any>(values).reduce(
        (result, [key, val]) =>
            key
                ? assign(
                      result,
                      isNotMutator(capitalizeName(key))
                          ? isDefaultObject(val) &&
                                generateMutators<IStore<T>>(
                                    storeId,
                                    val,
                                    options,
                                    prevKey.concat(key),
                                )
                          : createMutators(
                                val,
                                prevKey,
                                [storeId].concat(prevKey),
                                options,
                            ),
                  )
                : result,
        {} as IGenerate<T>,
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

    return entries(values).reduce(
        (prev, [key, val]) =>
            assign(prev, {
                [pathName.concat(capitalizeName(key))]: function () {
                    const fn = val({ set, get, patch }, get());
                    return isAFunction(fn) ? fn.apply(null, arguments) : fn;
                },
            }),
        {},
    );
};
