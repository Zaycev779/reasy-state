import { createState } from "reasy-state";
import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";

it("imitate ssr initial", async () => {
    type Store = {
        user: {
            id: number;
            login: string;
        };
    };

    const {
        use$user$id,
        ssr: { SSR$user },
    } = createState<Store>()();

    const Page = async () => {
        const data = await new Promise<{ id: number; login: string }>((res) =>
            setTimeout(() => res({ id: 123, login: "user" }), 1000),
        );

        return (
            <>
                <SSR$user value={data} />
            </>
        );
    };
    const page = await Page();
    render(page);

    function Client() {
        const id = use$user$id();
        return <p>userId {id}</p>;
    }
    const { findByText } = render(<Client />);

    await findByText("userId 123");
});

it("imitate ssr initial2", async () => {
    type Store = {
        user: {
            id: number;
            login: string;
        };
    };

    const {
        useUserId,
        ssr: { SSRUser },
    } = createState<Store>()({ user: { id: 1, login: "-" } });

    const Page = async () => {
        const data = await new Promise<{ id: number; login: string }>((res) =>
            setTimeout(() => res({ id: 123, login: "user" }), 1000),
        );

        return (
            <>
                <SSRUser value={data} />
            </>
        );
    };
    const page = await Page();
    render(page);

    function Client() {
        const id = useUserId();
        return <p>userId {id}</p>;
    }
    const { findByText } = render(<Client />);

    await findByText("userId 123");
});
