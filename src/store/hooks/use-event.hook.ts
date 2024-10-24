import { Maybe } from "../types";
import { useLayoutEffect } from "../utils/client";

export const useEvent = <T>(
    type: Maybe<string>,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) => onChange((ev as CustomEvent<T>).detail),
    doc = document,
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
