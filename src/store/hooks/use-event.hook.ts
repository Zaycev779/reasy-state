import { useLayoutEffect } from "react";

interface IUseEvent<T> {
    type?: string;
    onChangeType?: () => void;
    onChange: (values: T) => void;
}

export const useEvent = <T>({ type, onChangeType, onChange }: IUseEvent<T>) => {
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
