import { useLayoutEffect } from "react";
import { getGlobalBySrc, getGlobalData } from "./global/get";
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
    concat,
    createNewArrayValues,
    findPathArrayIndex,
    OptionalKey,
    pathToString,
    SignRegExp,
    values,
} from "./utils";
import { updateGlobalData, updateStore } from "./global/update";
import { generateId } from "./global/generate-id";
import { isClient } from "./utils/client";

const SSRType = "_" + GeneratedType.SR.toLowerCase();
const generatedTypes = concat(
    values(GeneratedType),
    SSRType,
) as GeneratedType[];

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

export const createStateFn = <T extends IStore<T>>(
    initialValues?: T,
    options?: Options<T>,
): IGenerate<CreateResult<T>> => {
    const storeId = generateId(initialValues, options?.key);
    if (options) {
        options.key = storeId;
    }
    const storageValues = storageAction(StorageType.G, options, initialValues);

    updateGlobalData([storeId], storageValues || initialValues);
    generateStaticPathsMap(storeId);

    const gen = generateMutators(storeId, initialValues || {}, options);
    const handler = {
        get(target: any, name: string): any {
            const [type, ...functionName] = name
                .replace(GeneratedType.SR, SSRType)
                .split(/(?=[A-Z$])/);
            if (type === "ssr") return new Proxy({}, handler);

            const mapKey = concat(storeId, pathToString(functionName));

            const splitName = capitalizeKeysToString(
                name.slice(+(name[0] === OptionalKey)).split(SignRegExp),
                true,
            );

            if (splitName in target) {
                return target[splitName];
            }

            if (generatedTypes.some((val) => val.includes(type))) {
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
                                        basePath,
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
                case GeneratedType.U:
                    if (isClient)
                        return (filterFunc?: FType) =>
                            useStoreVal(mapKey, filterFunc);
                case GeneratedType.G:
                    return (filterFunc?: FType) =>
                        getGlobalData(getMapByKey(mapKey), true, filterFunc);
                case GeneratedType.R:
                case GeneratedType.S:
                    return (filterFunc: FType, arrValue?: any) => {
                        const basePath = getMapByKey(mapKey);
                        if (!basePath) return;
                        if (arrValue) {
                            const sliceIdx = findPathArrayIndex(basePath);

                            if (sliceIdx >= 0) {
                                const additionalPaths = basePath.slice(
                                    sliceIdx + 1,
                                );
                                const arrRootPath = basePath.slice(0, sliceIdx);

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
                        updateStore(
                            basePath,
                            type === GeneratedType.R
                                ? initialValues
                                : filterFunc,
                            options,
                        );
                    };

                default:
                    return () => undefined;
            }
        },
    };
    return new Proxy(gen, handler);
};
