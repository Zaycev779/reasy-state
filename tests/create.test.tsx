import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createState } from "reasy-state";

it("create store", async () => {
    const { useStore } = createState({ store: { value: 1 } });

    function Page() {
        const store = useStore();

        return <div>value: {store.value}</div>;
    }

    const { findByText } = render(
        <>
            <Page />
        </>,
    );

    await findByText("value: 1");
});

it("create primitive store", async () => {
    const { use } = createState(1);

    function Page() {
        const store = use();

        return <div>value: {store}</div>;
    }

    const { findByText } = render(
        <>
            <Page />
        </>,
    );

    await findByText("value: 1");
});

it("set store value", async () => {
    const {
        useStore,
        setStore,
        useStoreValue,
        setStoreValue,
        getStore,
        getStoreValue,
        useStoreOther,
        setStoreOther,
    } = createState({
        store: { value: 1, other: "test" },
    });
    let renderCounts = 0;
    let renderCountsOther = 0;
    let renderCountsValue = 0;

    function Page() {
        const store = useStore();
        renderCounts++;
        return <div>value1: {store.value}</div>;
    }

    function Page2() {
        const value = useStoreValue();
        renderCountsValue++;

        return <div>value2: {value}</div>;
    }

    function PageOther() {
        const other = useStoreOther();
        renderCountsOther++;
        return <div>other: {other}</div>;
    }

    function Button() {
        return (
            <button onClick={() => setStore({ value: 2, other: "test1" })}>
                button 1
            </button>
        );
    }

    function ButtonPrev() {
        return (
            <button
                onClick={() =>
                    setStore(({ value, other }) => ({
                        value: value + 1,
                        other,
                    }))
                }
            >
                button 2
            </button>
        );
    }

    function Button2() {
        return <button onClick={() => setStoreValue(4)}>button 3</button>;
    }

    function Button2Prev() {
        return (
            <button onClick={() => setStoreValue((prev) => prev + 1)}>
                button 4
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <PageOther />
            <Page />
            <Page2 />
            <Button />
            <ButtonPrev />
            <Button2 />
            <Button2Prev />
        </>,
    );
    expect(renderCounts).toBe(1);
    expect(renderCountsOther).toBe(1);
    expect(renderCountsValue).toBe(1);

    act(() => setStoreOther("new value"));
    expect(getStore().other).toBe("new value");
    expect(renderCountsOther).toBe(2);

    fireEvent.click(getByText("button 1"));
    expect(renderCountsOther).toBe(3);
    expect(renderCountsValue).toBe(2);

    await findByText("value1: 2");
    await findByText("value2: 2");
    fireEvent.click(getByText("button 2"));
    expect(renderCountsValue).toBe(3);

    await findByText("value1: 3");
    await findByText("value2: 3");

    fireEvent.click(getByText("button 3"));
    expect(renderCountsValue).toBe(4);

    await findByText("value1: 4");
    await findByText("value2: 4");

    fireEvent.click(getByText("button 4"));
    expect(renderCountsValue).toBe(5);

    await findByText("value1: 5");
    await findByText("value2: 5");

    expect(getStore().value).toBe(5);
    expect(getStoreValue()).toBe(5);

    expect(renderCounts).toBe(6);
    expect(renderCountsValue).toBe(5);
    expect(renderCountsOther).toBe(3);
});
