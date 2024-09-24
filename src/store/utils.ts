import { IStore } from './types/store';

export type updatedParams = string | updatedParams[];

export const getRootPaths = (paths: string[]) =>
  paths.reduce(
    (prev, val, idx) => prev.concat([(prev?.[idx - 1] || []).concat(val)]),
    [] as string[][]
  );

export const getUpdatedPaths = <T extends IStore>(
  updatedParams: T,
  prevValues: T,
  paths: string[],
  res: string[][] = []
) => {
  if (isObject(updatedParams)) {
    for (const key in Object.assign({}, prevValues || {}, updatedParams)) {
      const propName = paths ? [...paths, key] : [key];
      if (key === 'mutators') continue;
      if (isObject(updatedParams[key])) {
        const updated = Object.assign({}, updatedParams[key] as IStore);
        const prev = Object.assign({}, (prevValues[key] as IStore) || {});
        if (updated !== prev) {
          res.push(propName);
        }
        getUpdatedPaths(updated, prev, propName, res);
      } else {
        if (prevValues[key] !== updatedParams[key]) {
          res.push(propName);
        }
      }
    }
    return [paths, ...res];
  }
  if (prevValues !== updatedParams) {
    return [paths];
  }
  return [];
};

export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: any, ...sources: any): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const getAdditionalPaths = (paths: string[]) => {
  const storeMap = Object.values(
    window.easyStorage.getGlobalStoreMap()
  ) as string[][];
  return paths
    .reduce((prev, path, idx) => {
      const curVal = prev.filter(
        (curVal) => curVal?.[idx] === path && curVal.length > paths.length
      );
      return curVal;
    }, storeMap)
    .filter((v) => v.includes('[]'));
};

export const createNewArrayValues = (
  keys: string[],
  prev: any,
  newValue: any,
  filterFunc?: Function
) => {
  const l = keys.length - 1;
  if (Array.isArray(prev) && l >= 0) {
    return prev.map((prevVal) => {
      if (isAFunction(filterFunc) && !filterFunc?.(prevVal)) {
        return prevVal;
      }
      const e = keys[l],
        targetObj = keys.reduce((prev, key, idx) => {
          return idx === l ? prev : prev[key];
        }, prevVal);

      if (targetObj) {
        targetObj[e] = getParams(newValue, targetObj[e]);
      }
      return Object.assign({}, prevVal);
    });
  }
  return prev;
};

export const getAdditionalMapKeys = (paths: string[]) => {
  const storeMap = Object.keys(
      window.easyStorage.getGlobalStoreMap()
    ) as string[],
    l = paths.length;

  return paths
    .reduce((prevName, path, idx) => {
      const curVal = prevName.filter((val) => {
        const pathMap = window.easyStorage.getGlobalStoreMapByKey(val);
        return pathMap[idx] === path && pathMap.length > l;
      });
      return curVal;
    }, storeMap)
    .filter((val) => val.includes('$'));
};

export const isAFunction = (value: any) => typeof value === 'function';
export const getParams = (params: any, prev: any) =>
  isAFunction(params) ? params(prev) : params;

export const diffValues = (prevObject: any, newObject: any) =>
  diffValuesBoolean(prevObject, newObject) ? newObject : prevObject;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
  JSON.stringify(prevObject) !== JSON.stringify(newObject);

export const capitalizeName = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1);

export const capitalizeKeysToString = (arr: string[], ignoreFirst?: boolean) =>
  arr.map((k, i) => (!i && ignoreFirst ? k : capitalizeName(k))).join('');
