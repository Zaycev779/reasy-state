/* eslint-disable no-restricted-globals */
import React from "react";

export const useEvent = <T>(
    type: any,
    onChange: (values: T) => void,
    onChangeType: () => void,
    onTargetEvent = (ev: Event) =>
        onChange((ev as CustomEvent<{ p: T }>).detail.p),
) =>
    React.useLayoutEffect(
        () =>
            type &&
            (onChangeType(),
            addEventListener(type, onTargetEvent),
            () => removeEventListener(type, onTargetEvent)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );
