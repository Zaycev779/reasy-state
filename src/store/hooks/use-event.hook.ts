import React from "react";

export const useEvent = <T>(
    type: any,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) => onChange((ev as CustomEvent<T>).detail),
    doc = document,
) =>
    React.useLayoutEffect(
        () =>
            type &&
            (onChangeType(),
            doc.addEventListener(type, onTargetEvent),
            () => doc.removeEventListener(type, onTargetEvent)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );
