import { KeyCapitalize, ValueOf } from "./index";
import { Flatten } from "./flatten";

export const UpdateType = {
    S: "set",
    P: "patch",
} as const;

export const GeneratedType = {
    G: "get",
    S: "set",
    U: "use",
    R: "reset",
    H: "SSR",
    h: "ssr",
} as const;

export const StorageType = {
    G: "get",
    P: "put",
} as const;

type M = "mutators";

export type CreateState<T, PT = T, D = PT> = T extends {
    [K: string]: unknown;
}
    ? WithM<{
          [K in keyof T as K extends M ? K & M : K]: K extends M
              ? MTyping<T>
              : WithM<CreateState<T[K], D, T>>;
      }>
    : T;

type WithoutM<T> = T extends {
    [K: string]: unknown;
}
    ? Omit<
          {
              [K in keyof T]: WithoutM<T[K]> extends infer R ? R : never;
          },
          M
      >
    : T;

type PartialObject<T> = Partial<
    T extends {
        [K: string]: unknown;
    }
        ? {
              [K in keyof T]: PartialObject<T[K]> extends infer R ? R : never;
          }
        : T
>;

type SetFn<PT> = {
    [UpdateType.S]: (prev: Param<PT>) => PT & void;
    [UpdateType.P]: (prev: Param<PT, PartialObject<PT>>) => PT & void;
    get: () => PT;
};

type MTyping<PT, WPT = WithoutM<PT>> = PT extends {
    [k in M]?: infer T;
}
    ? {
          [K in keyof T]: T[K] extends (...args: infer D) => Promise<void>
              ? (s: SetFn<WPT>, prev: WPT) => (...args: D) => ReturnType<T[K]>
              : T[K] extends (...args: infer D) => void
              ? (fn: SetFn<WPT>, prev: WPT) => (...args: D) => ReturnType<T[K]>
              : (fn: SetFn<WPT>, prev: WPT) => T[K];
      }
    : never;

export type WithM<T> = T extends {
    [K: string]: unknown;
}
    ? T extends { [k in M]: any }
        ? T
        : {
              [K in keyof T]: K extends M
                  ? T[K]
                  : WithM<T[K]> extends infer Y
                  ? Y
                  : never;
          } & {
              [K in M]?: {
                  [k: string]: (
                      val: SetFn<WithoutM<T>>,
                      prev: WithoutM<T>,
                  ) => any;
              };
          }
    : T;

type SetM<T> = T extends (...args: any) => infer D
    ? D extends Promise<infer S>
        ? S extends Function
            ? S
            : () => Promise<S>
        : D extends Function
        ? D
        : () => D
    : T extends {
          [K in string]: unknown;
      }
    ? {
          [K in keyof T]: SetM<T[K]> extends infer Y ? Y : never;
      }
    : T;

type PickObj<T> = {
    [K in keyof T as K extends M ? never : K]: PickM<T[K]>;
};
type PickM<T> = T extends {
    [K: string]: unknown;
}
    ? (T extends { [k in M]?: unknown }
          ? [] extends T[M]
              ? unknown
              : T[M]
          : unknown) &
          PickObj<T>
    : T;

export type CreateResult<T> = PickM<SetM<T>>;

export type IStore<T = Record<string, any>> = T;

type IStaticFunc<T, U, N extends ValueOf<typeof GeneratedType>> = {
    [P in keyof T as keyof U extends `$${P extends string ? string : never}`
        ? T extends U
            ? FuncName<T, P, N>
            : never
        : FuncName<T, P, N>]: IStaticRes<T, P, N>;
} & {
    [P in keyof U as P extends `${string | ""}$${string}`
        ? FuncName<U, P, N>
        : never]: IStaticRes<U, P, N>;
};

type IStaticRes<
    T,
    P extends keyof T,
    N extends ValueOf<typeof GeneratedType>,
> = N extends typeof GeneratedType.S ? FuncSet<T, P> : FuncGet<T, P>;

