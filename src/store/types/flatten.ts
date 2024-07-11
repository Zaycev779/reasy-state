import { KeyCapitalize } from './index';

export type Flatten<TValue> = CollapseEntries<
  CreateObjectEntries<TValue, TValue>
>;

type Entry = { key: string; value: unknown };
type EmptyEntry<TValue> = { key: ''; value: TValue };
type ExcludedTypes = Set<unknown> | Map<unknown, unknown>;
type ArrayEncoder = `[${bigint}]`;

type EscapeArrayKey<TKey extends string> =
  TKey extends `${infer TKeyBefore}.${ArrayEncoder}${infer TKeyAfter}`
    ? EscapeArrayKey<`${TKeyBefore}${KeyCapitalize<ArrayEncoder>}${KeyCapitalize<TKeyAfter>}`>
    : TKey;

type CollapseEntries<TEntry extends Entry> = {
  [E in TEntry as EscapeArrayKey<E['key']>]: E['value'];
};

type CreateArrayEntry<TValue, TValueInitial> = OmitItself<
  TValue extends unknown[] ? { [k: ArrayEncoder]: TValue[number] } : TValue,
  TValueInitial
>;

type OmitItself<TValue, TValueInitial> = TValue extends TValueInitial
  ? EmptyEntry<TValue>
  : OmitExcludedTypes<TValue, TValueInitial>;

type OmitExcludedTypes<TValue, TValueInitial> = TValue extends ExcludedTypes
  ? EmptyEntry<TValue>
  : CreateObjectEntries<TValue, TValueInitial>;

type CreateObjectEntries<TValue, TValueInitial> = TValue extends {
  [K: string]: infer U;
}
  ? {
      [TKey in keyof TValue]-?: TKey extends string
        ? CreateArrayEntry<
            TValue[TKey],
            TValueInitial
          > extends infer TNestedValue
          ? TNestedValue extends Entry
            ? TNestedValue['key'] extends ''
              ? {
                  key: TKey;
                  value: TNestedValue['value'];
                }
              :
                  | {
                      key: `${TKey}${KeyCapitalize<TNestedValue['key']>}`;
                      value: TNestedValue['value'];
                    }
                  | {
                      key: TKey;
                      value: TValue[TKey];
                    }
            : never
          : never
        : never;
    }[keyof TValue]
  : EmptyEntry<TValue>;
