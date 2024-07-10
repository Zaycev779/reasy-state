import { getGlobalData, globalStore } from './global';
import { useStoreVal } from './hook';
import { CreateFunction, Entries, IGenerate, IStore, ValueOf } from './typing';
import { getUpdatedParams } from './utils';

export const SET_EV_NAME = '__SET_STORE_EVENT';
export const PUSH_EV_NAME = '__PUSH_STORE_EVENT';

const generateFunc = <T extends IStore<T>>(
  values: T,
  prevKey: string[] = []
) => {
  const entries = Object.entries(values as IStore<T>) as Entries<T>;
  const result: IGenerate<T> = entries.reduce((result, [key, val]) => {
    if (!key) return result;
    const keyName = key.charAt(0).toUpperCase() + key.slice(1);
    const prevKeyName = prevKey
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join('');
    const path = [...prevKey, key];
    return {
      ...result,
      ...(keyName !== 'Mutators' && {
        [`set${prevKeyName}${keyName}`]: (
          val: Partial<ValueOf<T>> | ((prev: ValueOf<T>) => Partial<ValueOf<T>>)
        ) => _setStoreValue(path, val),
        [`use${prevKeyName}${keyName}`]: () => useStoreVal(path),
        [`get${prevKeyName}${keyName}`]: () => getGlobalData(path),
        ...(!!val &&
          typeof val === 'object' &&
          val instanceof Object &&
          generateFunc<IStore<T>>(val as IStore<T>, path)),
      }),
      ...(keyName === 'Mutators' && createMutators(val as any, prevKey)),
    };
  }, {} as IGenerate<T>);

  return result;
};

const createMutators = (values: Record<string, Function>, path: string[]) => {
  const pathName =
    path[0] +
    path
      .slice(1)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join('');
  const entries = Object.entries(values);
  return entries.reduce((prev, [key, val]) => {
    const keyName = key.charAt(0).toUpperCase() + key.slice(1);
    const set = (arg: any) => {
      typeof arg === 'function'
        ? _setStoreValue(path, arg(getGlobalData(path)))
        : _setStoreValue(path, arg);
      return getGlobalData(path);
    };

    const get = () => getGlobalData(path);

    return {
      ...prev,
      [`${pathName}${keyName}`]: (...args: any) => {
        const fn = val({ set, get }, getGlobalData(path));
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
      createStateFn(param)) as unknown as IGenerate<T>;
  }
  return createStateFn(param);
};

export function createStateFn<T extends IStore<T>>(values: T): IGenerate<T> {
  const stores = Object.keys(values);

  stores.forEach((store) => {
    if (!globalStore[store]) {
      globalStore[store] = (values as Record<string, any>)?.[store];
    }
  });
  return generateFunc(values);
}

export const _setStoreValue = <T>(
  path: string[],
  params: Partial<T> | ((prev: T) => Partial<T>)
) => {
  const ev = new CustomEvent(SET_EV_NAME, {
    detail: {
      path,
      params,
    },
  });
  document.dispatchEvent(ev);
};

export const _pushStoreValue = <T extends IStore<T>>(
  paths: string[],
  updatedParams: T,
  prevValues: T
) => {
  const updatedPath = [
    ...paths,
    ...getUpdatedParams(updatedParams, prevValues),
  ];

  updatedPath.reduce((prev, path) => {
    const pathVal = [...prev, path];
    const params = getGlobalData(pathVal);
    const ev = new CustomEvent(PUSH_EV_NAME + pathVal.join(), {
      detail: {
        params,
      },
    });
    document.dispatchEvent(ev);

    return pathVal;
  }, [] as string[]);
};
