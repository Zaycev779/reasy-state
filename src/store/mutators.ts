import { getGlobalData } from "./global/get";
import { updateStore } from "./global/update";
import { ValueOf } from "./types";
import { EStorage, UpdateType } from "./types/store";
import {
    capitalizeKeysToString,
    concat,
    getParams,
    isDefaultObject,
    Mutators,
    reduceAssign,
} from "./utils";

export const generateMutators = <T extends any>(
    storage: EStorage,
    values: T,
    prevKey: string[] = [],
    nextKey: string | string[] = prevKey,
    get = () => getGlobalData(storage, prevKey),
    set = (arg: any, type: ValueOf<typeof UpdateType>) => (
        updateStore(storage, prevKey, getParams(arg, get()), type), get()
    ),
): any =>
    reduceAssign<any>(values, (key, val) =>
        nextKey === Mutators
            ? {
                  [capitalizeKeysToString(concat(prevKey, key))]: (
                      ...args: any
                  ) =>
                      getParams(
                          val(
                              {
                                  get,
                                  [UpdateType.S]: set,
                                  [UpdateType.P]: (arg: any) =>
                                      set(arg, UpdateType.P),
                              },
                              get(),
                          ),
                          ...args,
                      ),
              }
            : isDefaultObject(val) &&
              generateMutators(storage, val, concat(prevKey, nextKey), key),
    );
