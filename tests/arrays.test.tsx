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
