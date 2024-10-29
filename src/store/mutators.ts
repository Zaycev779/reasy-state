import { EStorage } from "./global";
import { getGlobalData } from "./global/get";
import { updateStore } from "./global/update";
import { ValueOf } from "./types";
import { Options, UpdateType } from "./types/store";
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
    options: Options<any>,
    prevKey: string[] = [],
): any =>
    reduceAssign<any>(values, (key, val) =>
        key === Mutators
            ? reduceAssign(
                  val,
                  (
                      key,
                      fn,
                      get = () => getGlobalData(storage.s, prevKey),
                      set = (arg: any, type: ValueOf<typeof UpdateType>) => (
                          updateStore(
                              storage,
                              prevKey,
                              options,
                              getParams(arg, get()),
                              type,
                          ),
                          get()
                      ),
                      patch = (arg: any) => set(arg, UpdateType.P),
                  ) => ({
                      [capitalizeKeysToString(concat(prevKey, key))]: (
                          ...args: any
                      ) =>
                          getParams(
                              fn(
                                  {
                                      get,
                                      [UpdateType.S]: set,
                                      [UpdateType.P]: patch,
                                  },
                                  get(),
                              ),
                              ...args,
                          ),
                  }),
              )
            : isDefaultObject(val) &&
              generateMutators(storage, val, options, concat(prevKey, key)),
    );
