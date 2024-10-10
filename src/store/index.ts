import { useLayoutEffect } from "react";
import { getGlobalBySrc, getGlobalData } from "./get-global";
import { updateStore, updateGlobalData } from "./global";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { generateStaticPathsMap, patchToGlobalMap } from "./maps/maps";
import { getMapByKey } from "./maps/utils";
import { generateMutators } from "./mutators";
import { storageAction } from "./storage";
import { IsUndefined } from "./types/flatten";
import {
    CreateResult,
    CreateState,
    FType,
    GeneratedType,
    IGenerate,
    IStore,
    Options,
    StorageType,
    UpdateType,
    WithM,
} from "./types/store";
import {
    capitalizeKeysToString,
    createNewArrayValues,
    findPathArrayIndex,
    generateId,
    isAFunction,
    isClient,
    pathToString,
    SignRegExp,
    values,
} from "./utils";

const SSRType = "_".concat(GeneratedType.SR.toLowerCase());
const generatedTypes = values(GeneratedType).concat(SSRType as GeneratedType);

export function createState<T extends IStore<T>>(
    params: T,
    options?: Options<T>,
): IGenerate<CreateResult<T>>;
export function createState<T extends IStore<T>>(): {
    <U extends WithM<CreateState<T>>>(
        params?: U,
        options?: Options<U & T>,
    ): IGenerate<
        CreateResult<U>,
        CreateResult<IsUndefined<U, keyof U, Partial<T>, T>>
    >;
};
export function createState<T extends IStore<T>>(
    params?: T,
    options?: Options<T>,
): any {
    return params ? createStateFn(params, options) : createStateFn;
}

export function createStateFn<T extends IStore<T>>(
    initialValues?: T,
    options?: Options<T>,
): IGenerate<CreateResult<T>> {
    const storeId = generateId(initialValues, options?.key);
    if (options) {
        options.key = storeId;
    }
    const storageValues = storageAction(StorageType.G, options, initialValues);

    if (!getGlobalData([storeId])) {
        updateGlobalData([storeId], storageValues || initialValues);
        generateStaticPathsMap(getGlobalData([storeId]), storeId);
    }
    const gen = generateMutators(storeId, initialValues || {}, options);
    const handler = {
        get(target: any, name: string) {
            if (name in target) {
                return target[name];
            }
            const [type, ...functionName] = name
                .replace(GeneratedType.SR, SSRType)
                .split(/(?=[A-Z$])/);
            if (type === "ssr") return new Proxy({}, handler);

            const mapKey = storeId.concat(pathToString(functionName));
            const splitName = capitalizeKeysToString(
                name.slice(name[0] === "$" ? 1 : 0).split(SignRegExp),
                true,
            );

            if (splitName in target && isAFunction(target[splitName])) {
                return target[splitName];
            }

            const isGenerated = generatedTypes.some((val) =>
                val.includes(type),
            );

            if (isGenerated && mapKey) {
                patchToGlobalMap(mapKey);
            }

            switch (type) {
                case SSRType:
                    return ({ value }: any) => {
                        const basePath = getMapByKey(mapKey);
                        if (basePath) {
                            updateGlobalData(basePath, value);

                            useLayoutEffect(() => {
                                if (options && options.storage) {
                                    const storage = getGlobalBySrc(
                                        getMapByKey(mapKey),
                                        storeId,
                                        storageValues,
                                    );
                                    if (storage) {
                                        updateStore(
                                            basePath,
                                            storage,
                                            undefined,
                                            UpdateType.P,
                                        );
                                    }
                                }
                            }, []);
                        }
                    };
                case GeneratedType.G:
                    return (filterFunc?: FType) =>
                        getGlobalData(getMapByKey(mapKey), true, filterFunc);

                case GeneratedType.U:
                    return (filterFunc?: FType) =>
                        isClient()
                            ? useStoreVal({
                                  mapKey,
                                  filterFunc,
                              })
                            : getGlobalData(
                                  getMapByKey(mapKey),
                                  true,
                                  filterFunc,
                              );

                case GeneratedType.S:
                    return function () {
                        const args = <any>arguments;
                        const [filterFunc, arrValue] = args as [FType, any];
                        const basePath = getMapByKey(mapKey);
                        if (basePath) {
                            if (args.length > 1) {
                                const sliceIdx = findPathArrayIndex(basePath);

                                if (sliceIdx >= 0) {
                                    const additionalPaths = basePath.slice(
                                        sliceIdx + 1,
                                    );
                                    const arrRootPath = basePath.slice(
                                        0,
                                        sliceIdx,
                                    );

                                    updateStore(
                                        arrRootPath,
                                        createNewArrayValues(
                                            additionalPaths,
                                            getGlobalData(arrRootPath),
                                            arrValue,
                                            filterFunc,
                                        ),
                                        options,
                                    );
                                }
                                return;
                            }
                            return updateStore(basePath, filterFunc, options);
                        }
                    };
                case GeneratedType.R:
                    return () => {
                        const basePath = getMapByKey(mapKey);
                        updateStore(
                            basePath,
                            getGlobalBySrc(basePath, storeId, initialValues),
                            options,
                        );
                    };
                default:
                    return () => undefined;
            }
        },
    };
    return new Proxy(gen, handler);
}
