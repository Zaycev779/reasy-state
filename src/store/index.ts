import { getGlobalData } from "./global/get";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { patchToGlobalMap } from "./maps/maps";
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
    Options,
    StorageType,
    UpdateType,
    WithM,
} from "./types/store";
import {
    capitalizeKeysToString,
    createCopy,
    createNewArrayValues,
    findPathArrayIndex,
    pathToString,
    split,
    slice,
} from "./utils";
import { updateStore } from "./global/update";
import { generateId } from "./global/generate-id";
import { isClient, useLayoutEffect } from "./utils/client";
import { createStorage } from "./global";

export function createState<T>(
    params: WithM<T>,
    options?: Options<T>,
): IGenerate<CreateResult<T>>;
export function createState<T>(): {
    <U extends WithM<CreateState<T>>>(
        params?: WithM<U>,
        options?: Options<U & T>,
    ): IGenerate<
        CreateResult<
            U extends { [K in string]: unknown }
                ? IsUndefined<T, keyof T, Partial<U>, U>
                : T
        >,
        CreateResult<IsUndefined<U, keyof U, Partial<T>, T>>
    >;
};
export function createState<T>(params?: T, options?: Options<T>): any {
    return params ? _createState(params, options) : _createState;
}

export const _createState = <T>(
    initialValues?: T,
    options?: Options<T>,
): IGenerate<CreateResult<T>> => {
    const storeId = generateId<T>(options),
        storageValues = storageAction(StorageType.G, options, initialValues),
        storage = createStorage(
            storeId,
            storageValues || createCopy(initialValues),
        );

    const handler = {
        get(target: object, name: string): any {
            if (name === GeneratedType.sr) return new Proxy({}, handler);

            const splitName = capitalizeKeysToString(split(name));
            if (splitName in target) return target[splitName];

            const [type, ...functionName] = split(
                name.replace(GeneratedType.SR, GeneratedType.sr),
                /(?=[A-Z$])/,
            );

            const mapKey = storeId + pathToString(functionName);
            patchToGlobalMap(storage, mapKey);

            switch (type) {
                case GeneratedType.sr:
                    return (value: any) => {
                        const basePath = getMapByKey(storage, mapKey);
                        const storageVal = getGlobalData(
                            storageValues,
                            basePath,
                            true,
                        );

                        updateStore(storage, basePath, value);
                        useLayoutEffect(
                            () =>
                                storageVal &&
                                updateStore(
                                    storage,
                                    basePath,
                                    storageVal,
                                    undefined,
                                    UpdateType.P,
                                ),
                            [],
                        );
                    };
                case GeneratedType.U:
                    if (isClient)
                        return (filterFunc?: FType) =>
                            useStoreVal(storage, mapKey, filterFunc);
                case GeneratedType.G:
                    return (filterFunc?: FType) =>
                        getGlobalData(
                            storage.s,
                            getMapByKey(storage, mapKey),
                            true,
                            filterFunc,
                        );
                case GeneratedType.R:
                case GeneratedType.S:
                    return (filterFunc: FType, arrParams?: any) => {
                        const basePath = getMapByKey(storage, mapKey),
                            arrIdx = findPathArrayIndex(basePath),
                            path = arrParams
                                ? slice(basePath, 0, arrIdx)
                                : basePath;

                        updateStore(
                            storage,
                            path,
                            arrParams
                                ? createNewArrayValues(
                                      slice(basePath, arrIdx + 1),
                                      getGlobalData(storage.s, path),
                                      arrParams,
                                      filterFunc,
                                  )
                                : type === GeneratedType.R
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

    return new Proxy(
        generateMutators(storage, initialValues, options),
        handler,
    );
};
