import { useEffect } from 'react';

interface IUseEvent<T> {
  type?: string;
  onStartEvent?: () => void;
  onChange: (values: T) => void;
}

export const useEvent = <T>({ type, onStartEvent, onChange }: IUseEvent<T>) =>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
