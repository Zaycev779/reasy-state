import { KeyCapitalize, Maybe } from './index';
import { Flatten } from './flatten';

export type UpdateType = 'set' | 'patch';
export type IRecord = Maybe<string | number | boolean | object>;

type Mutators = 'mutators';

export type CreateState<T, PT = T, D = PT> = T extends {
  [K: string]: unknown;
}
  ? {
      [K in keyof T as K extends Mutators
        ? K & Mutators
        : K]: K extends Mutators
        ? MutatorsTyping<T>
        : WithMutators<CreateState<T[K], D, T>>;
    }
  : T;

type WithoutMutators<T> = T extends {
  [K: string]: unknown;
}
  ? Omit<
      {
        [K in keyof T]: WithoutMutators<T[K]> extends infer R ? R : never;
      },
      Mutators
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
  set: (
    prev:
      | WithoutMutators<PT>
      | ((prev: WithoutMutators<PT>) => WithoutMutators<PT>)
  ) => WithoutMutators<PT> & void;
  patch: (
    prev:
      | WithoutMutators<PartialObject<PT>>
      | ((prev: WithoutMutators<PT>) => WithoutMutators<PartialObject<PT>>)
  ) => WithoutMutators<PT> & void;

  get: () => WithoutMutators<PT>;
};

type MutatorsTyping<PT> = PT extends { mutators?: infer T }
  ? {
      [K in keyof T]: T[K] extends (...args: infer D) => Promise<void>
        ? (
            s: SetFn<PT>,
            prev: WithoutMutators<PT>
          ) => (...args: D) => ReturnType<T[K]>
        : T[K] extends (...args: infer D) => void
        ? (
            fn: SetFn<PT>,
            prev: WithoutMutators<PT>
          ) => (...args: D) => ReturnType<T[K]>
        : (fn: SetFn<PT>, prev: WithoutMutators<PT>) => T[K];
    }
  : never;

export type WithMutators<T> = T extends {
  [K: string]: unknown;
}
  ? T extends { mutators: any }
    ? T
    : {
        [K in keyof T]: K extends Mutators
          ? T[K]
          : WithMutators<T[K]> extends infer Y
          ? Y
          : never;
      } & {
        mutators?: {
          [k: string]: (val: SetFn<T>, prev: T) => any;
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
      [K in keyof T]: SetMutators<T[K]> extends infer Y ? Y : never;
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

export type CreateFunctionResult<T> = PickMutators<SetMutators<T>>;

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
