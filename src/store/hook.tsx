import { useEffect, useState } from 'react';
import { getGlobalData, globalStoreMap } from './global';
import { IStore } from './types/store';
import { diffValues, isAFunction, isObject } from './utils';
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from './events';

interface IProps {
  mapKey: string;
  filterFunc?: any;
}

export const useStoreVal = ({ filterFunc, mapKey }: IProps) => {
  const [path, setPath] = useState<string[]>(globalStoreMap[mapKey]);
  const getState = () => getGlobalData(path, true, filterFunc);
  const [state, setState] = useState(getState());
  useEvent<{
    params: IStore;
  }>({
    type: path ? PUSH_EV_NAME + path.join() : undefined,
    onChange({ params }) {
      const arrrIdx = path?.findIndex((val) => val === '[]') ?? -1;
      if (arrrIdx >= 0 && path) {
        if (!Array.isArray(params)) return setState(params);
        const additionalPaths = path.slice(arrrIdx + 1, path.length);
        const filteredValue = isAFunction(filterFunc)
          ? params.filter(filterFunc)
          : params;
        const vals = additionalPaths.reduce(
          (prev, key) => prev.map((val) => val[key]),
          filteredValue
        );

        setState((prev) => diffValues(prev, vals));
        return;
      }
      setState(isObject(params) ? Object.assign({}, params) : params);
    },
    onStartEvent() {
      setState(getState());
    },
  });

  useEvent<{
    path: string[];
  }>({
    type: mapKey ? PATH_MAP_EV_NAME + mapKey : undefined,
    onChange({ path }) {
      if (path) {
        setPath(path);
        setState(getState());
      }
    },
  });

  return state;
};

interface IUseEvent<T> {
  type?: string;
  onStartEvent?: () => void;
  onChange: (values: T) => void;
}

export const useEvent = <T,>({ type, onStartEvent, onChange }: IUseEvent<T>) =>
  useEffect(() => {
    const onTargetEvent = (ev: Event) => {
      const { detail } = ev as CustomEvent<T>;
      onChange(detail);
    };

    if (type) {
      if (onStartEvent) {
        onStartEvent();
      }
      document.addEventListener(type, onTargetEvent);
    }
    return () => {
      if (type) {
        document.removeEventListener(type, onTargetEvent);
      }
    };
  }, [type]);
