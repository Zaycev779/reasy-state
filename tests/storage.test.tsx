import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";
const LOCAL_STORAGE_KEY = "E$#storage$_test1";

const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

afterEach(() => {
    localStorage.clear();
    getItemSpy.mockClear();
    setItemSpy.mockClear();
});

it("create storage store", async () => {
    const { setStore, useStoreValue, useStoreOther, getStore } = createState(
        {
            store: { value: 1, other: "test1" },
        },
        {
            key: "storage$_test1",
            storage: true,
        },
    );

    function Page() {
        const value = useStoreValue();
        const other = useStoreOther();

        return (
            <>
                <div>value: {value}</div>
                <div>other: {other}</div>
            </>
        );
    }

    function Button() {
        return (
            <button onClick={() => setStore({ value: 2, other: "test2" })}>
                button 1
            </button>
        );
    }

    const { getByText, findByText, rerender, unmount } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");
    await findByText("other: test1");
    fireEvent.click(getByText("button 1"));
    await findByText("value: 2");
    await findByText("other: test2");

    rerender(
        <>
            <Page />
            <Button />
        </>,
    );
    await findByText("value: 2");
    await findByText("other: test2");
    unmount();

    expect(
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}"),
    ).toStrictEqual({
        store: { value: 2, other: "test2" },
    });

    expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
            store: { value: 2, other: "test2" },
        }),
    );

    getItemSpy.mockReturnValueOnce(
        JSON.stringify({
            store: getStore(),
        }),
    );

    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY);
});

it("load storage store", async () => {
    const { useStoreValue, useStoreOther } = createState(
        {
            store: { value: 1, other: "test1" },
        },
        {
            key: "storage$_test1",
            storage: true,
        },
    );

    function Page() {
        const value = useStoreValue();
        const other = useStoreOther();

        return (
            <>
                <div>value: {value}</div>
                <div>other: {other}</div>
            </>
        );
    }
    const { findByText } = render(
        <>
            <Page />
        </>,
    );

    await findByText("value: 2");
    await findByText("other: test2");
});

const LOCAL_STORAGE_KEY_MUT = "E$#storage_mut";

it("create storage store mutators", async () => {
    const { getStore, setStore, useStoreValue, useStoreOther } = createState(
        {
            store: { value: 1, other: "test1", date: new Date() },
        },
        {
            key: "storage_mut",
            storage: {
                type: localStorage,
                mutators: {
                    store: {
                        date: (mutate) =>
                            mutate({
                                put: (prev) => prev.toUTCString(),
                            }),
                    },
                },
            },
        },
    );

    function Page1() {
        const value = useStoreValue();
        const other = useStoreOther();

        return (
            <>
                <div>value: {value}</div>
                <div>other: {other}</div>
            </>
        );
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setStore({
                        value: 2,
                        other: "test2",
                        date: new Date("2001-01-01"),
                    })
                }
            >
                button 1
            </button>
        );
    }

    const { getByText, findByText, rerender, unmount } = render(
        <>
            <Page1 />
            <Button />
        </>,
    );

    await findByText("value: 1");
    await findByText("other: test1");
    fireEvent.click(getByText("button 1"));
    await findByText("value: 2");
    await findByText("other: test2");

    rerender(
        <>
            <Page1 />
            <Button />
        </>,
    );
    await findByText("value: 2");
    await findByText("other: test2");
    unmount();

    expect(
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUT) || "{}"),
    ).toStrictEqual({
        store: {
            date: "Mon, 01 Jan 2001 00:00:00 GMT",
            value: 2,
            other: "test2",
        },
    });

    expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY_MUT,
        JSON.stringify({
            store: {
                date: "Mon, 01 Jan 2001 00:00:00 GMT",
                value: 2,
                other: "test2",
            },
        }),
    );

    getItemSpy.mockReturnValueOnce(
        JSON.stringify({
            store: {
                value: 2,
                other: "test2",
                date: "Mon, 01 Jan 2001 00:00:00 GMT",
            },
        }),
    );
    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY_MUT);

    //    EStorage.store["#storage_mut"] = undefined;
});

it("create storage store mutators", async () => {
    const { useStoreDate, useStoreValue, useStoreOther } = createState(
        {
            store: { value: 1, other: "test1", date: new Date() },
        },
        {
            key: "storage_mut",
            storage: {
                type: localStorage,
                mutators: {
                    store: {
                        date: (mutate) =>
                            mutate({
                                put: (prev) => prev.toLocaleString(),
                                get: (prev) =>
                                    new Date(new Date(prev).setFullYear(2002)),
                            }),
                    },
                },
            },
        },
    );

    function Page1() {
        const value = useStoreValue();
        const other = useStoreOther();
        const date = useStoreDate();
        return (
            <>
                <div>value: {value}</div>
                <div>other: {other}</div>
                <div>date: {date.toDateString()}</div>
            </>
        );
    }

    const { findByText, unmount } = render(
        <>
            <Page1 />
        </>,
    );

    await findByText("value: 2");
    await findByText("other: test2");
    await findByText("date: Tue Jan 01 2002");
    unmount();
});

const LOCAL_STORAGE_KEY_ARR = "E$#arr_test";

it("create storage arrays store mutators set", async () => {
    type Type = Array<number>;
    const { set, get } = createState<Type>()([], {
        key: "arr_test",
        storage: {
            type: localStorage,
            mutators: (m) => m({ put: (p) => p.map((n) => n + 1) }),
        },
    });
    act(() => set([1, 2, 3]));
    expect(get()).toStrictEqual([1, 2, 3]);
    expect(
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ARR) || "{}"),
    ).toStrictEqual([2, 3, 4]);

    expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY_ARR,
        JSON.stringify([2, 3, 4]),
    );

    getItemSpy.mockReturnValueOnce(JSON.stringify([2, 3, 4]));
    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY_ARR);
});

it("create storage arrays store mutators get", async () => {
    type Type = Array<number>;
    const { get } = createState<Type>()([], {
        key: "arr_test",
        storage: {
            type: localStorage,
            mutators: (m) =>
                m({
                    put: (p) => p.map((n) => n + 1),
                    get: (p) => p.map((n) => n + 1),
                }),
        },
    });
    expect(get()).toStrictEqual([3, 4, 5]);
});
const LOCAL_STORAGE_KEY_PRIMITIVE = "E$#str_test";

it("create storage primitive store mutators set", async () => {
    const { set, get } = createState<string>()("", {
        key: "str_test",
        storage: {
            type: localStorage,
            mutators: (m) => m({ put: (p) => p.concat("+") }),
        },
    });
    act(() => set("test"));

    expect(get()).toStrictEqual("test");
    expect(
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PRIMITIVE) || "{}"),
    ).toStrictEqual("test+");

    expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY_PRIMITIVE,
        JSON.stringify("test+"),
    );

    getItemSpy.mockReturnValueOnce(JSON.stringify("test+"));
    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY_PRIMITIVE);
});

it("create storage primitive store mutators get", async () => {
    const { get } = createState<string>()("", {
        key: "str_test",
        storage: {
            type: localStorage,
            mutators: (m) =>
                m({
                    put: (p) => p,
                    get: (p) => p + "-",
                }),
        },
    });
    expect(get()).toStrictEqual("test+-");
});
