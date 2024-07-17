import { useEffect } from 'react';
import {
  getGlobalData,
  globalStoreMap,
  patchToGlobalMap,
  updateGlobalData,
} from './global';
import { IStore, UpdateType } from './types/store';
import {
  diffValuesBoolean,
  getAdditionalMapKeys,
  isObject,
  mergeDeep,
} from './utils';
import { SET_EV_NAME, _pushStoreValueEvent, _updatePathEvent } from './events';

interface IProps<T> {
  children: T;
}

export const StateRoot = <T,>({ children }: IProps<T>): T => {
  const onTargetEvent = (ev: Event) => {
    const {
      detail: { path, params, type },
    } = ev as CustomEvent<{
      path: string[];
      params: Partial<IStore> | ((prev: IStore) => Partial<IStore>);
      type: UpdateType;
    }>;
    const prevValues = getGlobalData(path);
    const isFn = typeof params === 'function';
    const updatedParams = isFn ? params(prevValues) : params;
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
  useEffect(() => {
    document.addEventListener(SET_EV_NAME, onTargetEvent);
    return () => {
      document.removeEventListener(SET_EV_NAME, onTargetEvent);
    };
  }, []);

  return children;
};
