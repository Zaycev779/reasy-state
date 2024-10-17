import { Storage } from "./index";
import { isObject } from "../utils";

export const generateId = (object: any, key?: string) => {
    if (key) return ("#" + key).replace(/[$]/g, "#");

    const { mapId } = Storage;
    const value = isObject(object) ? object : { object };
    if (!mapId.has(value)) {
        mapId.set(value, ++Storage.id);
    }
    return "#" + String(mapId.get(value));
};
