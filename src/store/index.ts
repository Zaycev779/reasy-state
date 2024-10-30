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
    pathToString,
    split,
    slice,
    isClient,
    ArrayMapKey,
} from "./utils";
import { updateStore } from "./global/update";
import { EStorage } from "./global";

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
    id = options.key ? (options.key = E + options.key) : E + ++EStateId,
    storageValues = storageAction(StorageType.G, options, initialValues),
    isInit: any = options[GeneratedType.h],
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
                (...args: any) => {
                    const basePath = storage.m[mapKey],
                        [filterFunc, arrParams] = args,
                        arrIdx = basePath.indexOf(ArrayMapKey) + 1 || 0,
                        path = arrIdx
                            ? slice(basePath, 0, arrIdx - 1)
                            : basePath;

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
                                filterFunc,
                            );
                        default:
                            (args.length < 2 || arrIdx) &&
                                updateStore(
                                    storage,
                                    path,
                                    options,
                                    type === GeneratedType.R
                                        ? initialValues
                                        : arrIdx
                                        ? generateArray(
                                              slice(basePath, arrIdx),
                                              getGlobalData(storage.s, path),
                                              arrParams,
                                              filterFunc,
                                          )
                                        : filterFunc,
                                );
                    }
                })
            );
        },
    });
