import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";

it("create store with array", async () => {
    const {
        useStoreValue,
        useStoreArray,
        useStoreArray$id,
        setStoreArray,
        useStoreArray$evenVal,
        setStoreArray$evenVal,
    } = createState({
        store: {
            value: "test value",
            array: [{ id: 1, evenVal: false }],
        },
    });

    let renderCountsValue = 0;
    let renderCountsArray = 0;
    let renderCountsArrayIds = 0;
    let renderCountsArrayEvenIds = 0;
    let renderCountsArrayEvenVals = 0;

    function Page() {
        const value = useStoreValue();
        renderCountsValue++;
        return <div>value: {value}</div>;
    }
    function Page2() {
        const array = useStoreArray();
        renderCountsArray++;
        return (
            <div>
                array:{" "}
                {array
                    .map(({ id, evenVal }) => id + ":" + String(evenVal))
                    .join()}
            </div>
        );
    }
    function Page3() {
        const arrayIds = useStoreArray$id();
        renderCountsArrayIds++;
        return <div>arrayIds: {arrayIds.join()}</div>;
    }
    function Page4() {
        const arrayEvenIds = useStoreArray$id(({ id }) => id % 2);
        renderCountsArrayEvenIds++;
        return <div>arrayEvenIds: {arrayEvenIds.join()}</div>;
    }
    function Page5() {
        const arrayEvenVals = useStoreArray$evenVal();
        renderCountsArrayEvenVals++;
        return <div>arrayEvenVals: {arrayEvenVals.join()}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setStoreArray((prev) => [
                        ...prev,
                        { id: prev[prev.length - 1].id + 1, evenVal: false },
                    ])
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Page2 />
            <Page3 />
            <Page4 />
            <Page5 />
            <Button />
        </>,
    );

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(1);
    expect(renderCountsArrayIds).toBe(1);
    expect(renderCountsArrayEvenIds).toBe(1);
    expect(renderCountsArrayEvenVals).toBe(1);

    await findByText("array: 1:false");
    await findByText("arrayIds: 1");
    await findByText("arrayEvenIds: 1");

    fireEvent.click(getByText("button"));

    await findByText("array: 1:false,2:false");
    await findByText("arrayIds: 1,2");
    await findByText("arrayEvenIds: 1");

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(2);
    expect(renderCountsArrayIds).toBe(2);
    expect(renderCountsArrayEvenIds).toBe(1);

    fireEvent.click(getByText("button"));

    await findByText("array: 1:false,2:false,3:false");
    await findByText("arrayIds: 1,2,3");
    await findByText("arrayEvenIds: 1,3");

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(3);
    expect(renderCountsArrayIds).toBe(3);
    expect(renderCountsArrayEvenIds).toBe(2);
    expect(renderCountsArrayEvenVals).toBe(3);

    await findByText("arrayEvenVals: false,false,false");
    act(() => setStoreArray$evenVal(({ id }) => id % 2, true));
    await findByText("arrayEvenVals: true,false,true");
    await findByText("array: 1:true,2:false,3:true");

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(4);
    expect(renderCountsArrayEvenVals).toBe(4);
    expect(renderCountsArrayIds).toBe(3);
    expect(renderCountsArrayEvenIds).toBe(2);
});

