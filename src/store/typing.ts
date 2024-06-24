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

export type KeyCapitalize<K> = Capitalize<K & string>;

export type Maybe<T> = T | undefined | null;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = [
  keyof T extends string ? string : undefined,
  ValueOf<T>
][];

export type TIgnored = readonly any[] | Date;

export type Flatten<T extends object> = object extends T
  ? object
  : {
      [K in keyof T]-?: (
        x: NonNullable<T[K]> extends infer V
          ? V extends object
            ? V extends TIgnored
              ? Pick<T, K>
              : Flatten<V> extends infer FV
              ? {
                  [P in keyof FV as `${Extract<
                    KeyCapitalize<K>,
                    string | number
                  >}${Extract<KeyCapitalize<P>, string | number>}`]: FV[P];
                } & Pick<T, K>
              : never
            : Pick<T, K>
          : never
      ) => void;
    } extends Record<keyof T, (y: infer O) => void>
  ? O extends infer U
    ? { [K in keyof O]: O[K] }
    : never
  : never;
