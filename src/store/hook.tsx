'use client';

import { useEffect, useState } from 'react';
import { PUSH_EV_NAME, globalStore } from '.';

export const useStoreVal = (stroreName: string) => {
  const [state, setState] = useState(globalStore[stroreName]);

  useEffect(() => {
    const onTargetEvent = (ev: Event) => {
      const {
        detail: { params },
      } = ev as CustomEvent<{
        params: any;
      }>;
      setState(params);
    };

    document.addEventListener(PUSH_EV_NAME + stroreName, onTargetEvent);
    return () => {
      document.removeEventListener(PUSH_EV_NAME + stroreName, onTargetEvent);
    };
  }, [stroreName]);
  return state;
};
