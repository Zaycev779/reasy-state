export const globalStore: Record<string, any> = {};

export const updateGlobalData = (
  paths: string[],
  data: Partial<IStore>,
  src = globalStore
): boolean => {
  const [path, ...rest] = paths;
  if (!rest.length) {
    src[path] = data;
    return true;
  }
  return updateGlobalData(rest, data, src[path]);
};

export const getGlobalData = (path: string[]) =>
  path.reduce((prev, v) => prev?.[v], globalStore) as Partial<IStore>;
