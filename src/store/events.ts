import { getGlobalData } from './global';
import { IStore, UpdateType } from './types/store';
import { getAdditionalPaths, getUpdatePaths, getUpdatedParams } from './utils';

export const SET_EV_NAME = '__SET_STORE_EVENT';
export const PUSH_EV_NAME = '__PUSH_STORE_EVENT';
export const PATH_MAP_EV_NAME = '__PATH_MAP_STORE_EVENT';

export const _setStoreValueEvent = <T>(
  path: string[],
  params?: Partial<T> | ((prev: T) => Partial<T>),
  type: UpdateType = 'set'
) => {
  const ev = new CustomEvent(SET_EV_NAME, {
    detail: {
      path,
      params,
      type,
    },
  });
  document.dispatchEvent(ev);
};

export const _updatePathEvent = (pathMap: string, path: string[]) => {
  const ev = new CustomEvent(PATH_MAP_EV_NAME + pathMap, {
    detail: {
      path,
    },
  });
  document.dispatchEvent(ev);
};

export const _pushStoreValueEvent = <T extends IStore<T>>(
  paths: string[],
  updatedParams: T,
  prevValues: T
) => {
  const getUpdatedKeys = getUpdatedParams(updatedParams, prevValues, paths);
  const updatePaths = getUpdatePaths(getUpdatedKeys, paths);
  const additionalPaths = getAdditionalPaths(paths);
  updatePaths.push(...additionalPaths);

  updatePaths.forEach((pathVal) => {
    const params = getGlobalData(pathVal);
    const ev = new CustomEvent(PUSH_EV_NAME + pathVal.join(), {
      detail: {
        params,
      },
    });
    document.dispatchEvent(ev);
  });
};
