'use client';

import { useEffect, useState } from 'react';
import { PUSH_EV_NAME } from './index';
import { getGlobalData } from './global';

export const useStoreVal = (path: string[]) => {
  const [state, setState] = useState(() => getGlobalData(path));

  useEffect(() => {
    const onTargetEvent = (ev: Event) => {
      const {
        detail: { params },
      } = ev as CustomEvent<{
        params: IStore;
      }>;
      setState(params);
    };

    document.addEventListener(PUSH_EV_NAME + path.join(), onTargetEvent);
    return () => {
      document.removeEventListener(PUSH_EV_NAME + path.join(), onTargetEvent);
    };
  }, [path]);
  return state;
};
