import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";
import { getGlobalData } from "reasy-state/store/get-global";
const LOCAL_STORAGE_KEY = "_res#storage_test";

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
            key: "storage_test",
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

    EStorage.store["#storage_test"] = undefined;
});

it("load storage store", async () => {
    const { useStoreValue, useStoreOther } = createState(
        {
            store: { value: 1, other: "test1" },
        },
        {
            key: "storage_test",
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

const LOCAL_STORAGE_KEY_MUT = "_res#storage_mut";

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
                                put: (prev) => prev.toLocaleString(),
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
        store: { date: "01.01.2001, 02:00:00", value: 2, other: "test2" },
    });

    expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY_MUT,
        JSON.stringify({
            store: {
                date: "01.01.2001, 02:00:00",
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
                date: "01.01.2001, 02:00:00",
            },
        }),
    );
    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY_MUT);

    EStorage.store["#storage_mut"] = undefined;
});

it("create storage store mutators", async () => {
    // expect(
    //     JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUT) || "{}"),
    // ).toStrictEqual({
    //     store: { value: 2, other: "test2", date: "01.01.2001, 02:00:00" },
    // });

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