import { IStore } from './typing';

export const getUpdatedParams = <T extends IStore>(
  updatedParams: T,
  prevValues: T
): string[] => {
  if (typeof updatedParams !== 'object' || !updatedParams) return [];
  const entries = Object.entries(updatedParams);
  return entries.reduce((prev, [key, val]) => {
    let childParam: string[] = [];
    if (typeof val === 'object') {
      childParam = getUpdatedParams(val as IStore, prevValues[key] as IStore);
    }
    if (val !== prevValues[key]) {
      return [...prev, key, ...childParam];
    }
    return prev;
  }, [] as string[]);
};
