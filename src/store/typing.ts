type IName = string;
export type IRecord = Maybe<string | number | boolean | any> | Array<IStore>;

export type IStore = { [k: IName]: IRecord | IStore };

type ISetFunc<T, N> = {
  [P in keyof T as `set${N extends string
    ? KeyCapitalize<N>
    : ''}${KeyCapitalize<P>}`]: (value: T[P] | ((prev: T[P]) => T[P])) => void;
};

type IHook<T, N> = {
  [P in keyof T as `use${N extends string
    ? KeyCapitalize<N>
    : ''}${KeyCapitalize<P>}`]: () => T[P];
};

export type IGenerateFn<T, N> = ISetFunc<T, N> & IHook<T, N>;

export type IGenerate<T extends IStore> = IGenerateFn<Flatten<T>, ''>;
