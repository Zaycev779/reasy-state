export type KeyCapitalize<K> = Capitalize<K & string>;
export type Maybe<T> = T | undefined | null;
export type ValueOf<T> = T[keyof T];
export type Entries<T> = [
  keyof T extends string ? string : undefined,
  ValueOf<T>
][];
