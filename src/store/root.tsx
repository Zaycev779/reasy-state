import { ReactNode, useEffect } from 'react';
import { SET_EV_NAME, _pushStoreValue } from './index';
import { getGlobalData, updateGlobalData } from './global';
import { IStore } from './typing';

interface IProps {
  children: ReactNode;
}

export const StateRoot = ({ children }: IProps) => {
  const onTargetEvent = (ev: Event) => {
    const {
      detail: { path, params },
    } = ev as CustomEvent<{
      path: string[];
      params: Partial<IStore> | ((prev: IStore) => Partial<IStore>);
    }>;
    const prevValues = getGlobalData(path);
    const isFn = typeof params === 'function';
    const updatedParams = isFn ? params(prevValues) : params;
    updateGlobalData(path, updatedParams);
    _pushStoreValue(path, updatedParams, prevValues);
  };
  useEffect(() => {
    document.addEventListener(SET_EV_NAME, onTargetEvent);
    return () => {
      document.removeEventListener(SET_EV_NAME, onTargetEvent);
    };
  }, []);

  return <>{children}</>;
};
