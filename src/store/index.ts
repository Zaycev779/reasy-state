import { getGlobalData } from "./global/get";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { getStaticPath, patchToGlobalMap } from "./maps/maps";
import { generateMutators } from "./mutators";
import { storageAction } from "./storage";
import { IsUndefined } from "./types/flatten";
import {
    CreateResult,
    CreateState,
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
    isClient,
} from "./utils";
import { updateStore } from "./global/update";
import { EStorage } from "./global";

let EStateId = 0;
const E = "E#";

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
    options: Options<T> = {} as Options<T>,
    id = options.key ? (options.key = E + options.key) : E + ++EStateId,
    storageValues = storageAction(StorageType.G, options, initialValues),
    isInit: any = options.ssr,
    s = createCopy((!isInit && storageValues) || initialValues),
    storage: EStorage = {
        s,
        m: getStaticPath(s),
        id,
    },
): IGenerate<CreateResult<T>> =>
    new Proxy(generateMutators(storage, initialValues, options), {
        get: (
            target: any,
            name: string,
            proxy: typeof Proxy,
            [type, ...functionName] = split(
                name.replace(GeneratedType.H, GeneratedType.h),
                /(?=[A-Z$])/,
            ),
            mapKey = pathToString(functionName),
            storageInit = () => (
                (isInit = 0),
                isClient &&
                    storageValues &&
                    requestAnimationFrame(() =>
                        updateStore<T>(storage, [], options, storageValues),
                    )
            ),
        ): any => {
            if (name === GeneratedType.h) return proxy;
            return (
                target[capitalizeKeysToString(split(name))] ||
                (patchToGlobalMap(storage, mapKey),
                (...[filterFunc, ...args]: any) => {
                    const basePath = storage.m[mapKey];
                    isInit && storageInit();
                    switch (type) {
                        case GeneratedType.h:
                            return updateStore(
                                storage,
                                basePath,
                                options,
                                filterFunc.value,
                                UpdateType.S,
                                false,
                            );

                        case GeneratedType.U:
                            if (isClient)
                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                return useStoreVal(storage, mapKey, filterFunc);

                        case GeneratedType.G:
                            return getGlobalData(
                                storage.s,
                                basePath,
                                true,
                                filterFunc,
                            );
                        case GeneratedType.R:
                        case GeneratedType.S: {
                            const [arrParams] = args,
                                arrIdx = findPathArrayIndex(basePath),
                                path = arrParams
                                    ? slice(basePath, 0, arrIdx - 1)
                                    : basePath;

                            (!args.length || arrIdx) &&
                                updateStore(
                                    storage,
                                    path,
                                    options,
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
                                );
                        }
                    }
                })
            );
        },
    });
