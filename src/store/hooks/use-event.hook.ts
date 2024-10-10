import { useLayoutEffect, useRef } from "react";

interface IUseEvent<T> {
    type?: string;
    onChangeType?: () => void;
    onChange: (values: T) => void;
    onLoad?: () => void;
}

export const useEvent = <T>({
    type,
    onChangeType,
    onChange,
    onLoad,
}: IUseEvent<T>) => {
    const prevType = useRef<string>();
    useLayoutEffect(() => {
        if (!type) return;

        const onTargetEvent = (ev: Event) =>
            onChange((ev as CustomEvent<T>).detail);

        if (onChangeType) {
            if (prevType.current) {
                onChangeType();
            }
            prevType.current = type;
        }
        document.addEventListener(type, onTargetEvent);
        if (onLoad) {
            onLoad();
        }
        return () => {
            document.removeEventListener(type, onTargetEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);
};
