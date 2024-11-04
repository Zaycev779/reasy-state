import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";

it("created root mutator with types", async () => {
    type State = {
        store?: {
            value: number;
        };
        mutators: {
            inc: void;
        };
    };
    const { use$store$value, inc } = createState<State>()({
        mutators: {
            inc: ({ set, get }, { store }) =>
                set({ store: { value: (store?.value ?? 0) + 1 } }),
        },
    });

    function Page() {
        const value = use$store$value();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value:");

    fireEvent.click(getByText("inc"));
    await findByText("value: 1");
});

it("created root mutator without types", async () => {
    type State = {
        store?: {
            value: number;
        };
    };
    const { use$store$value, inc } = createState<State>()({
        mutators: {
            inc: ({ set, get }, { store }) =>
                set({ store: { value: (store?.value ?? 0) + 1 } }),
        },
    });

    function Page() {
        const value = use$store$value();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value:");

    fireEvent.click(getByText("inc"));
    await findByText("value: 1");
});

it("created root mutator without types 2", async () => {
    const { useStoreValue, inc } = createState({
        store: {
            value: 1,
        },
        mutators: {
            inc: ({ set, get }, { store }) => {
                set({ store: { value: (store?.value ?? 0) + 1 } });
                return true;
            },
        },
    });

    function Page() {
        const value = useStoreValue();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");
});

it("created root mutator with types 2.2", async () => {
    type State = CreateState<{ value: number; mutators: { inc: void } }>;

    const { useValue, inc } = createState<State>({
        value: 1,
        mutators: {
            inc: ({ set }, { value }) => set({ value: value + 1 }),
        },
    });

    function Page() {
        const value = useValue();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");
});

it("created root mutator without types 2.3", async () => {
    type State = {
        value: number;
        mutators: {
            add: (value: number) => Promise<number>;
        };
    };

    const { useValue, add } = createState<State>()({
        value: 1,
        mutators: {
            add:
                ({ set, get }) =>
                async (addValue) => {
                    await new Promise((f) => setTimeout(f, 1000));
                    return set({ value: get().value + addValue }).value;
                },
        },
    });

    function Page() {
        const value = useValue();
        return <div>value: {value}</div>;
    }
    const onClick = () =>
        add(1).then((value) => console.log("new value = ", value));

    function Button() {
        return <button onClick={onClick}>add</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("add"));
    await findByText("value: 2");
});

it("created root mutator without types 3", async () => {
    const { useStoreValue, inc } = createState()({
        store: {
            value: 1,
        },

        mutators: {
            s: (a) => 1,
            inc: ({ set, get }, { store }) => {
                set({ store: { value: (store?.value ?? 0) + 1 } });
                return 1;
            },
        },
    });

    function Page() {
        const value = useStoreValue();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");
});

it("use dont created mutator", async () => {
    type State = {
        store?: {
            value: number;
            mutators: {
                inc: void;
            };
        };
        mutators: {
            inc: void;
        };
    };
    const { use$store$value, $store$inc, get$store, inc } =
        createState<State>()();

    function Page() {
        const value = use$store$value() || "-";
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    expect(get$store()).toBe(undefined);
    await findByText("value: -");

    fireEvent.click(getByText("inc"));
    await findByText("value: -");
});

it("create mutators", async () => {
    type UserStore = {
        id: number;
        data: {
            rating: number;
            other: number;
            mutators: {
                clear: void; // clear function
                inc: void; // increment function
                dec: Promise<boolean>; // decrement async function
                add: (value: number) => void; // add value function with arg
                remove: (value: number) => Promise<string>; // remove value async function with arg
            };
        };
        mutators: {
            ratingInc: void;
            changeId: void;
        };
    };

    const userStore: CreateState<UserStore> = {
        id: 1,
        data: {
            rating: 0,
            other: 1,
            mutators: {
                clear: ({ set }) => set({ rating: 0, other: 0 }),
                inc: ({ patch }, { rating }) => patch({ rating: rating + 1 }),

                dec: async ({ patch, get }) => {
                    await new Promise((f) => setTimeout(f, 1000));
                    patch({ rating: get().rating - 1 });
                    return true;
                },

                add:
                    ({ patch }, { rating }) =>
                    (value) =>
                        patch({ rating: rating + value }),
                remove:
                    ({ patch, get }) =>
                    async (value) => {
                        await new Promise((f) => setTimeout(f, 1000));
                        patch({ rating: get().rating - value });
                        return "success";
                    },
            },
        },
        mutators: {
            changeId: ({ patch }) => patch({ id: 2 }),
            ratingInc: ({ patch }, { data: { rating } }) =>
                patch({ data: { rating: rating + 1 } }),
        },
    };

    const {
        get,
        userStoreDataClear,
        userStoreDataInc,
        userStoreDataDec,
        userStoreDataAdd,
        userStoreDataRemove,
        useUserStoreDataRating,
    } = createState({ userStore });

    let renderCounts = 0;

    const UserRating = () => {
        const rating = useUserStoreDataRating();
        renderCounts++;
        return (
            <>
                <div>
                    <button
                        onClick={async () => {
                            const response = await userStoreDataRemove(5);
                            return response;
                        }}
                    >
                        remove
                    </button>
                    <button
                        onClick={async () => {
                            const response = await userStoreDataDec();
                            return response;
                        }}
                    >
                        dec
                    </button>
                    <span>rating: {rating}</span>
                    <button onClick={userStoreDataInc}>inc</button>
                    <button onClick={() => userStoreDataAdd(5)}>add</button>
                </div>
                <button onClick={userStoreDataClear}>clear</button>
            </>
        );
    };

    const { getByText, findByText } = render(
        <>
            <UserRating />
        </>,
    );

    expect(renderCounts).toBe(1);
    await findByText("rating: 0");
    fireEvent.click(getByText("remove"));
    await findByText("rating: -5");
    fireEvent.click(getByText("dec"));
    await findByText("rating: -6");
    fireEvent.click(getByText("add"));
    await findByText("rating: -1");
    fireEvent.click(getByText("inc"));
    await findByText("rating: 0");
    fireEvent.click(getByText("inc"));
    await findByText("rating: 1");
    fireEvent.click(getByText("clear"));
    await findByText("rating: 0");
    expect(renderCounts).toBe(7);
});

it("create optional mutators", async () => {
    type UserStore3 = {
        id: number;
        name: string;
        settings: {
            notification: {
                message: boolean;
                mutators: {
                    switch: void;
                };
            };
            notification2: {
                message?: boolean;
                mutators: {
                    switch: void;
                };
            };
            mutators: {
                switch2: void;
            };
        };
    };

    const userStore3: CreateState<UserStore3 | undefined> = {
        id: 1,
        name: "test",
        settings: {
            notification: {
                message: true,
                mutators: {
                    switch: ({ set }) =>
                        set(({ message }) => ({ message: !message })),
                },
            },
            notification2: {
                mutators: {
                    switch: ({ set }) =>
                        set(({ message }) => ({ message: !message })),
                },
            },
            mutators: {
                switch2: ({ set }) =>
                    set(({ notification, notification2 }) => ({
                        notification,
                        notification2,
                    })),
            },
        },
    };

    const state3 = createState<{ userStore3?: UserStore3 }>()({
        userStore3,
    });

    let renderCounts1 = 0;
    let renderCounts2 = 0;

    const {
        use$userStore3$settings$notification2$message,
        $userStore3$settings$notification2$switch,
        $userStore3$settings$notification$switch,
        use$userStore3$settings$notification$message,
        reset,
    } = state3;

    const Test1 = () => {
        const message = use$userStore3$settings$notification$message();
        renderCounts1++;
        return (
            <>
                <p>message1: {String(message)}</p>
                <button
                    onClick={() => $userStore3$settings$notification$switch()}
                >
                    button 1
                </button>
            </>
        );
    };

    const Test2 = () => {
        const message2 = use$userStore3$settings$notification2$message();
        renderCounts2++;
        return (
            <>
                <p>message2: {String(message2)}</p>
                <button
                    onClick={() => $userStore3$settings$notification2$switch()}
                >
                    button 2
                </button>
            </>
        );
    };

    const { getByText, findByText } = render(
        <>
            <Test1 />
            <Test2 />
        </>,
    );

    expect(renderCounts1).toBe(1);
    expect(renderCounts2).toBe(1);

    await findByText("message1: true");
    fireEvent.click(getByText("button 1"));
    await findByText("message1: false");

    expect(renderCounts1).toBe(2);
    expect(renderCounts2).toBe(1);

    await findByText("message2: undefined");
    fireEvent.click(getByText("button 2"));
    await findByText("message2: true");

    expect(renderCounts1).toBe(2);
    expect(renderCounts2).toBe(2);

    act(() => reset());
    await findByText("message1: true");
    await findByText("message2: undefined");

    expect(renderCounts1).toBe(3);
    expect(renderCounts2).toBe(3);
});

it("create optional mutators without types", async () => {
    type UserStore3 = {
        userStore3?: {
            id: number;
            name: string;
            settings: {
                notification: {
                    message: boolean;
                };
                notification2: {
                    message?: boolean;
                };
            };
        };
    };

    const state3 = createState<UserStore3>()({
        userStore3: {
            id: 1,
            name: "test",
            settings: {
                notification: {
                    message: true,
                    mutators: {
                        switch: ({ set }) =>
                            set(({ message }) => ({ message: !message })),
                    },
                },
                notification2: {
                    mutators: {
                        switch: ({ set }) =>
                            set(({ message }) => ({ message: !message })),
                    },
                },
                mutators: {
                    switch2: ({ set }) =>
                        set(({ notification, notification2 }) => ({
                            notification,
                            notification2,
                        })),
                },
            },
        },
    });

    let renderCounts1 = 0;
    let renderCounts2 = 0;

    const {
        use$userStore3$settings$notification2$message,
        $userStore3$settings$notification2$switch,
        $userStore3$settings$notification$switch,
        use$userStore3$settings$notification$message,
        reset,
    } = state3;

    const Test1 = () => {
        const message = use$userStore3$settings$notification$message();
        renderCounts1++;
        return (
            <>
                <p>message1: {String(message)}</p>
                <button
                    onClick={() => $userStore3$settings$notification$switch()}
                >
                    button 1
                </button>
            </>
        );
    };

    const Test2 = () => {
        const message2 = use$userStore3$settings$notification2$message();
        renderCounts2++;
        return (
            <>
                <p>message2: {String(message2)}</p>
                <button
                    onClick={() => $userStore3$settings$notification2$switch()}
                >
                    button 2
                </button>
            </>
        );
    };

    const { getByText, findByText } = render(
        <>
            <Test1 />
            <Test2 />
        </>,
    );

    expect(renderCounts1).toBe(1);
    expect(renderCounts2).toBe(1);

    await findByText("message1: true");
    fireEvent.click(getByText("button 1"));
    await findByText("message1: false");

    expect(renderCounts1).toBe(2);
    expect(renderCounts2).toBe(1);

    await findByText("message2: undefined");
    fireEvent.click(getByText("button 2"));
    await findByText("message2: true");

    expect(renderCounts1).toBe(2);
    expect(renderCounts2).toBe(2);

    act(() => reset());
    await findByText("message1: true");
    await findByText("message2: undefined");

    expect(renderCounts1).toBe(3);
    expect(renderCounts2).toBe(3);
});

it("create root mutators", async () => {
    type State = {
        store: {
            value: number;
        };
    };
    const { useStoreValue, inc, getStore } = createState<State>()({
        store: {
            value: 1,
        },
        mutators: {
            inc: ({ set, get }, { store: { value } }) =>
                set({ store: { value: value + 1 } }),
        },
    });

    function Page() {
        const value = useStoreValue();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");
});

it("result mutators", async () => {
    type State = {
        store: {
            value: number;
        };
    };
    const { useStoreValue, inc, dec, getStore } = createState<State>()({
        store: {
            value: 1,
        },
        mutators: {
            inc: ({ set, get }, { store: { value } }) =>
                set({ store: { value: value + 1 } }),
            dec: ({ set, get }, { store: { value } }) => "dec",
        },
    });

    function Page() {
        const value = useStoreValue();
        return <div>value: {value}</div>;
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );

    await findByText("value: 1");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");

    act(() => {
        const res = inc().store.value;
        expect(res).toBe(3);
        const res2 = dec();
        expect(res2).toBe("dec");
    });
});

it("patch mutators", async () => {
    type State = {
        store: {
            value: number;
            other: number;
        };
    };
    const { useStoreValue, useStoreOther, inc, useStore } =
        createState<State>()({
            store: {
                value: 1,
                other: 2,
            },
            mutators: {
                inc: ({ patch, get }) =>
                    patch({ store: { value: get().store.value + 1 } }),
            },
        });

    function Page() {
        const value = useStoreValue();
        return <div>value: {value}</div>;
    }

    function Page2() {
        const other = useStoreOther();
        return <div>other: {other}</div>;
    }

    function Page3() {
        const data = useStore();
        return (
            <div>
                data: {data.value},{data.other}
            </div>
        );
    }

    function Button() {
        return <button onClick={() => inc()}>inc</button>;
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Page2 />
            <Page3 />
            <Button />
        </>,
    );

    await findByText("value: 1");
    await findByText("other: 2");
    await findByText("data: 1,2");

    fireEvent.click(getByText("inc"));
    await findByText("value: 2");
    await findByText("other: 2");
    await findByText("data: 2,2");

    act(() => {
        const res = inc().store;
        expect(res).toStrictEqual({ value: 3, other: 2 });
    });
    await findByText("data: 3,2");
});
