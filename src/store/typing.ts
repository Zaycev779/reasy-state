export type IRecord = Maybe<string | number | boolean | object>;

export type IStore<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: IRecord | IStore<T> | Array<IRecord>; // | (<D extends S = S>(s: S) => void); // | (<D extends S>(s: D) => void);
};

type ISetFunc<T> = {
  [P in keyof T as T[P] extends Function
    ? `${P & string}`
    : `set${KeyCapitalize<P>}`]: T[keyof T] extends Function
    ? null
    : (value: T[P] | ((prev: T[P]) => T[P])) => void;
};

type IHook<T> = {
  [P in keyof T as T[P] extends Function
    ? never
    : `use${KeyCapitalize<P>}`]: () => T[P];
};

type IGet<T> = {
  [P in keyof T as T[P] extends Function
    ? never
    : `get${KeyCapitalize<P>}`]: () => T[P];
};

export type IGenerateFn<T> = ISetFunc<T> & IHook<T> & IGet<T>;

export type IGenerate<T> = IGenerateFn<Flatten<T>>;

export type KeyCapitalize<K> = Capitalize<K & string>;

export type Maybe<T> = T | undefined | null;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = [
  keyof T extends string ? string : undefined,
  ValueOf<T>
][];

export type TIgnored = readonly any[] | Function;

export type Flatten<T> = IStore extends T
  ? never
  : {
      [K in keyof T]-?: (
        x: NonNullable<T[K]> extends infer V
          ? T[K] extends IStore
            ? T[K] extends TIgnored
              ? Pick<T, K>
              : Flatten<V> extends infer FV
              ? {
                  [P in keyof FV as FV[P] extends Function
                    ? `${K & string}${Extract<
                        KeyCapitalize<P>,
                        string | number
                      >}`
                    : `${Extract<KeyCapitalize<K>, string | number>}${Extract<
                        KeyCapitalize<P>,
                        string | number
                      >}`]: FV[P];
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
