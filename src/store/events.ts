import { getGlobalData } from './global';
import { IStore, UpdateType } from './types/store';
import { getAdditionalPaths, getRootPaths, getUpdatedPaths } from './utils';

export const SET_EV_NAME = '__SET_STORE_EVENT';
export const PUSH_EV_NAME = '__PUSH_STORE_EVENT';
export const PATH_MAP_EV_NAME = '__PATH_MAP_STORE_EVENT';

export const _setStoreValueEvent = <T>(
  path: string[],
  params?: Partial<T> | ((prev: T) => Partial<T>),
  type: UpdateType = 'set'
) =>
  sendEvent(SET_EV_NAME, {
    path,
    params,
    type,
  });

export const _updatePathEvent = (pathMap: string, path: string[]) =>
  sendEvent(PATH_MAP_EV_NAME + pathMap, { path });

export const _pushStoreValueEvent = <T extends IStore<T>>(
  paths: string[],
  updatedParams: T,
  prevValues: T
) => {
  const updatePaths = getUpdatedPaths(updatedParams, prevValues, paths);
  const additionalPaths = getAdditionalPaths(paths);
  updatePaths.push(...additionalPaths);
  if (updatePaths.length) {
    const rest = [...paths];
    rest.splice(-1);
    updatePaths.push(...getRootPaths(rest));
  }
  updatePaths.forEach((pathVal) => {
    const params = getGlobalData(pathVal);
    sendEvent(PUSH_EV_NAME + pathVal.join(), { params });
  });
};

const sendEvent = (route: string, detail: any) => {
  const ev = new CustomEvent(route, {
    detail,
  });
  document.dispatchEvent(ev);
};
