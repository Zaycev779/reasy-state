import { _setStoreValueEvent } from './events';
import {
  generateStaticPathsMap,
  getGlobalData,
  getGlobalDataWithFunction,
  globalStore,
  globalStoreMap,
  patchToGlobalMap,
  updateGlobalData,
} from './global';
import { useStoreVal } from './hook';
import { Entries, ValueOf } from './types/index';
import {
  CreateFunction,
  GeneratedType,
  IGenerate,
  IStore,
} from './types/store';
import { capitalizeName, createNewArrayValues, isObject } from './utils';

const generateFunc = <T extends IStore<T>>(
  values: T,
  prevKey: string[] = []
) => {
  const entries = Object.entries(values as IStore<T>) as Entries<T>;
  const result: IGenerate<T> = entries.reduce((result, [key, val]) => {
    if (!key) return result;
    const keyName = capitalizeName(key);
    const prevKeyName = prevKey.map((k) => capitalizeName(k)).join('');
    const path = [...prevKey, key];
    const mapKey = `${prevKeyName}${keyName}`;
    return {
      ...result,
      ...(keyName !== 'Mutators'
        ? !keyName.includes('_') && {
            [`${GeneratedType.SET}${mapKey}`]: (
              val:
                | Partial<ValueOf<T>>
                | ((prev: ValueOf<T>) => Partial<ValueOf<T>>)
            ) => _setStoreValueEvent(path, val),
            [`${GeneratedType.USE}${mapKey}`]: () => useStoreVal({ mapKey }),
            [`${GeneratedType.GET}${mapKey}`]: () => getGlobalData(path),
            ...(!!val &&
              isObject(val) &&
              generateFunc<IStore<T>>(val as IStore<T>, path)),
          }
        : createMutators(val as any, prevKey)),
    };
  }, {} as IGenerate<T>);

  return result;
};

const createMutators = (values: Record<string, Function>, path: string[]) => {
  const pathName =
    path[0] +
    path
      .slice(1)
      .map((k) => capitalizeName(k))
      .join('');
  const entries = Object.entries(values);
  return entries.reduce((prev, [key, val]) => {
    const keyName = capitalizeName(key);
    const set = (arg: any) => {
      typeof arg === 'function'
        ? _setStoreValueEvent(path, arg(getGlobalData(path)))
        : _setStoreValueEvent(path, arg);
      return getGlobalData(path);
    };

    const patch = (arg: any) => {
      typeof arg === 'function'
        ? _setStoreValueEvent(path, arg(getGlobalData(path)), 'patch')
        : _setStoreValueEvent(path, arg, 'patch');
      return getGlobalData(path);
    };

    const get = () => getGlobalData(path);

    return {
      ...prev,
      [`${pathName}${keyName}`]: (...args: any) => {
        const fn = val({ set, get, patch }, getGlobalData(path));
        if (typeof fn === 'function') {
          return fn(...args);
        }
        return fn;
      },
    };
  }, {});
};

export const createState: CreateFunction = <T extends IStore<T>>(param?: T) => {
  if (!param) {
    return (<U extends IStore<U>>(param: U) =>
      createStateFn(param)) as unknown as T;
  }
  return createStateFn(param);
};

export function createStateFn<T extends IStore<T>>(values: T): IGenerate<T> {
  const stores = Object.keys(values);

  stores.forEach((store) => {
    if (!globalStore[store]) {
      updateGlobalData([store], (values as Record<string, any>)?.[store]);
      const prevKeyName = [store].map((k) => capitalizeName(k)).join('');
      globalStoreMap[prevKeyName] = [store];
      generateStaticPathsMap(globalStore[store], prevKeyName, [store]);
    }
  });
  const gen = generateFunc(values);
  const handler = {
    get: function (target: any, name: string) {
      if (target.hasOwnProperty(name)) {
        return target[name];
      }
      const [type, ...functionName] = name.split(/(?=[A-Z])/);
      const mapKey = functionName.join('');
      const splitName = name
        .split(/[\s$]+/)
        .map((val, idx) => (idx ? capitalizeName(val) : val))
        .join('');

      if (target.hasOwnProperty(splitName)) {
        if (typeof target[splitName] === 'function') {
          return (...args: any[]) => target[splitName](...args);
        }
      }
      const isGenerated = Object.values(GeneratedType).some((val) =>
        val.includes(type)
      );
      if (isGenerated) {
        if (mapKey) {
          patchToGlobalMap(mapKey);
        }
      }

      switch (type) {
        case GeneratedType.GET:
          return (filterFunc?: Function) =>
            getGlobalDataWithFunction(globalStoreMap[mapKey], filterFunc);

        case GeneratedType.USE:
          return (filterFunc?: Function) =>
            useStoreVal({
              mapKey,
              filterFunc,
            });

        case GeneratedType.SET:
          return (...args: [Function] | [Function, any]) => {
            const [filterFunc, arrValue] = args;
            const basePath = globalStoreMap[mapKey] as string[];
            if (basePath) {
              if (args.length > 1) {
                const arrrIdx =
                  basePath?.findIndex((val) => val === '[]') ?? -1;
                if (arrrIdx >= 0 && basePath) {
                  const additionalPaths = basePath.slice(
                    arrrIdx + 1,
                    basePath.length
                  );
                  const arrRootPath = basePath.slice(0, arrrIdx);
                  const prev = getGlobalData(arrRootPath);
                  const value = createNewArrayValues(
                    additionalPaths,
                    prev,
                    arrValue,
                    filterFunc
                  );
                  _setStoreValueEvent(arrRootPath, value);
                  return;
                }
                return;
              }
              return _setStoreValueEvent(basePath, filterFunc);
            }
          };

        default:
          return () => undefined;
      }
    },
  };

  return new Proxy(gen, handler);
}
