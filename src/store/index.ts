//import { CreateState } from 'reasy-state';
import { _setStoreValueEvent } from "./events";
import { getGlobalData } from "./get-global";
import {
    generateStaticPathsMap,
    patchToGlobalMap,
    updateGlobalData,
} from "./global";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { Entries, ValueOf } from "./types/index";
import {
    CreateResult,
    CreateState,
    GeneratedType,
    IGenerate,
    IStore,
    UpdateType,
    WithM,
} from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    createNewArrayValues,
    entries,
    getParams,
    isAFunction,
    isClient,
    isNotMutator,
    isObject,
} from "./utils";

const generateFunc = <T extends IStore<T>>(
    values: T,
    prevKey: string[] = [],
) => {
    const result: IGenerate<T> = entries(values as IStore<T>).reduce(
        (result, [key, val]) => {
            if (!key) return result;
            const keyName = capitalizeName(key);
            const prevKeyName = capitalizeKeysToString(prevKey);
            const path = prevKey.concat(key);
            const mapKey = `${prevKeyName}${keyName}`;
            return assign(
                result,
                isNotMutator(keyName)
                    ? !keyName.includes("_") &&
                          assign(
                              {
                                  [GeneratedType.SET.concat(mapKey)]: (
                                      val:
                                          | Partial<ValueOf<T>>
                                          | ((
                                                prev: ValueOf<T>,
                                            ) => Partial<ValueOf<T>>),
                                  ) => _setStoreValueEvent(path, val),
                                  [GeneratedType.USE.concat(mapKey)]: () =>
                                      isClient ? useStoreVal({ mapKey }) : null,
                                  [GeneratedType.GET.concat(mapKey)]: () =>
                                      getGlobalData(path),
                              },
                              isObject(val) &&
                                  generateFunc<IStore<T>>(
                                      val as IStore<T>,
                                      path,
                                  ),
                          )
                    : createMutators(val as any, prevKey),
            );
        },
        {} as IGenerate<T>,
    );

    return result;
};

const createMutators = (values: Record<string, Function>, path: string[]) => {
    const pathName = path[0] + capitalizeKeysToString(path.slice(1));
    return entries(values).reduce((prev, [key, val]) => {
        const keyName = capitalizeName(key);
        const set = (arg: any, type: UpdateType = "set") => {
            const params = getParams(arg, getGlobalData(path));
            _setStoreValueEvent(path, params, type);
            return getGlobalData(path);
        };

        const patch = (arg: any) => set(arg, "patch");

        const get = () => getGlobalData(path);

        return assign(prev, {
            [pathName.concat(keyName)]: (...args: any) => {
                const fn = val({ set, get, patch }, getGlobalData(path));
                if (isAFunction(fn)) {
                    return fn(...args);
                }
                return fn;
            },
        });
    }, {});
};

export function createState<T extends IStore<T>>(
    params: T,
): IGenerate<CreateResult<T>>;
export function createState<T extends IStore<T>>(): {
    <U extends WithM<CreateState<T>>>(params: U): IGenerate<
        CreateResult<U>,
        CreateResult<T>
    >;
};
export function createState<T extends IStore<T>>(params?: T) {
    if (params && typeof params !== "undefined") {
        return createStateFn(params);
    }
    return <U extends WithM<CreateState<T>>>(params: U) =>
        createStateFn(params as unknown as T) as IGenerate<
            CreateResult<U>,
            CreateResult<T>
        >;
}

export function createStateFn<T extends IStore<T>>(
    initialValues: T,
): IGenerate<CreateResult<T>> {
    const stores = Object.keys(initialValues);

    stores.forEach((store) => {
        if (!EStorage.get()?.[store]) {
            updateGlobalData(
                [store],
                (initialValues as Record<string, any>)?.[store],
            );
            generateStaticPathsMap(EStorage.get()?.[store], store);
        }
    });
    const gen = generateFunc(initialValues);
    const handler = {
        get(target: any, name: string) {
            if (name in target) {
                return target[name];
            }
            const [type, ...functionName] = name.split(/(?=[A-Z])/);
            const mapKey = functionName.join("");
            const splitName = capitalizeKeysToString(
                name.split(/[\s$]+/),
                true,
            );

            if (splitName in target && isAFunction(target[splitName])) {
                return (...args: any[]) => target[splitName](...args);
            }

            const isGenerated = Object.values(GeneratedType).some((val) =>
                val.includes(type),
            );
            if (isGenerated && mapKey) {
                patchToGlobalMap(mapKey);
            }

            switch (type) {
                case GeneratedType.GET:
                    return (filterFunc?: Function) =>
                        getGlobalData(
                            EStorage.getMapByKey(mapKey),
                            true,
                            filterFunc,
                        );

                case GeneratedType.USE:
                    return (filterFunc?: Function) =>
                        isClient
                            ? useStoreVal({
                                  mapKey,
                                  filterFunc,
                              })
                            : null;

                case GeneratedType.SET:
                    return (...args: [Function] | [Function, any]) => {
                        const [filterFunc, arrValue] = args;
                        const basePath = EStorage.getMapByKey(mapKey);
                        if (basePath) {
                            if (args.length > 1) {
                                const arrrIdx =
                                    basePath?.findIndex(
                                        (val) => val === "[]",
                                    ) ?? -1;
                                if (arrrIdx >= 0 && basePath) {
                                    const additionalPaths = basePath.slice(
                                        arrrIdx + 1,
                                        basePath.length,
                                    );
                                    const arrRootPath = basePath.slice(
                                        0,
                                        arrrIdx,
                                    );
                                    const prev = getGlobalData(arrRootPath);
                                    const value = createNewArrayValues(
                                        additionalPaths,
                                        prev,
                                        arrValue,
                                        filterFunc,
                                    );
                                    _setStoreValueEvent(arrRootPath, value);
                                    return;
                                }
                                return;
                            }
                            return _setStoreValueEvent(basePath, filterFunc);
                        }
                    };

                case GeneratedType.RESET:
                    return () => {
                        const basePath = EStorage.getMapByKey(mapKey);
                        return _setStoreValueEvent(
                            basePath,
                            getGlobalData(
                                basePath,
                                true,
                                undefined,
                                initialValues,
                            ),
                        );
                    };

                default:
                    return () => undefined;
            }
        },
    };

    return new Proxy(gen, handler);
}
