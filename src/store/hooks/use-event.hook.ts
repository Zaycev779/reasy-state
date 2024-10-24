import { Maybe } from "../types";
import { doc, useLayoutEffect } from "../utils/client";

export const useEvent = <T>(
    type: Maybe<string>,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) => onChange((ev as CustomEvent<T>).detail),
) =>
    useLayoutEffect(
        () =>
            type
                ? (onChangeType(),
                  doc.addEventListener(type, onTargetEvent),
                  () => doc.removeEventListener(type, onTargetEvent))
                : () => 0,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );
