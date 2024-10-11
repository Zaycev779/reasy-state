import { Storage } from "./index";
import { isObject, OptionalKey } from "../utils";

export const generateId = (object: any, key?: string) => {
    if (key) return "#".concat(key).replace(OptionalKey, "#");

    const { mapId } = Storage;
    const value = isObject(object) ? object : { object };
    if (!mapId.has(value)) {
        mapId.set(value, ++Storage.storeId);
    }
    return "#".concat(String(mapId.get(value)));
};
