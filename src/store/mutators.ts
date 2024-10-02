import { _setStoreValueEvent } from "./events";
import { getGlobalData } from "./get-global";
import { UpdateType } from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    entries,
    getParams,
    isAFunction,
} from "./utils";

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
