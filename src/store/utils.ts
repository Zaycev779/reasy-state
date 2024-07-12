import { IStore } from './types/store';

export type updatedParams = string | updatedParams[];

export const getUpdatedParams = <T extends IStore>(
  updatedParams: T,
  prevValues: T
): updatedParams[] => {
  if (
    typeof updatedParams !== 'object' ||
    !updatedParams ||
    Array.isArray(updatedParams)
  )
    return [];
  const entries = Object.entries(updatedParams);
  return entries.reduce((prev, [key, val]) => {
    if (key === 'mutators') return prev;
    let childParam: updatedParams[] = [];
    if (typeof val === 'object' && val instanceof Object) {
      childParam = [getUpdatedParams(val as IStore, prevValues[key] as IStore)];
    }
    if (val !== prevValues[key]) {
      return [...prev, childParam.length ? [key, ...childParam] : [key]];
    }
    return prev;
  }, [] as updatedParams[]);
};

export const getUpdatePaths = (keys: updatedParams[], path: string[]) => {
  const updatePaths: string[][] = [];
  if (path) {
    updatePaths.push(path);
  }
  const flatten = (
    keys: updatedParams[],
    prevPaths: string[],
    basePath: string[]
  ) => {
    keys.forEach((val) => {
      if (Array.isArray(val)) {
        flatten(
          val,
          [
            ...prevPaths,
            ...(keys.filter((v) => typeof v === 'string') as string[]),
          ],
          basePath
        );
      } else {
        updatePaths.push([...(basePath || []), ...prevPaths, val]);
      }
    });
  };
  flatten(keys, [], path);
  return updatePaths;
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
