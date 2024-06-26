# Reast Easy State

Reast Easy State is simple state management for React

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
