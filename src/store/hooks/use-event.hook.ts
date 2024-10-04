"use client";

import { useEffect } from "react";

interface IUseEvent<T> {
    type?: string;
    onStart?: () => void;
    onChange: (values: T) => void;
}

export const useEvent = <T>({ type, onStart, onChange }: IUseEvent<T>) =>
    useEffect(() => {
        if (!type) return;

        const onTargetEvent = (ev: Event) => {
            const { detail } = ev as CustomEvent<T>;
            onChange(detail);
        };

        if (onStart) {
            onStart();
        }
        document.addEventListener(type, onTargetEvent);

        return () => {
            document.removeEventListener(type, onTargetEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);
