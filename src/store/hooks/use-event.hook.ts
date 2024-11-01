/* eslint-disable no-restricted-globals */
import React from "react";

export const useEvent = (
    type: any,
    onChange: () => void,
    onChangeType: () => void = onChange,
    onTargetEvent = () => onChange(),
) =>
    React.useEffect(
        () =>
            type &&
            (onChangeType(),
            addEventListener(type, onTargetEvent),
            () => removeEventListener(type, onTargetEvent)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );
