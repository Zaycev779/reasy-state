import React from "react";
import { Maybe } from "../types";

export const useEvent = <T>(
    type: Maybe<string>,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) => onChange((ev as CustomEvent<T>).detail),
    doc = document,
) =>
    React.useLayoutEffect(
        () =>
            type
                ? (onChangeType(),
                  doc.addEventListener(type, onTargetEvent),
                  () => doc.removeEventListener(type, onTargetEvent))
                : () => 0,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );
