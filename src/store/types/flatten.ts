import { KeyCapitalize } from './index';

export type Flatten<TValue> = CollapseEntries<
  CreateObjectEntries<TValue, TValue>
>;

type Entry = { key: string; value: unknown };
type EmptyEntry<TValue> = { key: ''; value: TValue };
type ExcludedTypes = Set<unknown> | Map<unknown, unknown>;

type EscapeArrayKey<TKey extends string> =
  TKey extends `${infer TKeyBefore}[${bigint}]`
    ? never
    : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
    ? TKeyBefore extends `${infer X}[]${infer Y}`
      ? never // TODO flatten arrays
      : EscapeArrayKey<`${TKeyBefore}[]${TKeyAfter}`>
    : TKey;

type EscapeArrayValue<
  E,
  TKey extends string,
  TValue
> = TKey extends `${string}[${bigint}]`
  ? TValue
  : TKey extends `${infer TKeyBefore}$[${bigint}]${infer TKeyAfter}`
  ? E extends { key: `${TKeyBefore}`; value?: infer V extends any[] }
    ? (f?: (v: V[number]) => any | boolean) => TValue
    : never
  : TValue;

type CollapseEntries<TEntry extends Entry> = {
  [E in TEntry as EscapeArrayKey<E['key']>]: EscapeArrayValue<
    TEntry,
    E['key'],
    E['value']
  >;
};

type CreateArrayEntry<TValue, TValueInitial, TPrevKey> = OmitItself<
  TValue extends unknown[] ? { [k: `[${bigint}]`]: TValue[number] } : TValue,
  TValueInitial,
  TPrevKey
>;

type OmitItself<TValue, TValueInitial, TPrevKey> = TValue extends TValueInitial
  ? EmptyEntry<TValue>
  : OmitExcludedTypes<TValue, TValueInitial, TPrevKey>;

type OmitExcludedTypes<TValue, TValueInitial, TPrevKey> =
  TValue extends ExcludedTypes
    ? EmptyEntry<TValue>
    : CreateObjectEntries<TValue, TValueInitial, TPrevKey>;

type TKeyName<TKey extends string> = `$${TKey extends `$${infer Y}`
  ? Y
  : TKey}`;

type TNestedKeyName<TKey extends string> = `$${TKey extends `$${infer Y}`
  ? Y
  : TKey}`;

type CreateObjectEntries<
  TValue,
  TValueInitial,
  TPrevKey = ''
> = TValue extends {
  [K: string]: infer U;
}
  ? {
      [TKey in keyof TValue]-?: TKey extends string
        ? CreateArrayEntry<
            TValue[TKey],
            TValueInitial,
            TPrevKey extends `$`
              ? TPrevKey
              : undefined extends TValue[TKey]
              ? `$`
              : [] extends TValue[TKey]
              ? `$`
              : TKey
          > extends infer TNestedValue
          ? TNestedValue extends Entry
            ? TNestedValue['key'] extends ''
              ? {
                  key: `${undefined extends TValue[TKey]
                    ? TKeyName<TKey>
                    : TPrevKey extends `$`
                    ? TKeyName<TKey>
                    : TKey}`;
                  value: TNestedValue['value'];
                }
              :
                  | {
                      key: `${undefined extends TValue[TKey]
                        ? TKeyName<TKey>
                        : TPrevKey extends `$`
                        ? TKeyName<TKey>
                        : TKey extends `$${infer Y}`
                        ? Y
                        : TKey}${undefined extends TValue[TKey]
                        ? TNestedKeyName<TNestedValue['key']>
                        : TPrevKey extends `$`
                        ? TNestedKeyName<TNestedValue['key']>
                        : KeyCapitalize<TNestedValue['key']>}`;
                      value: TNestedValue['value'];
                    }
                  | {
                      key: `${undefined extends TValue[TKey]
                        ? TKeyName<TKey>
                        : TPrevKey extends `$`
                        ? TKeyName<TKey>
                        : TKey}`;
                      value: TValue[TKey];
                    }
            : never
          : never
        : never;
    }[keyof TValue]
  : EmptyEntry<TValue>;
