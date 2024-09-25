import { _pushStoreValueEvent, _updatePathEvent, SET_EV_NAME } from './events';
import { IStore, UpdateType } from './types/store';
import {
  capitalizeName,
  diffValuesBoolean,
  entries,
  getAdditionalMapKeys,
  getParams,
  isNotMutator,
  isObject,
  mergeDeep,
} from './utils';

declare global {
  namespace EStorage {
    let store: Record<string, any>;
    let map: Record<string, string[]>;
    function get(): Record<string, any>;
    function getMap(): Record<string, string[]>;
    function getMapByKey(keyName: string): string[];
    function set(value: Record<string, any>): void;
    function setMap(value: Record<string, string[]>): void;
  }
}
export const isClient = window && typeof window !== 'undefined';

if (!('EStorage' in globalThis) && isClient) {
  globalThis.EStorage = {
    store: {},
    map: {},
    get: () => EStorage.store,
    getMap: () => EStorage.map,
    getMapByKey: (keyName: string) => EStorage.map[keyName],
    set: (value) => {
      EStorage.store = value;
    },
    setMap: (value) => {
      EStorage.map = value;
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
        const prevPath = EStorage.getMapByKey(mapKey);
        patchToGlobalMap(mapKey);
        if (diffValuesBoolean(prevPath, EStorage.getMapByKey(mapKey))) {
          _updatePathEvent(mapKey, EStorage.getMapByKey(mapKey));
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
  src: Record<string, any> = EStorage.get()
): boolean => {
  const [path, ...rest] = paths;
  if (!rest.length) {
    try {
      const cloneData = isObject(data) ? mergeDeep({}, data) : data;
      src[path] = cloneData;
    } catch {
      src[path] = data;
    }
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
  src = EStorage.get()
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
    EStorage.setMap({
      ...EStorage.getMap(),
      [pathName]: prevPath,
    });
    entries(data).forEach(([name, val]) => {
      const keyName = capitalizeName(name);
      if (isNotMutator(keyName) && !keyName.includes('_')) {
        EStorage.setMap({
          ...EStorage.getMap(),
          [pathName + keyName]: prevPath,
        });

        generateStaticPathsMap(val, pathName + keyName, prevPath.concat(name));
      }
    });
  }

  EStorage.setMap({
    ...EStorage.getMap(),
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
  const staticFromMap = staticPath || EStorage.getMap()?.[staticName];
  const baseRequiredData = getGlobalData(staticFromMap.concat(prevPath));

  if (Array.isArray(baseRequiredData)) {
    EStorage.setMap({
      ...EStorage.getMap(),
      [baseMap]: staticFromMap.concat(
        prevPath,
        '[]',
        firstKey,
        additionalKeys.length ? additionalKeys : []
      ),
    });
    return;
  }
  EStorage.setMap({
    ...EStorage.getMap(),
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
