import { Storage } from "./index";
import { isObject } from "../utils";

export const generateId = (s: any, key?: string) => {
    if (key) return ("#" + key).replace(/[$]/g, "#");

    const { mId } = Storage;
    const value = isObject(s) ? s : { s };
    if (!mId.has(value)) {
        mId.set(value, ++Storage.id);
    }
    return "#" + mId.get(value);
};
