import { _setStoreValueEvent } from "./events";
import { getGlobalData } from "./get-global";
import { updateGlobalData } from "./global";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { generateStaticPathsMap, patchToGlobalMap } from "./maps/maps";
import { getMapByKey } from "./maps/utils";
import { createMutators } from "./mutators";
import { ValueOf } from "./types/index";
import {
    CreateResult,
    CreateState,
    GeneratedType,
    IGenerate,
    IStore,
    Options,
    WithM,
} from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    createNewArrayValues,
    entries,
    generateId,
    isAFunction,
    isClient,
    isNotMutator,
    isObject,
    SignRegExp,
    values,
} from "./utils";

const generatedTypes = values(GeneratedType);

const generateFunc = <T extends IStore<T>>(
    storeId: string,
    values: T,
    prevKey: string[] = [],
): IGenerate<T> =>
    entries(values).reduce((result, [key, val]) => {
        if (!key) return result;
        const keyName = capitalizeName(key);
        const prevKeyName = capitalizeKeysToString(prevKey);
        const path = prevKey.concat(key);
        const storePath = [storeId].concat(path);
        const mapKey = prevKeyName.concat(keyName);
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
                              ) => _setStoreValueEvent(storePath, val),
                              [GeneratedType.USE.concat(mapKey)]: () =>
                                  isClient
                                      ? useStoreVal({
                                            mapKey: storeId.concat(mapKey),
                                        })
                                      : null,
                              [GeneratedType.GET.concat(mapKey)]: () =>
                                  getGlobalData(storePath),
                          },
                          isObject(val) &&
                              generateFunc<IStore<T>>(storeId, val, path),
                      )
                : createMutators(
                      val as any,
                      prevKey,
                      [storeId].concat(prevKey),
                  ),
        );
    }, {} as IGenerate<T>);

export function createState<T extends IStore<T>>(
    params: T,
    options?: Options,
): IGenerate<CreateResult<T>>;
export function createState<T extends IStore<T>>(): {
    <U extends WithM<CreateState<T>>>(params: U, options?: Options): IGenerate<
        CreateResult<U>,
        CreateResult<T>
    >;
};
export function createState<T extends IStore<T>>(
    params?: T,
    options?: Options,
): any {
    return params ? createStateFn(params, options) : createStateFn;
}

export function createStateFn<T extends IStore<T>>(
    initialValues: T,
    options?: Options,
): IGenerate<CreateResult<T>> {
    const storeId = options?.key || generateId(initialValues);
    if (!getGlobalData([storeId])) {
        updateGlobalData([storeId], initialValues);
        generateStaticPathsMap(getGlobalData([storeId]), storeId);
    }

    const gen = generateFunc(storeId, initialValues);
    const handler = {
        get(target: any, name: string) {
            if (name in target) {
                return target[name];
            }
            const [type, ...functionName] = name.split(/(?=[A-Z$])/);
            const mapKey = storeId.concat(functionName.join(""));
            const splitName = capitalizeKeysToString(
                name.slice(name[0] === "$" ? 1 : 0).split(SignRegExp),
                true,
            );

            if (splitName in target && isAFunction(target[splitName])) {
                return (...args: any[]) => target[splitName](...args);
            }

            const isGenerated = generatedTypes.some((val) =>
                val.includes(type),
            );

            if (isGenerated && mapKey) {
                patchToGlobalMap(mapKey);
            }

            switch (type) {
                case GeneratedType.GET:
                    return (filterFunc?: Function) =>
                        getGlobalData(getMapByKey(mapKey), true, filterFunc);

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
                        const basePath = getMapByKey(mapKey);
                        if (basePath) {
                            console.log(basePath, args);

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
                                }
                                return;
                            }
                            return _setStoreValueEvent(basePath, filterFunc);
                        }
                    };
                case GeneratedType.RESET:
                    return () => {
                        const basePath = getMapByKey(mapKey);
                        _setStoreValueEvent(
                            basePath,
                            getGlobalData(basePath, true, undefined, {
                                [storeId]: initialValues,
                            }),
                        );
                    };
                default:
                    return () => undefined;
            }
        },
    };

    return new Proxy(gen, handler);
}
