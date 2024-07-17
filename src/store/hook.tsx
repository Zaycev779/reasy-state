import { useEffect, useState } from 'react';
import { getGlobalDataWithFunction, globalStoreMap } from './global';
import { IStore } from './types/store';
import { diffValues, isObject } from './utils';
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from './events';

interface IProps {
  mapKey: string;
  filterFunc?: any;
}

export const useStoreVal = ({ filterFunc, mapKey }: IProps) => {
  const [path, setPath] = useState<string[]>(globalStoreMap[mapKey]);
  const [state, setState] = useState(
    getGlobalDataWithFunction(path, filterFunc)
  );

  useEffect(() => {
    const onTargetEvent = (ev: Event) => {
      const {
        detail: { params },
      } = ev as CustomEvent<{
        params: IStore;
      }>;

      const arrrIdx = path?.findIndex((val) => val === '[]') ?? -1;
      if (arrrIdx >= 0 && path) {
        if (!Array.isArray(params)) return setState(params);
        const additionalPaths = path.slice(arrrIdx + 1, path.length);
        const filteredValue =
          typeof filterFunc === 'function'
            ? params?.filter(filterFunc)
            : params;
        const vals = additionalPaths.reduce(
          (prev, key) => prev.map((val) => val[key]),
          filteredValue
        ) as any;

        setState((prev) => diffValues(prev, vals));
        return;
      }

      setState(isObject(params) ? { ...params } : params);
    };
    if (path) {
      setState(getGlobalDataWithFunction(path, filterFunc));
      document.addEventListener(PUSH_EV_NAME + path.join(), onTargetEvent);
    }
    return () => {
      if (path) {
        document.removeEventListener(PUSH_EV_NAME + path.join(), onTargetEvent);
      }
    };
  }, [path]);

  useEffect(() => {
    const onTargetEvent = (ev: Event) => {
      const {
        detail: { path },
      } = ev as CustomEvent<{
        path: string[];
      }>;
      if (path) {
        setPath(path);
        setState(getGlobalDataWithFunction(path, filterFunc));
      }
    };
    if (mapKey) {
      document.addEventListener(PATH_MAP_EV_NAME + mapKey, onTargetEvent);
    }
    return () => {
      if (mapKey) {
        document.removeEventListener(PATH_MAP_EV_NAME + mapKey, onTargetEvent);
      }
    };
  }, [mapKey]);

  return state;
};
