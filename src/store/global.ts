import { IStore } from './types/store';
import { capitalizeName, isObject } from './utils';

export const globalStore: Record<string, any> = {};
export const globalStoreMap: Record<string, any> = {};

export const updateGlobalData = (
  paths: string[],
  data: Partial<IStore>,
  src = globalStore
): boolean => {
  const [path, ...rest] = paths;
  if (!rest.length) {
    src[path] = data;
    return true;
  }
  if (!src[path]) {
    src[path] = {};
  }
  return updateGlobalData(rest, data, src[path]);
};

export const getGlobalDataWithFunction = (
  path?: string[],
  filterFunc?: Function
) =>
  path?.reduce(
    ({ value, skip }, v, idx) => {
      if (skip) {
        return { value, skip };
      }
      if (v.includes('[]') || Array.isArray(value)) {
        const additionalPaths = path.slice(idx + 1, path.length);
        const filterValue = filterFunc ? value?.filter(filterFunc) : value;
        return {
          value: filterValue?.map((v: any) =>
            additionalPaths?.reduce((prev, key) => prev?.[key], v)
          ),
          skip: true,
        };
      }
      return { value: value?.[v] };
    },
    { value: globalStore } as { value?: Record<string, any>; skip?: boolean }
  ).value as Partial<IStore>;

export const getGlobalData = (path?: string[]) =>
  path?.reduce(
    ({ value, skip }, v) => {
      if (skip) {
        return { value, skip };
      }
      if (v.includes('[]') || Array.isArray(value)) {
        return {
          value,
          skip: true,
        };
      }
      return { value: value?.[v] };
    },
    { value: globalStore } as { value?: Record<string, any>; skip?: boolean }
  ).value as Partial<IStore>;

export const generateStaticPathsMap = (
  data: any,
  path: string,
  prevPath: string[]
): any => {
  const pathName = capitalizeName(path);
  if (isObject(data)) {
    globalStoreMap[pathName] = prevPath;
    const entries = Object.entries(data);
    entries.forEach(([name, val]) => {
      const keyName = capitalizeName(name);
      if (keyName !== 'Mutators' && !keyName.includes('_')) {
        globalStoreMap[pathName + keyName] = prevPath;
        generateStaticPathsMap(val, pathName + keyName, [...prevPath, name]);
      }
    });
  }
  globalStoreMap[pathName] = prevPath;

  return data;
};

export const patchToGlobalMap = (
  mapKey: string,
  baseMap: string = mapKey,
  staticPath?: string[],
  prevPath?: string[]
) => {
  if (!mapKey.includes('$')) return;
  const [staticName, firstKey, ...additionalKeys] =
    mapKey?.split(/[\s$]+/) ?? [];
  const staticFromMap = staticPath || globalStoreMap[staticName];
  const baseRequiredData = getGlobalData([
    ...staticFromMap,
    ...(prevPath || []),
  ]);

  if (Array.isArray(baseRequiredData)) {
    globalStoreMap[baseMap] = [
      ...staticFromMap,
      ...(prevPath || []),
      '[]',
      firstKey,
      ...(additionalKeys.length ? [...additionalKeys] : []),
    ];
    return;
  }
  globalStoreMap[baseMap] = [...staticFromMap, ...(prevPath || []), firstKey];
  if (additionalKeys.length) {
    patchToGlobalMap(
      `$${additionalKeys.join('$')}`,
      baseMap || mapKey,
      staticFromMap,
      [...(prevPath || []), firstKey]
    );
  }
};
