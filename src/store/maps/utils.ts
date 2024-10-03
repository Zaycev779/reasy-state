export const getMapByKey = (key: string) => EStorage.map[key];
export const getMap = () => EStorage.map;
export const setMap = (key: string, value: string[]) =>
    (EStorage.map[key] = value);
