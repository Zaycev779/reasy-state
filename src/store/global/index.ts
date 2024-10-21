import { getStaticPath } from "../maps/maps";

export type EStorage = {
    s: Record<string, any>;
    m: Record<string, string[]>;
    id: string;
};

export const createStorage = (
    id: string,
    s: EStorage["s"],
    m = getStaticPath(s, id),
): EStorage => ({
    s,
    m,
    id,
});
