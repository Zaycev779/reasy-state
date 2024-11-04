[![Build Status](https://img.shields.io/github/actions/workflow/status/Zaycev779/reasy-state/build.js.yml?branch=main&style=flat&colorA=0066CC&colorB=FFCC00)](https://github.com/Zaycev779/reasy-state/actions)
[![Build Size](https://img.shields.io/bundlephobia/minzip/reasy-state?cacheSeconds=3600&label=bundle%20size&style=flat&colorA=0066CC&colorB=FFCC00)](https://bundlephobia.com/result?p=reasy-state)
[![Version](https://img.shields.io/npm/v/reasy-state?style=flat&colorA=0066CC&colorB=FFCC00)](https://www.npmjs.com/package/reasy-state)
[![Downloads](https://img.shields.io/npm/dt/reasy-state.svg?style=flat&colorA=0066CC&colorB=FFCC00)](https://www.npmjs.com/package/reasy-state)

# Reast Easy State

Reast Easy State is simple state management for React

Reasy-state allows you to easily work with your state without creating selectors or worrying about re-renders,
by having each object or [array](#arrays) element have its own hook for getting the value, get/set functions and mutators.
It is also possible save state to [storage](#storage) to initialize the state in the [server side component](#usage-in-ssr-components-warning-experemental)

## Installation

To install the latest stable version, run the following command:

```shell
npm install reasy-state
```

## Usage example

### Create a state

Create state and export necessary functions

The function names will be generated automatically, depending on your object. ( `get*`, `set*`, `use*` and `reset`)

```jsx
// store.ts

import { createState } from "reasy-state";

const userStore = {
    id: 1,
    name: "User Name",
    settings: {
        notification: true,
    },
};

export const {
    getUserStoreId,
    useUserStoreName,
    useUserStoreSettingsNotification,
    setUserStoreSettingsNotification,
    reset,
} = createState({ userStore });
```

### Use exported functions in your components

```jsx
// user.tsx

import { getUserStoreId, useUserStoreName, reset } from "./store";

const UserComponent = () => {
    const userName = useUserStoreName();

    return (
        <div>
            <p onClick={() => console.log("User ID:", getUserStoreId())}>
                {userName}
            </p>
            <button onClick={reset}>Reset store</button>
        </div>
    );
};
```

```jsx
// setting.tsx

import {
    setUserStoreSettingsNotification,
    useUserStoreSettingsNotification,
} from "./store";

const SettingsNotificationComponent = () => {
    const checked = useUserStoreSettingsNotification();

    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={() => setUserStoreSettingsNotification((prev) => !prev)}
        />
    );
};
```

### Mutators

You can use `mutators` to export functions. You can also use closures and async functions inside mutators.
Use a `set` or `patch` function that takes a new value, or a function that takes the old value as a parameter and returns a new value, to change the state of the current object in the state. `set` / `patch` will return you the new state of the object.
Use a `get` function for async mutators, for get previous object value, or use second function argument

```jsx
mutators: {
  [functionName]: ({set, patch, get}, previousValue) => ...
}
```

```jsx
// store.ts
import { createState, CreateState } from "reasy-state";

type State = CreateState<{ value: number; mutators: { inc: void } }>;

export const { useValue, inc } = createState<State>({
    value: 1,
    mutators: {
        inc: ({ set }, { value }) => set({ value: value + 1 }),
    },
});
```

```jsx
// page.tsx
import { useValue, inc } from "./store.ts";

export const Page = () => {
    const value = useValue();

    return (
        <>
            <div>value: {value}</div>
            <button onClick={() => inc()}>inc</button>
        </>
    );
};
```

Also, you can avoid specifying mutator types explicitly by using currying, and also use nested mutators

```jsx
// store.ts
import { createState } from 'reasy-state';

type UserStore = {
  userStore: {
    id: number;
    data: {
      rating: number;
    };
  };
};

export const {
  userStoreDataClear,
  useUserStoreDataRating,
} = createState<UserStore>()({
  userStore: {
    id: 1,
    data: {
      rating: 1,
      mutators: {
        clear: ({ set }) => set({ rating: 0 }).rating, // return 0
      },
    },
  },
});
```

Async mutators

```jsx
// store.ts
import { createState, CreateState } from "reasy-state";

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
```

```jsx
// page.tsx
import { useValue, inc } from "./store.ts";

export const Page = () => {
    const value = useValue();
    const onClick = () =>
          add(1).then((value) => console.log("new value = ", value));

    return (
        <>
            <div>value: {value}</div>
            <button onClick={onClick}>add async</button>
        </>
    );
};
```

### Undefined params

You can use functions for undefined parameters using the `$` sign

```jsx
// store.ts
type UserStore = {
    id: number,
    data?: {
        rating: number,
    },
};
const userStore: CreateState<UserStore> = {
    id: 1,
};

export const { useUserStore$data$rating } = createState({ userStore });
```

### Arrays

You can use arrays parameters functions using the `$` sign

For array element `set`, `get` and `use` functions, you can use a filter to specify which elements you need to get or change

```jsx
get`[...functionName]`(filterFunction?);
use`[...functionName]`(filterFunction?);
set`[...functionName]`(filterFunction, newValue);
```

```jsx
// store.ts

type UserStore = {
    id: number,
    subscribers: {
        id: number,
        rating: number,
    }[],
};

const userStore: CreateState<UserStore> = {
    id: 1,
    subscribers: [
        { id: 2, rating: 10 },
        { id: 3, rating: 12 },
    ],
};

export const {
    useUserStoreSubscribers$rating,
    setUserStoreSubscribers$rating,
} = createState({ userStore });
```

```jsx
export const Ratings = () => {
    const ratings = useUserStoreSubscribers$rating(({ rating }) => rating);

    const add = () =>
        setUserStoreSubscribers$rating(
            ({ id }) => id === 2,
            (prev) => prev + 1,
        );

    const clear = () => setUserStoreSubscribers$rating(() => true, 0);

    return (
        <div>
            <p>Positive ratings = {ratings.join(",")}</p>
            <button onClick={add}>Add rating for id 2</button>
            <button onClick={clear}>Clear rating for all</button>
        </div>
    );
};
```

### Usage in ssr components :warning: (experemental)

You can initialize your state or part of it in a server component like this:

```jsx
//store.ts
'use client';

import { createState } from 'reasy-state';

type Store = {
    user: {
        id: number;
        name: string;
    };
};

export const { use$user$id, get$user$id, ssr: { SSR$user } } = createState<Store>()();
```

```jsx
//page.tsx
"use server";

export default async function ServerPage() {
    const data = await getUser("username"); // data = {id, name}
    return (
        <>
            <SSR$user value={data} />
            <ClientPage />
        </>
    );
}
```

```jsx
"use client";

import { get$user$id, use$user$id } from "./store";

export const ClientPage = () => {
    const id = use$user$id();
    return <p>User id = {id}</p>;
};
```

### Storage

You can save the state in the store( `localStorage` (default), `sessionStorage` )
To do this, specify a unique `key` and configure saving if necessary

```jsx
    const { ... } = createState(
        { store: { value: "value" } },
        { key: "storage_state_1", storage: true }
    );
```

:warning: If SSR is used together with storage, the latter will be initialized only after the component is rendered to avoid hydration warning.
To do this, specify the `ssr: true` parameter.

```jsx
    const { ... } = createState(
        { store: { value: "value" } },
        { key: "storage_state_2", storage: true, ssr: true }
    );
```

If necessary, you can mutate the data on read and write like this (This can be useful when using momentjs for example):

```jsx
    const store = { id: 1, date: moment() };

    const { ... } = createState(
        { store },
        {
            key: "session_storage_date_1",
            storage: {
                type: sessionStorage,
                mutators: {
                    store: {
                        date: (mutate) =>
                            mutate({
                                put: (prev) => prev.toISOString(),
                                get: (prev) => moment(prev),
                            }),
                    },
                },
            },
        },
    );
```
