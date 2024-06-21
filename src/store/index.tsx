'use client';

import React, { ReactNode, useEffect } from 'react';
import { useStoreVal } from './hook';

export const SET_EV_NAME = '__SET_STORE_EVENT';
export const PUSH_EV_NAME = '__PUSH_STORE_EVENT';

export const globalStore: Record<string, any> = {};
type IRecord = string | number | boolean | null | undefined;
type IStore = IRecord | Record<string, IRecord | Record<string, IRecord>>;

export interface IStateRootProps {
  children: ReactNode;
}

export const StateRoot = ({ children }: IStateRootProps) => {
  const onTargetEvent = (ev: Event) => {
    const {
      detail: { stroreName, params },
    } = ev as CustomEvent<{
      stroreName: string;
      params: Partial<IStore> | ((prev: IStore) => Partial<IStore>);
    }>;
    if (typeof params === 'function') {
      globalStore[stroreName] = params(globalStore[stroreName]);
    } else {
      globalStore[stroreName] = params;
    }
    _pushStoreValue(stroreName, globalStore[stroreName]);
  };
  useEffect(() => {
    document.addEventListener(SET_EV_NAME, onTargetEvent);
    return () => {
      document.removeEventListener(SET_EV_NAME, onTargetEvent);
    };
  }, []);

  return <>{children}</>;
};

export const createState = <T extends Record<string, IStore>>(
  initialValues: T
) => {
  const stores = Object.keys(initialValues);

  stores.forEach((store) => {
    if (!globalStore[store]) {
      globalStore[store] = initialValues?.[store];
    }
  });
  const functions = () => {
    return stores.reduce(
      (result, key) => ({
        ...result,
        [`set${key.charAt(0).toUpperCase() + key.slice(1)}`]: (
          val: T[keyof T] | ((prev: T[keyof T]) => Partial<T[keyof T]>)
        ) => _setStoreValue(key, val),
        [`use${key.charAt(0).toUpperCase() + key.slice(1)}`]: () =>
          useStoreVal(key),
      }),
      {} as {
        [P in keyof T as `set${Capitalize<P & string>}`]: (
          value: T[P] | ((prev: T[P]) => T[P])
        ) => void;
      } & {
        [P in keyof T as `use${Capitalize<P & string>}`]: () => T[keyof T];
      }
    );
  };

  return functions();
};

export const _setStoreValue = <T,>(
  stroreName: string,
  params: Partial<T> | ((prev: T) => Partial<T>)
) => {
  const ev = new CustomEvent(SET_EV_NAME, {
    detail: {
      stroreName,
      params,
    },
  });
  document.dispatchEvent(ev);
};

export const _pushStoreValue = <T,>(stroreName: string, params: T) => {
  const ev = new CustomEvent(PUSH_EV_NAME + stroreName, {
    detail: {
      params,
    },
  });
  document.dispatchEvent(ev);
};

// module.exports = {
//   StateRoot,
//   createState,
// };
