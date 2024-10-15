import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";

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
