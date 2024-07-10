# Reast Easy State

Reast Easy State is simple state management for React

Reasy-state allows you to easily work with your state without creating selectors or worrying about re-renders, thanks to the fact that each object element has its own hook for getting the value, get/set functions and mutators

## Installation

To install the latest stable version, run the following command:

```shell
npm install reasy-state
```

## Usage example

### Root

Components that use recoil state need RecoilRoot to appear somewhere in the parent tree. A good place to put this is in your root component:

```jsx
import React from 'react';
import { StateRoot } from 'reasy-state';

function App() {
  return (
    <StateRoot>
      <Components />
      ...
    </StateRoot>
  );
}
```

### Create a state

Create state and export necessary functions

The function names will be generated automatically, depending on your object. ( get*, set* and use\*)
The storage name must have a unique name

```jsx
// store.ts

import { createState } from 'reasy-state';

const userStore = {
  id: 1,
  name: 'User Name',
  settings: {
    notification: {
      message: true,
    },
  },
};

export const {
  getUserStoreId,
  useUserStoreName,
  useUserStoreSettingsNotificationMessage,
  setUserStoreSettingsNotificationMessage,
} = createState({ userStore });
```

### Use exported functions in your components

```jsx
// user.tsx

import { getUserStoreId, useUserStoreName } from './store';

const UserComponent = () => {
  const userName = useUserStoreName();
  return (
    <div>
      <p onClick={() => console.log('User ID:', getUserStoreId())}>
        {userName}
      </p>
    </div>
  );
};
```

```jsx
// setting.tsx

import {
  setUserStoreSettingsNotificationMessage,
  useUserStoreSettingsNotificationMessage,
} from './store';

const SettingsNotificationComponent = () => {
  const checked = useUserStoreSettingsNotificationMessage();

  const onChange = () =>
    setUserStoreSettingsNotificationMessage((prev) => !prev);

  return (
    <>
      <span>Notification</span>
      <input type='checkbox' checked={checked} onChange={onChange} />
    </>
  );
};
```

### Mutators

You can use 'mutators' to export functions. You can also use closures and async functions inside mutators.
Use a "set" function that takes a new value, or a function that takes the old value as a parameter and returns a new value, to change the state of the current object in the state. "set" will return you the new state of the object.
Use a "get" function for async mutators, for get previous object value, or use second function argument

```jsx
mutators: {
  [functionName]: ({set, get}, previousValue) => ...
}
```

```jsx
// store.ts
import { createState, CreateState } from 'reasy-state';

type UserStore = {
  id: number,
  data: {
    rating: number,
    mutators: {
      clear: void, // clear function
      inc: void, // increment function
      dec: Promise<boolean>, // decrement async function
      add: (value: number) => void, // add value function with arg
      remove: (value: number) => Promise<string>, // remove value async function with arg
    },
  },
};

const userStore: CreateState<UserStore> = {
  id: 1,
  data: {
    rating: 0,
    mutators: {
      clear: ({ set }) => set({ rating: 0 }),
      inc: ({ set }, { rating }) => set({ rating: rating + 1 }),
      /* OR
      inc: ({ set, get }) => set({ rating: get().rating + 1 }),
      */
      dec: async ({ set, get }) => {
        await new Promise((f) => setTimeout(f, 1000));
        set({ rating: get().rating - 1 });
        return true;
      },
      /* OR
      dec: async ({ set }) => {
        await new Promise((f) => setTimeout(f, 1000));
        set(({ rating }) => ({ rating: rating - 1 }));
        return true;
      },
      */
      add:
        ({ set }, { rating }) =>
        (value) =>
          set({ rating: rating + value }),
      remove:
        ({ set, get }) =>
        async (value) => {
          await new Promise((f) => setTimeout(f, 1000));
          set({ rating: get().rating - value });
          return 'success';
        },
    },
  },
};

export const {
  userStoreDataClear,
  userStoreDataInc,
  userStoreDataDec,
  userStoreDataAdd,
  userStoreDataRemove,
  useUserStoreDataRating,
} = createState({ userStore });
```

```jsx
// rating.tsx
import {
  useUserStoreDataRating,
  userStoreDataAdd,
  userStoreDataClear,
  userStoreDataInc,
  userStoreDataDec,
  userStoreDataRemove,
} from './store.ts';

export const UserRating = () => {
  const rating = useUserStoreDataRating();

  return (
    <>
      <div>
        <button
          onClick={async () => {
            const response = await userStoreDataRemove(5);
            console.log(response); // "success"
            return response;
          }}
        >
          -5
        </button>
        <button
          onClick={async () => {
            const response = await userStoreDataDec();
            console.log(response); // true
            return response;
          }}
        >
          -
        </button>
        <span>{rating}</span>
        <button onClick={userStoreDataInc}>+</button>
        <button onClick={() => userStoreDataAdd(5)}>+5</button>
      </div>
      <button onClick={userStoreDataClear}>Clear</button>
    </>
  );
};
```

Also, you can avoid specifying mutator types explicitly by using currying

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
  userStoreDataClear, // return new rating value
  useUserStoreDataRating,
} = createState<UserStore>()({
  userStore: {
    id: 1,
    data: {
      rating: 0,
      mutators: {
        clear: ({ set }) => set({ rating: 0 }).rating,
      },
    },
  },
});
```
