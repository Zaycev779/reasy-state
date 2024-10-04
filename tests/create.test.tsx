import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createState } from "reasy-state";
import { useEffect } from "react";

it("create state", async () => {
    const { useState } = createState({ state: { value: 1 } });

    function Page() {
        const state = useState();

        return <div>value: {state.value}</div>;
    }

    const { findByText } = render(
        <>
            <Page />
        </>,
    );

    await findByText("value: 1");
});

it("create primitive state", async () => {
    const { use } = createState(1);

    function Page() {
        const state = use();

        return <div>value: {state}</div>;
    }

    const { findByText } = render(
        <>
            <Page />
        </>,
    );

    await findByText("value: 1");
});

it("set state value", async () => {
    const {
        useState,
        setState,
        useStateValue,
        setStateValue,
        getState,
        getStateValue,
        useStateOther,
        setStateOther,
    } = createState({
        state: { value: 1, other: "test" },
    });
    let renderCounts = 0;
    let renderCountsOther = 0;
    let renderCountsValue = 0;

    function Page() {
        const state = useState();
        renderCounts++;
        return <div>value1: {state.value}</div>;
    }

    function Page2() {
        const value = useStateValue();
        renderCountsValue++;

        return <div>value2: {value}</div>;
    }

    function PageOther() {
        const other = useStateOther();
        renderCountsOther++;
        return <div>other: {other}</div>;
    }

    function Button() {
        return (
            <button onClick={() => setState({ value: 2, other: "test1" })}>
                button 1
            </button>
        );
    }

    function ButtonPrev() {
        return (
            <button
                onClick={() =>
                    setState(({ value, other }) => ({
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
        return <button onClick={() => setStateValue(4)}>button 3</button>;
    }

    function Button2Prev() {
        return (
            <button onClick={() => setStateValue((prev) => prev + 1)}>
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

    act(() => setStateOther("new value"));
    expect(getState().other).toBe("new value");
    expect(renderCountsOther).toBe(2);

    fireEvent.click(getByText("button 1"));
    expect(renderCountsOther).toBe(3);
    expect(renderCountsValue).toBe(3);

    await findByText("value1: 2");
    await findByText("value2: 2");
    fireEvent.click(getByText("button 2"));
    expect(renderCountsValue).toBe(4);

    await findByText("value1: 3");
    await findByText("value2: 3");

    fireEvent.click(getByText("button 3"));
    expect(renderCountsValue).toBe(5);

    await findByText("value1: 4");
    await findByText("value2: 4");

    fireEvent.click(getByText("button 4"));
    expect(renderCountsValue).toBe(6);

    await findByText("value1: 5");
    await findByText("value2: 5");

    expect(getState().value).toBe(5);
    expect(getStateValue()).toBe(5);

    expect(renderCounts).toBe(6);
    expect(renderCountsValue).toBe(6);
    expect(renderCountsOther).toBe(3);
});
