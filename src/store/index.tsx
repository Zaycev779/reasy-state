import { getGlobalData, globalStore } from './global';
import { useStoreVal } from './hook';
import { Entries, IGenerate, IStore, ValueOf } from './typing';
import { getUpdatedParams } from './utils';

export const SET_EV_NAME = '__SET_STORE_EVENT';
export const PUSH_EV_NAME = '__PUSH_STORE_EVENT';

const generateFunc = <T,>(values: T, prevKey: string[] = []) => {
  const entries = Object.entries(values as IStore) as Entries<T>;
  const result: IGenerate<T extends IStore ? IStore : never> = entries.reduce(
    (result, [key, val]) => {
      if (!key) return result;
      const keyName = key.charAt(0).toUpperCase() + key.slice(1);
      const prevKeyName = prevKey
        .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
        .join('');
      const path = [...prevKey, key];
      return {
        ...result,
        [`set${prevKeyName}${keyName}`]: (
          val: ValueOf<T> | ((prev: ValueOf<T>) => Partial<ValueOf<T>>)
        ) => _setStoreValue(path, val),
        [`use${prevKeyName}${keyName}`]: () => useStoreVal(path),
        ...(!!val &&
          typeof val === 'object' &&
          val instanceof Object &&
          generateFunc<ValueOf<T> & object>(val, path)),
      };
    },
    {} as IGenerate<T extends IStore ? IStore : never>
  );

  return result;
};

export const createState = <T extends IStore>(initialValues: T) => {
  const stores = Object.keys(initialValues);

  stores.forEach((store) => {
    if (!globalStore[store]) {
      globalStore[store] = initialValues?.[store];
    }
  });

  return generateFunc(initialValues) as IGenerate<T>;
};

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

export const _pushStoreValue = <T extends IStore>(
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

const countStore = {
  value: 0,
  date: new Date(),
  button: {
    test: {
      val: 1,
    },
  },
};
const {} = createState({
  countStore,
});
