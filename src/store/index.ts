import { getGlobalData } from "./get-global";
import { updateStore, updateGlobalData } from "./global";
import { useStoreVal } from "./hooks/use-store-val.hook";
import { generateStaticPathsMap, patchToGlobalMap } from "./maps/maps";
import { getMapByKey } from "./maps/utils";
import { generateMutators } from "./mutators";
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

const generatedTypes = values(GeneratedType);

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

    const mutators = generateMutators(storeId, initialValues);
    const handler = {
        get(target: any, name: string) {
            if (name in target) {
                return target[name];
            }
            const [type, ...functionName] = name.split(/(?=[A-Z$])/);
            const mapKey = storeId.concat(pathToString(functionName));
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
                            if (args.length > 1) {
                                const sliceIdx = findPathArrayIndex(basePath);

                                if (sliceIdx >= 0 && basePath) {
                                    const additionalPaths = basePath.slice(
                                        sliceIdx + 1,
                                        basePath.length,
                                    );
                                    const arrRootPath = basePath.slice(
                                        0,
                                        sliceIdx,
                                    );
                                    const prev = getGlobalData(arrRootPath);
                                    const value = createNewArrayValues(
                                        additionalPaths,
                                        prev,
                                        arrValue,
                                        filterFunc,
                                    );
                                    updateStore(arrRootPath, value);
                                }
                                return;
                            }
                            return updateStore(basePath, filterFunc);
                        }
                    };
                case GeneratedType.RESET:
                    return () => {
                        const basePath = getMapByKey(mapKey);
                        updateStore(
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

    return new Proxy(mutators, handler);
}
