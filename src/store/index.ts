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
    generateArray,
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
        get(target: any, name: string): any {
            if (name === GeneratedType.sr) return new Proxy({}, handler);

            const splitName = capitalizeKeysToString(split(name));
            const [type, ...functionName] = split(
                name.replace(GeneratedType.SR, GeneratedType.sr),
                /(?=[A-Z$])/,
            );

            const mapKey = storeId + pathToString(functionName);

            if (splitName in target) return target[splitName];

            patchToGlobalMap(storage, mapKey);

            switch (type) {
                case GeneratedType.sr:
                    return (params: any) => {
                        const basePath = getMapByKey(storage, mapKey);
                        const storageVal = getGlobalData<any>(
                            storageValues,
                            basePath,
                            true,
                        );

                        updateStore(storage, basePath, params.value);
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        useLayoutEffect(() => {
                            storageVal &&
                                updateStore(
                                    storage,
                                    basePath,
                                    storageVal,
                                    undefined,
                                    UpdateType.P,
                                );
                        }, []);
                    };
                case GeneratedType.U:
                    if (isClient)
                        return (filterFunc?: FType) =>
                            // eslint-disable-next-line react-hooks/rules-of-hooks
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
                    return (...args: any) => {
                        const [filterFunc, arrParams] = args,
                            basePath = getMapByKey(storage, mapKey),
                            arrIdx = findPathArrayIndex(basePath),
                            isUpdate = args.length < 2 || arrIdx,
                            path = arrParams
                                ? slice(basePath, 0, arrIdx - 1)
                                : basePath;

                        isUpdate &&
                            updateStore(
                                storage,
                                path,
                                type === GeneratedType.R
                                    ? initialValues
                                    : arrParams
                                    ? generateArray(
                                          slice(basePath, arrIdx),
                                          getGlobalData(storage.s, path),
                                          arrParams,
                                          filterFunc,
                                      )
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
