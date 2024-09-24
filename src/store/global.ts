import { _pushStoreValueEvent, _updatePathEvent, SET_EV_NAME } from './events';
import { IStore, UpdateType } from './types/store';
import {
  capitalizeName,
  diffValuesBoolean,
  getAdditionalMapKeys,
  getParams,
  isObject,
  mergeDeep,
} from './utils';

declare global {
  interface Window {
    easyStorage: EasyStorage;
  }
}

declare interface EasyStorage {
  globalStore: Record<string, any>;
  globalStoreMap: Record<string, string[]>;
  setGlobalStore: (value: Record<string, any>) => void;
  setGlobalStoreMap: (value: Record<string, string[]>) => void;
}

export const isClient = window && typeof window !== 'undefined';

if (isClient && !window?.easyStorage) {
  window.easyStorage = {
    globalStore: {},
    globalStoreMap: {},
    setGlobalStore: (value) => {
      window.easyStorage.globalStore = value;
    },
    setGlobalStoreMap: (value) => {
      window.easyStorage.globalStore = value;
    },
  };
  window.addEventListener('DOMContentLoaded', () => {
    const onTargetEvent = (ev: Event) => {
      const { detail } = ev as CustomEvent<{
        path: string[];
        params: Partial<IStore> | ((prev: IStore) => Partial<IStore>);
        type: UpdateType;
      }>;
      const { params, path, type } = detail;
      const prevValues = getGlobalData(path);

      const updatedParams = getParams(params, prevValues);
      updateGlobalData(
        path,
        type === 'patch' && isObject(updatedParams) && isObject(prevValues)
          ? mergeDeep({}, prevValues, updatedParams)
          : updatedParams
      );

      const updatePathMaps = getAdditionalMapKeys(path);

      updatePathMaps.forEach((mapKey) => {
        const prevPath = globalStoreMap[mapKey];
        patchToGlobalMap(mapKey);
        if (diffValuesBoolean(prevPath, globalStoreMap[mapKey])) {
          _updatePathEvent(mapKey, globalStoreMap[mapKey]);
        }
      });
      _pushStoreValueEvent(path, updatedParams, prevValues);
    };

    document.addEventListener(SET_EV_NAME, onTargetEvent);
  });
}

export const globalStore: Record<string, any> = isClient
  ? window?.easyStorage?.globalStore ?? {}
  : {};
export const globalStoreMap: Record<string, string[]> = isClient
  ? window?.easyStorage?.globalStoreMap ?? {}
  : {};

export const updateGlobalData = (
  paths: string[],
  data: Partial<IStore>,
  src = globalStore
): boolean => {
  const [path, ...rest] = paths;
  if (!rest.length) {
    src[path] = data;

    window.easyStorage.setGlobalStore(globalStore);
    return true;
  }
  if (!src[path]) {
    src[path] = {};
    window.easyStorage.setGlobalStore(globalStore);
  }
  return updateGlobalData(rest, data, src[path]);
};

export const getGlobalData = (
  path?: string[],
  forArray?: boolean,
  filterFunc?: Function,
  src = globalStore
) =>
  path?.reduce(
    ({ value, skip }, v, idx) => {
      if (skip) {
        return { value, skip };
      }
      if (v.includes('[]') || Array.isArray(value)) {
        if (forArray) {
          const additionalPaths = path.slice(idx + 1, path.length);
          const filterValue = filterFunc ? value?.filter(filterFunc) : value;
          return {
            value: filterValue?.map((v: any) =>
              additionalPaths?.reduce((prev, key) => prev?.[key], v)
            ),
            skip: true,
          };
        }
        return {
          value,
          skip: true,
        };
      }
      return { value: value?.[v] };
    },
    { value: src } as { value?: Record<string, any>; skip?: boolean }
  ).value as Partial<IStore>;

export const generateStaticPathsMap = (
  data: any,
  path: string,
  prevPath: string[] = [path]
): any => {
  const pathName = capitalizeName(path);
  if (isObject(data)) {
    globalStoreMap[pathName] = prevPath;
    const entries = Object.entries(data);
    entries.forEach(([name, val]) => {
      const keyName = capitalizeName(name);
      if (keyName !== 'Mutators' && !keyName.includes('_')) {
        globalStoreMap[pathName + keyName] = prevPath;
        generateStaticPathsMap(val, pathName + keyName, prevPath.concat(name));
      }
    });
  }
  globalStoreMap[pathName] = prevPath;
  window.easyStorage.setGlobalStoreMap(globalStoreMap);

  return data;
};

export const patchToGlobalMap = (
  mapKey: string,
  baseMap: string = mapKey,
  staticPath?: string[],
  prevPath: string[] = []
) => {
  if (!mapKey.includes('$')) return;
  const [staticName, firstKey, ...additionalKeys] =
    mapKey?.split(/[\s$]+/) ?? [];
  const staticFromMap = staticPath || globalStoreMap[staticName];
  const baseRequiredData = getGlobalData(staticFromMap.concat(prevPath));

  if (Array.isArray(baseRequiredData)) {
    globalStoreMap[baseMap] = staticFromMap.concat(
      prevPath,
      '[]',
      firstKey,
      additionalKeys.length ? additionalKeys : []
    );
    return;
  }
  globalStoreMap[baseMap] = staticFromMap.concat(prevPath, firstKey);

  if (additionalKeys.length) {
    patchToGlobalMap(
      '$'.concat(additionalKeys.join('$')),
      baseMap || mapKey,
      staticFromMap,
      prevPath.concat(firstKey)
    );
  }
};