it("create store with optional array", async () => {
    type Data = {
        value: string;
        array?: { id: number; evenVal: boolean }[];
    };
    const store: CreateState<Data> = {
        value: "test value",
    };

    const {
        useStoreValue,
        useStore$array,
        useStore$array$id,
        setStore$array,
        useStore$array$evenVal,
        setStore$array$evenVal,
    } = createState({
        store,
    });

    let renderCountsValue = 0;
    let renderCountsArray = 0;
    let renderCountsArrayIds = 0;
    let renderCountsArrayEvenIds = 0;
    let renderCountsArrayEvenVals = 0;

    function Page() {
        const value = useStoreValue();
        renderCountsValue++;
        return <div>value: {value}</div>;
    }
    function Page2() {
        const array = useStore$array();
        renderCountsArray++;
        return (
            <div>
                array:{" "}
                {array
                    ?.map(({ id, evenVal }) => id + ":" + String(evenVal))
                    .join() ?? "-"}
            </div>
        );
    }
    function Page3() {
        const arrayIds = useStore$array$id();
        renderCountsArrayIds++;
        return <div>arrayIds: {arrayIds?.join() ?? "-"}</div>;
    }
    function Page4() {
        const arrayEvenIds = useStore$array$id(({ id }) => id % 2);
        renderCountsArrayEvenIds++;
        return <div>arrayEvenIds: {arrayEvenIds?.join() ?? "-"}</div>;
    }
    function Page5() {
        const arrayEvenVals = useStore$array$evenVal();
        renderCountsArrayEvenVals++;
        return <div>arrayEvenVals: {arrayEvenVals?.join() ?? "-"}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setStore$array((prev) => [
                        ...(prev || []),
                        {
                            id:
                                (prev?.[prev?.length - 1]?.id ||
                                    (prev?.length ?? 0)) + 1,
                            evenVal: false,
                        },
                    ])
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Page2 />
            <Page3 />
            <Page4 />
            <Page5 />
            <Button />
        </>,
    );

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(1);
    expect(renderCountsArrayIds).toBe(1);
    expect(renderCountsArrayEvenIds).toBe(1);
    expect(renderCountsArrayEvenVals).toBe(1);

    await findByText("array: -");
    await findByText("arrayIds: -");
    await findByText("arrayEvenIds: -");

    fireEvent.click(getByText("button"));

    expect(renderCountsArray).toBe(2);
    expect(renderCountsArrayIds).toBe(2);
    expect(renderCountsArrayEvenIds).toBe(2);

    await findByText("array: 1:false");
    await findByText("arrayIds: 1");
    await findByText("arrayEvenIds: 1");

    fireEvent.click(getByText("button"));

    await findByText("array: 1:false,2:false");
    await findByText("arrayIds: 1,2");
    await findByText("arrayEvenIds: 1");

    expect(renderCountsArray).toBe(3);
    expect(renderCountsArrayIds).toBe(3);
    expect(renderCountsArrayEvenIds).toBe(2);

    fireEvent.click(getByText("button"));

    await findByText("array: 1:false,2:false,3:false");
    await findByText("arrayIds: 1,2,3");
    await findByText("arrayEvenIds: 1,3");

    expect(renderCountsArray).toBe(4);
    expect(renderCountsArrayIds).toBe(4);
    expect(renderCountsArrayEvenIds).toBe(3);
    expect(renderCountsArrayEvenVals).toBe(4);

    await findByText("arrayEvenVals: false,false,false");
    act(() => setStore$array$evenVal(({ id }) => id % 2, true));
    await findByText("arrayEvenVals: true,false,true");
    await findByText("array: 1:true,2:false,3:true");

    expect(renderCountsValue).toBe(1);
    expect(renderCountsArray).toBe(5);
    expect(renderCountsArrayEvenVals).toBe(5);
    expect(renderCountsArrayIds).toBe(4);
    expect(renderCountsArrayEvenIds).toBe(3);
});

it("create store with optional store array", async () => {
    type Data = {
        store?: {
            value: string;
            array: { id: number }[];
            obj?: {
                array2: Array<{ id2: number }>;
            };
        };
    };

    const {
        get$store$array$id,
        set$store$array,
        get$store$obj$array2$id2,
        set$store$obj$array2,
    } = createState<Data>()();

    expect(get$store$array$id()).toBe(undefined);
    set$store$array([{ id: 1 }]);
    expect(get$store$array$id()).toStrictEqual([1]);

    expect(get$store$obj$array2$id2()).toBe(undefined);
    set$store$obj$array2([{ id2: 2 }]);
    expect(get$store$obj$array2$id2()).toStrictEqual([2]);
});

it("create store with primitive array", async () => {
    const { useStoreArray, setStoreArray } = createState({
        store: {
            array: [1],
        },
    });

    let renderCounts = 0;
    function Page() {
        const value = useStoreArray();
        renderCounts++;
        return <div>array: {value.join(",")}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setStoreArray((prev) => [
                        ...prev,
                        prev[prev.length - 1] + 1,
                    ])
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    expect(renderCounts).toBe(1);

    await findByText("array: 1");

    fireEvent.click(getByText("button"));

    await findByText("array: 1,2");

    expect(renderCounts).toBe(2);
});

it("create store with primitive optional array", async () => {
    type Store = {
        store: {
            array?: number[];
        };
    };

    const { setStore$array, useStore$array } = createState<Store>({
        store: {},
    });

    let renderCounts = 0;
    function Page() {
        const value = useStore$array();
        renderCounts++;
        return <div>array: {value?.join(",") ?? "-"}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setStore$array((prev) => [
                        ...(prev || []),
                        prev?.[(prev?.length ?? 1) - 1] ?? 0 + 1,
                    ])
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    expect(renderCounts).toBe(1);

    await findByText("array: -");

    fireEvent.click(getByText("button"));

    await findByText("array: 1");

    expect(renderCounts).toBe(2);
});

it("primitive array store", async () => {
    type Store = {
        array?: number[];
    };

    const { set$array, use$array } = createState<Store>()();

    let renderCounts = 0;
    function Page() {
        const value = use$array();
        renderCounts++;
        return <div>array: {value?.join(",") ?? "-"}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    set$array((prev) => [
                        ...(prev || []),
                        prev?.[(prev?.length ?? 1) - 1] ?? 0 + 1,
                    ])
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    expect(renderCounts).toBe(1);

    await findByText("array: -");

    fireEvent.click(getByText("button"));

    await findByText("array: 1");

    expect(renderCounts).toBe(2);
});
