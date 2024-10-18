import { Storage } from "../global";

export const getMapByKey = (key: string) => Storage.map[key];
export const getMap = () => Storage.map;
export const setMap = (key: string, value: string[]) =>
    (Storage.map[key] = value);