type FName<P> = IsArray<P, never, Uncapitalize<P & string>>;
type IFn<T, U> = {
    [P in keyof T as T[P] extends Function
        ? FName<P>
        : never]: P extends keyof U ? () => U[P] : T[P];
};

type AnyFunc = (...args: any) => any;

type FuncName<
    T,
    P extends keyof T,
    N extends ValueOf<typeof GeneratedType>,
> = T[P] extends Function | void | AnyFunc
    ? P extends `${infer X}[]${infer Y}`
        ? `${N}${KeyCapitalize<X>}${KeyCapitalize<Y>}`
        : never
    : `${N}${KeyCapitalize<P>}`;

type FuncGet<T, P extends keyof T> = IsArray<
    P,
    T[P] extends (arg: infer A) => infer D
        ? (
              arg?: A,
          ) =>
              | (D extends any[] ? D : D[])
              | (P extends `${string}$${string}[]${string}` ? undefined : never)
        : never,
    () => T[P] | (P extends `${string}$${string}` ? undefined : never)
>;

type FuncSet<T, P extends keyof T> = IsArray<
    P,
    T[P] extends (arg: infer A) => infer D
        ? (arg: A, v: Param<D>) => void
        : never,
    T[keyof T] extends Function ? never : (value: Param<T[P]>) => void
>;
type Param<T, D = T> = D | ((prev: T) => D);

type IsArray<P, T1, T2> = P extends `${infer X}[]${infer Y}` ? T1 : T2;

type IResetFunc = {
    [GeneratedType.R]: () => void;
};

export type IGenerateFn<T, U> = IStaticFunc<T, U, typeof GeneratedType.G> &
    IStaticFunc<T, U, typeof GeneratedType.S> &
    IStaticFunc<T, U, typeof GeneratedType.U> &
    IFn<T, U>;

export type IGenerate<T, U = unknown> = IGenerateFn<Flatten<T>, Flatten<U>> &
    IResetFunc &
    ISSR<Flatten<T>, Flatten<U>>;

export type ISSR<T, U> = { ssr: ISSRFunc<T, U> };

type ISSRComp<T> = React.FC<{ value: T }>;

type ISSRFunc<
    T,
    U,
    N extends ValueOf<typeof GeneratedType> = typeof GeneratedType.H,
> = {
    [P in keyof T as keyof U extends `$${P extends string ? string : never}`
        ? T extends U
            ? T[P] extends AnyFunc
                ? never
                : FuncName<T, P, N>
            : never
        : FuncName<T, P, N>]: ISSRComp<T[P]>;
} & {
    [P in keyof U as U[P] extends AnyFunc
        ? never
        : P extends `${string | ""}$${string}`
        ? FuncName<U, P, N>
        : never]: ISSRComp<U[P]>;
};

export type Options<T> = {
    /** Unique store key */
    key: string;
    /** Storage params
     * @default false
     */
    storage?: boolean | StorageOptions<T>;
    /** Specify ssr: true if using state with storage in server component
     * @default false
     */
    [GeneratedType.h]?: boolean;
};

export type StorageOptions<T> = {
    /** Storage type ( localStorage, sessionStorage )
     * @default localStorage
     */
    type: Storage;
} & {
    [k in string as M]?: WithoutM<T> extends infer U
        ? StorageM<U>
        : never | undefined;
};

type StorageM<T> = T extends {
    [k in string]?: unknown;
}
    ? {
          [K in keyof T]?: StorageM<T[K]> extends infer R ? R : never;
      }
    : T extends undefined
    ? never
    : FStorage<T>;

type FStorage<T> = {
    (
        /**  @argument mutate data before save in storage */
        mutate: <S>(args: FArgs<T, S>) => any,
    ): any;
};

type FArgs<T, S> = {
    /**  @argument  mutate data before save in storage */
    [StorageType.P]?: (prev: T) => S;
    /**  @argument  mutate data after load from storage */
    [StorageType.G]?: (prev: S) => any;
};

export type FType = <A extends [], R>(...args: A) => R;
