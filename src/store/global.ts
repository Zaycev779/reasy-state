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
  getGlobalStore: () => Record<string, any>;
  getGlobalStoreMap: () => Record<string, string[]>;
  getGlobalStoreMapByKey: (keyName: string) => string[];
  setGlobalStore: (value: Record<string, any>) => void;
  setGlobalStoreMap: (value: Record<string, string[]>) => void;
}

export const isClient = window && typeof window !== 'undefined';

if (isClient && !window?.easyStorage) {
  window.easyStorage = {
    globalStore: {},
    getGlobalStore: () => window.easyStorage.globalStore,
    globalStoreMap: {},
    getGlobalStoreMap: () => window.easyStorage.globalStore,
    getGlobalStoreMapByKey: (keyName: string) =>
      window.easyStorage.globalStore[keyName],
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
        const prevPath = window.easyStorage.getGlobalStoreMapByKey(mapKey);
        patchToGlobalMap(mapKey);
        if (
          diffValuesBoolean(
            prevPath,
            window.easyStorage.getGlobalStoreMapByKey(mapKey)
          )
        ) {
          _updatePathEvent(
            mapKey,
            window.easyStorage.getGlobalStoreMapByKey(mapKey)
          );
        }
      });
      _pushStoreValueEvent(path, updatedParams, prevValues);
    };

    document.addEventListener(SET_EV_NAME, onTargetEvent);
  });
}

export const updateGlobalData = (
  paths: string[],
  data: Partial<IStore>,
  src: Record<string, any> = window?.easyStorage.getGlobalStore()
): boolean => {
  const [path, ...rest] = paths;
  if (!rest.length) {
    const cloneData = JSON.parse(JSON.stringify(data));
    src[path] = cloneData;

    return true;
  }
  if (!src[path]) {
    src[path] = {};
  }
  return updateGlobalData(rest, data, src[path]);
};

export const getGlobalData = (
  path?: string[],
  forArray?: boolean,
  filterFunc?: Function,
  src = window?.easyStorage.getGlobalStore()
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
    window.easyStorage.setGlobalStoreMap({
      ...window.easyStorage.getGlobalStoreMap(),
      [pathName]: prevPath,
    });
    const entries = Object.entries(data);
    entries.forEach(([name, val]) => {
      const keyName = capitalizeName(name);
      if (keyName !== 'Mutators' && !keyName.includes('_')) {
        window.easyStorage.setGlobalStoreMap({
          ...window.easyStorage.getGlobalStoreMap(),
          [pathName + keyName]: prevPath,
        });

        generateStaticPathsMap(val, pathName + keyName, prevPath.concat(name));
      }
    });
  }

  window.easyStorage.setGlobalStoreMap({
    ...window.easyStorage.getGlobalStoreMap(),
    [pathName]: prevPath,
  });
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
  const staticFromMap =
    staticPath || window.easyStorage.getGlobalStoreMap()?.[staticName];
  const baseRequiredData = getGlobalData(staticFromMap.concat(prevPath));

  if (Array.isArray(baseRequiredData)) {
    window.easyStorage.setGlobalStoreMap({
      ...window.easyStorage.getGlobalStoreMap(),
      [baseMap]: staticFromMap.concat(
        prevPath,
        '[]',
        firstKey,
        additionalKeys.length ? additionalKeys : []
      ),
    });
    return;
  }
  window.easyStorage.setGlobalStoreMap({
    ...window.easyStorage.getGlobalStoreMap(),
    [baseMap]: staticFromMap.concat(prevPath, firstKey),
  });

  if (additionalKeys.length) {
    patchToGlobalMap(
      '$'.concat(additionalKeys.join('$')),
      baseMap || mapKey,
      staticFromMap,
      prevPath.concat(firstKey)
    );
  }
};
