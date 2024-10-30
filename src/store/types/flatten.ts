import { KeyCapitalize } from "./index";

export type Flatten<TValue> = CollapseEntries<
    | CreateEntries<TValue, { [P in keyof TValue]-?: TValue[P] }, "">
    | EmptyEntry<TValue>
>;

type Entry = { key: string; value: unknown };
type EmptyEntry<TValue> = { key: ""; value: TValue };
type ExcTypes = Set<unknown> | Map<unknown, unknown>;
type ArrItem<T extends any> = T extends (infer E)[] ? E : never;

type EscapeArrayKey<TKey extends string> =
    TKey extends `${infer TKeyBefore}[${bigint}]`
        ? never
        : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
        ? TKeyBefore extends `${infer X}[]${infer Y}`
            ? TKeyAfter extends ""
                ? never
                : EscapeArrayKey<`${TKeyBefore}${TKeyAfter}`>
            : EscapeArrayKey<`${TKeyBefore}[]${TKeyAfter}`>
        : TKey;

type EscapeArray<
    E,
    D,
    TKey extends string,
    TValue,
> = TKey extends `${string}[${bigint}]`
    ? TValue
    : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
    ? TValue extends any
        ? E extends { key: `${TKeyBefore}`; value?: infer V extends any[] }
            ? ArrItem<E["value"]> extends never
                ? never
                : (f?: (v: ArrItem<E["value"]>) => any | boolean) => TValue
            : never
        : never
    : TValue;

type CollapseEntries<TEntry extends Entry> = {
    [E in TEntry as EscapeArrayKey<E["key"]>]: EscapeArray<
        TEntry,
        E,
        E["key"],
        E["value"]
    >;
};

type CreateEntry<TValue, TInit, TPrevKey> = OmitItself<
    TValue extends (infer X)[] ? { [k: `[${bigint}]`]: X } : TValue,
    TInit,
    TPrevKey
>;

type OmitItself<TValue, TInit, TPrevKey> = TValue extends TInit
    ? EmptyEntry<TValue>
    : OmitExcTypes<TValue, TInit, TPrevKey>;

type OmitExcTypes<TValue, TInit, TPrevKey> = TValue extends ExcTypes
    ? EmptyEntry<TValue>
    : CreateEntries<TValue, TInit, TPrevKey>;

type TKeyName<
    TValue,
    TKey extends keyof TValue & string,
    TPrevKey,
    V = TKey,
> = IsUndefined<
    TValue,
    TKey,
    TKeyNameParse<TKey>,
    THas$<TPrevKey, TKeyNameParse<TKey>, V>
>;

type THas$<K, T1, T2> = K extends `${string}$${string}` ? T1 : T2;

type TKeyNameParse<TKey extends string> = `$${TKey extends `$${infer Y}`
    ? Y
    : TKey}`;

type CreateVal<K, V> = {
    key: K;
    value: V;
};

export type IsUndefined<V, P extends keyof V, R1, R2> = {
    [S in keyof Pick<V, P>]: V[P];
} extends Record<P, V[P]>
    ? R2
    : R1;

type CreateEntries<TValue, TInit, TPrevKey = ""> = TValue extends {
    [K: string]: infer U;
}
    ? {
          [TKey in keyof TValue]-?: TKey extends string
              ? CreateEntry<
                    TValue[THas$<TKey, never, TKey>],
                    TInit,
                    THas$<
                        TPrevKey,
                        TPrevKey,
                        IsUndefined<
                            TValue,
                            TKey,
                            `$`,
                            TValue[TKey] extends Array<unknown> ? `$` : TKey
                        >
                    >
                > extends infer TNested
                  ? TNested extends Entry
                      ? TNested["key"] extends ""
                          ? CreateVal<
                                TKeyName<TValue, TKey, TPrevKey>,
                                TNested["value"]
                            >
                          :
                                | CreateVal<
                                      `${TKeyName<
                                          TValue,
                                          TKey,
                                          TPrevKey,
                                          TKey extends `$${infer Y}` ? Y : TKey
                                      >}${IsUndefined<
                                          TValue,
                                          TKey,
                                          TKeyNameParse<TNested["key"]>,
                                          THas$<
                                              TPrevKey,
                                              TKeyNameParse<TNested["key"]>,
                                              KeyCapitalize<TNested["key"]>
                                          >
                                      >}`,
                                      TNested["value"]
                                  >
                                | CreateVal<
                                      TKeyName<TValue, TKey, TPrevKey>,
                                      TValue[TKey]
                                  >
                      : never
                  : never
              : never;
      }[keyof TValue]
    : EmptyEntry<TValue>;
