import { Maybe } from "../types";
import { useLayoutEffect } from "../utils/client";

export const useEvent = <T>(
    type: Maybe<string>,
    onChange: (values: T) => void,
    onChangeType?: () => void,
) => {
    useLayoutEffect(() => {
        if (!type) return;
        const onTargetEvent = (ev: Event) =>
            onChange((ev as CustomEvent<T>).detail);

        if (onChangeType) {
            onChangeType();
        }
        document.addEventListener(type, onTargetEvent);

        return () => {
            document.removeEventListener(type, onTargetEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);
};
