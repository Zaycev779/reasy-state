import { getGlobalData, globalStore } from './global';
import { useStoreVal } from './hook';
import { Entries, IGenerate, IStore, ValueOf } from './typing';
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
      [`set${prevKeyName}${keyName}`]: (
        val: Partial<ValueOf<T>> | ((prev: ValueOf<T>) => Partial<ValueOf<T>>)
      ) => _setStoreValue(path, val),
      [`use${prevKeyName}${keyName}`]: () => useStoreVal(path),
      [`get${prevKeyName}${keyName}`]: () => getGlobalData(path),
      ...(!!val &&
        typeof val === 'object' &&
        val instanceof Object &&
        generateFunc<IStore<T>>(val as IStore<T>, path)),
    };
  }, {} as IGenerate<T>);

  return result;
};

export function createState<T extends IStore<T>>(
  initialValues: T
): IGenerate<T> {
  const stores = Object.keys(initialValues);

  stores.forEach((store) => {
    if (!globalStore[store]) {
      globalStore[store] = (initialValues as Record<string, any>)?.[store];
    }
  });
  return generateFunc(initialValues) as IGenerate<T>;
}

export const _setStoreValue = <T,>(
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
