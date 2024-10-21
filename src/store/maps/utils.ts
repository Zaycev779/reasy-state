import { EStorage } from "../global";

export const getMapByKey = (storage: EStorage, key: string) => storage.m[key];
