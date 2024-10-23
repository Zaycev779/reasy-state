import { Maybe } from "../types";
import { doc, useLayoutEffect } from "../utils/client";

export const useEvent = <T>(
    type: Maybe<string>,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) => onChange((ev as CustomEvent<T>).detail),
) =>
    useLayoutEffect(() => {
        if (type) {
            onChangeType();
            doc.addEventListener(type, onTargetEvent);

            return () => doc.removeEventListener(type, onTargetEvent);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);
