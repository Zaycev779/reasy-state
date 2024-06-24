type IName = string;
type IRecord = Maybe<string | number | boolean | any> | Array<IStore>;

type IStore = { [k: IName]: IRecord | IStore };

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

type IGenerateFn<T, N> = ISetFunc<T, N> & IHook<T, N>;

type IGenerate<T extends IStore> = IGenerateFn<Flatten<T>, ''>;
