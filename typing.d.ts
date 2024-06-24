type KeyCapitalize<K> = Capitalize<K & string>;

type Maybe<T> = T | undefined | null;

type ValueOf<T> = T[keyof T];

type Entries<T> = [keyof T extends string ? string : undefined, ValueOf<T>][];

type TIgnored = readonly any[] | Date;

type Flatten<T extends object> = object extends T
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
