import { getGlobalData } from "./global/get";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { getStaticPath, patchToGlobalMap } from "./maps/maps";
import { generateMutators } from "./mutators";
import { storageAction } from "./storage";
import { IsUndefined } from "./types/flatten";
import {
    CreateResult,
    CreateState,
    EStorage,
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
    createCopy,
    generateArray,
    split,
    slice,
    isClient,
    isPathNameType,
} from "./utils";
import { updateStore } from "./global/update";

let EStateId = 0;
const E = "E#";

export function createState<T = IStore>(
    params: WithM<T>,
    options?: Options<T>,
): IGenerate<CreateResult<T>>;
export function createState<T>(): {
    <
        U extends WithM<CreateState<unknown extends T ? any : T>> = WithM<
            CreateState<unknown extends T ? IStore : T>
        >,
    >(
        params?: U,
        options?: Options<U & T>,
    ): IGenerate<
        CreateResult<
            IsUndefined<U, keyof U, Partial<T>, T> & U extends {
                [K in string]: unknown;
            }
                ? IsUndefined<T, keyof T, Partial<U>, U>
                : unknown extends T
                ? U
                : T
        >,
        CreateResult<IsUndefined<U, keyof U, Partial<T>, T>>
    >;
};
export function createState<T>(params?: T, options?: Options<T>): any {
    return params ? _createState(params, options) : _createState;
}

const _createState = <T>(
    initialValues?: T,
    options: Options<T> = {} as Options<T>,
    id = (options.key = E + (options.key || ++EStateId)),
    storageValues = storageAction(StorageType.G, options, initialValues),
    isInit: any = options[GeneratedType.h],
    storage: EStorage = {
        id,
        s: createCopy((!isInit && storageValues) || initialValues),
        o: options,
    } as EStorage,
): IGenerate<CreateResult<T>> => (
    (storage.m = getStaticPath(storage.s)),
    new Proxy(generateMutators(storage, initialValues), {
        get: (
            target: any,
            name: string,
            proxy: typeof Proxy,
            [, type, mapKey] = split(name, /(SSR|[^A-Z$]+)(.*)/),
            storageInit = () => (
                (isInit = 0),
                storageValues &&
                    requestAnimationFrame(() =>
                        updateStore<T>(storage, [], storageValues),
                    )
            ),
        ): any => {
            if (name === GeneratedType.h) return proxy;

            return (
                target[capitalizeKeysToString(split(name))] ||
                (patchToGlobalMap(storage, mapKey),
                (...args: any) => {
                    const basePath = storage.m[mapKey],
                        [filterFunc, arrParams] = args,
                        arrIdx = isPathNameType(basePath),
                        isH = type === GeneratedType.H,
                        path = arrIdx
                            ? slice(basePath, 0, arrIdx - 1)
                            : basePath;

                    isInit && storageInit();

                    switch (type) {
                        case GeneratedType.U:
                            if (isClient)
                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                return useStoreVal(storage, mapKey, filterFunc);

                        case GeneratedType.G:
                            return getGlobalData(storage, basePath, filterFunc);
                        default:
                            (args.length < 2 || arrIdx || isH) &&
                                updateStore(
                                    storage,
                                    path,
                                    type === GeneratedType.R
                                        ? initialValues
                                        : isH
                                        ? filterFunc.value
                                        : arrIdx
                                        ? generateArray(
                                              slice(basePath, arrIdx),
                                              getGlobalData(storage, path),
                                              arrParams,
                                              filterFunc,
                                          )
                                        : filterFunc,
                                    UpdateType.S,
                                    !isH,
                                );
                    }
                })
            );
        },
    })
);
