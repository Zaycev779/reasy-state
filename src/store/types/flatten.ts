import { KeyCapitalize } from "./index";

export type Flatten<TValue> = CollapseEntries<
    CreateEntries<TValue, TValue, "">
>;

type Entry = { key: string; value: unknown };
type EmptyEntry<TValue> = { key: ""; value: TValue };
type ExcTypes = Set<unknown> | Map<unknown, unknown>;

type EscapeArrayKey<TKey extends string> =
    TKey extends `${infer TKeyBefore}[${bigint}]`
        ? never
        : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
        ? TKeyBefore extends `${infer X}[]${infer Y}`
            ? never // TODO flatten arrays
            : EscapeArrayKey<`${TKeyBefore}[]${TKeyAfter}`>
        : TKey;

type EscapeArray<
    E,
    TKey extends string,
    TValue,
> = TKey extends `${string}[${bigint}]`
    ? TValue
    : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
    ? E extends { key: `${TKeyBefore}`; value?: infer V extends any[] }
        ? (f?: (v: V[number]) => any | boolean) => TValue
        : never
    : TValue;

type CollapseEntries<TEntry extends Entry> = {
    [E in TEntry as EscapeArrayKey<E["key"]>]: EscapeArray<
        TEntry,
        E["key"],
        E["value"]
    >;
};

type CreateEntry<TValue, TInit, TPrevKey> = OmitItself<
    TValue extends unknown[] ? { [k: `[${bigint}]`]: TValue[number] } : TValue,
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
> = undefined extends TValue[TKey]
    ? TKeyNameParse<TKey>
    : THas$<TPrevKey, TKeyNameParse<TKey>, V>;

type THas$<K, T1, T2> = K extends `$` ? T1 : T2;

type TKeyNameParse<TKey extends string> = `$${TKey extends `$${infer Y}`
    ? Y
    : TKey}`;

type CreateVal<K, V> = {
    key: K;
    value: V;
};

type CreateEntries<TValue, TInit, TPrevKey = ""> = TValue extends {
    [K: string]: infer U;
}
    ? {
          [TKey in keyof TValue]-?: TKey extends string
              ? CreateEntry<
                    TValue[TKey],
                    TInit,
                    THas$<
                        TPrevKey,
                        TPrevKey,
                        undefined extends TValue[TKey]
                            ? `$`
                            : [] extends TValue[TKey]
                            ? `$`
                            : TKey
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
                                      >}${undefined extends TValue[TKey]
                                          ? TKeyNameParse<TNested["key"]>
                                          : THas$<
                                                TPrevKey,
                                                TKeyNameParse<TNested["key"]>,
                                                KeyCapitalize<TNested["key"]>
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
