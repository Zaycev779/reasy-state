import { IStore } from "./types/store";

export const getGlobalData = (
    path?: string[],
    forArray?: boolean,
    filterFunc?: Function,
    src = EStorage.get(),
) =>
    path?.reduce(
        ({ value, skip }, v, idx) => {
            if (skip) {
                return { value, skip };
            }
            if (v.includes("[]") || Array.isArray(value)) {
                if (forArray) {
                    const additionalPaths = path.slice(idx + 1, path.length);
                    const filterValue = filterFunc
                        ? value?.filter(filterFunc)
                        : value;
                    return {
                        value: filterValue?.map((v: any) =>
                            additionalPaths?.reduce(
                                (prev, key) => prev?.[key],
                                v,
                            ),
                        ),
                        skip: true,
                    };
                }
                return {
                    value,
                    skip: true,
                };
            }
            return { value: value?.[v] };
        },
        { value: src } as { value?: Record<string, any>; skip?: boolean },
    ).value as Partial<IStore>;
