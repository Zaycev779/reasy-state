import { ReactElement, useEffect } from 'react';
import { SET_EV_NAME, _pushStoreValue } from './index';
import { getGlobalData, updateGlobalData } from './global';
import { IStore, UpdateType } from './types/store';
import { mergeDeep } from './utils';

interface IProps {
  children: ReactElement;
}

export const StateRoot = ({ children }: IProps): ReactElement => {
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
      type === 'patch' &&
        typeof updatedParams === 'object' &&
        typeof prevValues === 'object'
        ? mergeDeep({}, prevValues, updatedParams)
        : updatedParams
    );
    _pushStoreValue(path, updatedParams, prevValues);
  };
  useEffect(() => {
    document.addEventListener(SET_EV_NAME, onTargetEvent);
    return () => {
      document.removeEventListener(SET_EV_NAME, onTargetEvent);
    };
  }, []);

  return children;
};
