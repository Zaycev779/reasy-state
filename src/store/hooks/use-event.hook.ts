import { useEffect, useRef } from "react";

interface IUseEvent<T> {
    type?: string;
    onChangeType?: () => void;
    onChange: (values: T) => void;
}

export const useEvent = <T>({ type, onChangeType, onChange }: IUseEvent<T>) => {
    const prevType = useRef<string>();
    useEffect(() => {
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

        return () => {
            document.removeEventListener(type, onTargetEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);
};
