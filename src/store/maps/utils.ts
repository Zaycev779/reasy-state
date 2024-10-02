export const getMapByKey = (key: string) => EStorage.getMapByKey(key);
export const getMap = () => EStorage.getMap();
export const setMap = (key: string, value: string[]) =>
    EStorage.setMap(key, value);
