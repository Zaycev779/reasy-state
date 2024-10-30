/* eslint-disable no-restricted-globals */
import React from "react";

export const useEvent = <T>(
    type: any,
    onChange: () => void,
    onChangeType: () => void,
    onTargetEvent = () => onChange(),
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
