import { Options } from "../types/store";

const H = "#";
let EStateId = 0;

export const generateId = <T>(options?: Options<T>) =>
    options && options.key
        ? (options.key = H + options.key.replace(/[$]/g, H))
        : H + ++EStateId;
