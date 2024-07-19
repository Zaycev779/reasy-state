import { _setStoreValueEvent } from './events';
import {
  generateStaticPathsMap,
  getGlobalData,
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
  UpdateType,
} from './types/store';
import {
  capitalizeKeysToString,
  capitalizeName,
  createNewArrayValues,
  getParams,
  isAFunction,
  isObject,
} from './utils';

const generateFunc = <T extends IStore<T>>(
  values: T,
  prevKey: string[] = []
) => {
  const entries = Object.entries(values as IStore<T>) as Entries<T>;
  const result: IGenerate<T> = entries.reduce((result, [key, val]) => {
    if (!key) return result;
    const keyName = capitalizeName(key);
    const prevKeyName = capitalizeKeysToString(prevKey);
    const path = prevKey.concat(key);
    const mapKey = `${prevKeyName}${keyName}`;
    return Object.assign(
      result,
      keyName !== 'Mutators'
        ? !keyName.includes('_') &&
            Object.assign(
              {
                [GeneratedType.SET.concat(mapKey)]: (
                  val:
                    | Partial<ValueOf<T>>
                    | ((prev: ValueOf<T>) => Partial<ValueOf<T>>)
                ) => _setStoreValueEvent(path, val),
                [GeneratedType.USE.concat(mapKey)]: () =>
                  useStoreVal({ mapKey }),
                [GeneratedType.GET.concat(mapKey)]: () => getGlobalData(path),
              },
              isObject(val) && generateFunc<IStore<T>>(val as IStore<T>, path)
            )
        : createMutators(val as any, prevKey)
    );
  }, {} as IGenerate<T>);

  return result;
};

const createMutators = (values: Record<string, Function>, path: string[]) => {
  const pathName = path[0] + capitalizeKeysToString(path.slice(1));

  const entries = Object.entries(values);
  return entries.reduce((prev, [key, val]) => {
    const keyName = capitalizeName(key);
    const set = (arg: any, type: UpdateType = 'set') => {
      const params = getParams(arg, getGlobalData(path));
      _setStoreValueEvent(path, params, type);
      return getGlobalData(path);
    };

    const patch = (arg: any) => set(arg, 'patch');

    const get = () => getGlobalData(path);

    return Object.assign(prev, {
      [pathName.concat(keyName)]: (...args: any) => {
        const fn = val({ set, get, patch }, getGlobalData(path));
        if (isAFunction(fn)) {
          return fn(...args);
        }
        return fn;
      },
    });
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
      generateStaticPathsMap(globalStore[store], store);
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
      const splitName = capitalizeKeysToString(name.split(/[\s$]+/), true);

      if (target.hasOwnProperty(splitName) && isAFunction(target[splitName])) {
        return (...args: any[]) => target[splitName](...args);
      }

      const isGenerated = Object.values(GeneratedType).some((val) =>
        val.includes(type)
      );
      if (isGenerated && mapKey) {
        patchToGlobalMap(mapKey);
      }

      switch (type) {
        case GeneratedType.GET:
          return (filterFunc?: Function) =>
            getGlobalData(globalStoreMap[mapKey], true, filterFunc);

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
