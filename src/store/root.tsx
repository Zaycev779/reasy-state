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
  getParams,
  isObject,
  mergeDeep,
} from './utils';
import { SET_EV_NAME, _pushStoreValueEvent, _updatePathEvent } from './events';
import { useEvent } from './hook';

interface IProps<T> {
  children: T;
}

export const StateRoot = <T,>({ children }: IProps<T>): T => {
  useEvent<{
    path: string[];
    params: Partial<IStore> | ((prev: IStore) => Partial<IStore>);
    type: UpdateType;
  }>({
    type: SET_EV_NAME,
    onChange({ path, type, params }) {
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
    },
  });
  return children;
};
