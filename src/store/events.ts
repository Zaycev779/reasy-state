import { getGlobalData } from "./get-global";
import { isArrayPathName, isClient, pathToString } from "./utils";
import { IStore } from "./types/store";
import { getAdditionalPaths, getRootPaths, getUpdatedPaths } from "./utils";

export const PUSH_EV_NAME = "__PUSH_EV";
export const PATH_MAP_EV_NAME = "__PATH_EV";

export const _updatePathEvent = (pathMap: string, path: string[]) =>
    sendEvent(PATH_MAP_EV_NAME + pathMap, { path });

export const _pushStoreValueEvent = <T extends IStore<T>>(
    paths: string[],
    updatedParams: T,
    prevValues: T,
) => {
    const updatePaths = getUpdatedPaths(
        updatedParams,
        prevValues,
        paths,
    ).concat(getAdditionalPaths(paths, isArrayPathName) as string[][]);

    if (updatePaths.length) {
        const rest = paths.concat();
        rest.splice(-1);
        updatePaths.push(...getRootPaths(rest));
    }
    updatePaths.forEach((pathVal) =>
        sendEvent(PUSH_EV_NAME + pathToString(pathVal), {
            params: getGlobalData(pathVal),
        }),
    );
};

const sendEvent = (route: string, detail: any) => {
    if (!isClient) return;

    document.dispatchEvent(
        new CustomEvent(route, {
            detail,
        }),
    );
};
