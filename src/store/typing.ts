export type IRecord = Maybe<string | number | boolean | object>;

type Mutators = 'mutators';

export type CreateState<T, PT = T, D = PT> = T extends {
  [K: string]: unknown;
} & { mutators?: infer M }
  ? {
      [K in keyof T as K extends Mutators
        ? K & Mutators
        : K]: K extends Mutators
        ? MutatorsTyping<M, T>
        : WithMutators<CreateState<T[K], D, T>>;
    }
  : T;

type SetFn<PT> = {
  set: (
    prev:
      | Omit<PT, Mutators>
      | ((prev: Omit<PT, Mutators>) => Omit<PT, Mutators>)
  ) => Omit<PT, Mutators> & void;
};

type MutatorsTyping<T, PT> = {
  [K in keyof T]: T[K] extends (...args: infer D) => Promise<void>
    ? (s: SetFn<PT>) => (...args: D) => ReturnType<T[K]>
    : T[K] extends (...args: infer D) => void
    ? (fn: SetFn<PT>) => (...args: D) => ReturnType<T[K]>
    : (fn: SetFn<PT>) => T[K];
};

export type WithMutators<T> = T extends {
  [K: string]: unknown;
}
  ? T extends { mutators: any }
    ? T
    : {
        [K in keyof T]: WithMutators<T[K]>;
      } & {
        mutators?: {
          [k: string]: (val: SetFn<T>) => any;
        };
      }
  : T;

type SetMutators<T> = T extends (...args: any) => infer D
  ? D extends Promise<infer S>
    ? S extends Function
      ? S
      : () => Promise<S>
    : D extends Function
    ? D
    : () => D
  : T extends {
      [K: string]: unknown;
    }
  ? {
      [K in keyof T]: SetMutators<T[K]>;
    }
  : T;

type PickMutators<T> = T extends {
  [K: string]: unknown;
} & { mutators?: any }
  ? Omit<
      {
        [K in keyof T]: PickMutators<T[K]>;
      } & T[Mutators],
      Mutators
    >
  : T;

type CreateFunctionResult<T> = PickMutators<SetMutators<T>>;

export type CreateFunction = {
  <T, U extends CreateFunctionResult<T>>(params: T): IGenerate<U>;
  <T>(): <U extends WithMutators<CreateState<T>>>(
    params: U
  ) => IGenerate<CreateFunctionResult<U>>;
};

export type IStore<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: IRecord | IStore<T> | Array<IRecord>;
};

type ISetFunc<T> = {
  [P in keyof T as T[P] extends Function
    ? never
    : `set${KeyCapitalize<P>}`]: T[keyof T] extends Function
    ? never
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

type IFn<T> = {
  [P in keyof T as T[P] extends Function
    ? Uncapitalize<P & string>
    : never]: T[P];
};
export type IGenerateFn<T> = ISetFunc<T> & IHook<T> & IGet<T> & IFn<T>;

export type IGenerate<T> = IGenerateFn<Flatten<T>>;

export type KeyCapitalize<K> = Capitalize<K & string>;

export type Maybe<T> = T | undefined | null;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = [
  keyof T extends string ? string : undefined,
  ValueOf<T>
][];

export type TIgnored = readonly any[];

export type Flatten<T> = {
  [K: string]: unknown;
} extends T
  ? never
  : {
      [K in keyof T]-?: (
        x: NonNullable<T[K]> extends infer V
          ? T[K] extends {
              [K: string]: unknown;
            }
            ? T[K] extends TIgnored
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
