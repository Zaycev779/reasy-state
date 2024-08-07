import { KeyCapitalize, Maybe } from './index';
import { Flatten } from './flatten';

export type UpdateType = 'set' | 'patch';
export type IRecord = Maybe<string | number | boolean | object>;
export enum GeneratedType {
  GET = 'get',
  SET = 'set',
  USE = 'use',
}
type M = 'mutators';

export type CreateState<T, PT = T, D = PT> = T extends {
  [K: string]: unknown;
}
  ? {
      [K in keyof T as K extends M ? K & M : K]: K extends M
        ? MTyping<T>
        : WithM<CreateState<T[K], D, T>>;
    }
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
  set: (prev: Param<PT>) => PT & void;
  patch: (prev: Param<PT, PartialObject<PT>>) => PT & void;
  get: () => PT;
};

type MTyping<PT, WPT = WithoutM<PT>> = PT extends {
  mutators?: infer T;
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
  ? T extends { mutators: any }
    ? T
    : {
        [K in keyof T]: K extends M
          ? T[K]
          : WithM<T[K]> extends infer Y
          ? Y
          : never;
      } & {
        mutators?: {
          [k: string]: (val: SetFn<T>, prev: T) => any;
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
      [K: string]: unknown;
    }
  ? {
      [K in keyof T]: SetM<T[K]> extends infer Y ? Y : never;
    }
  : T;

type PickM<T> = T extends {
  [K: string]: unknown;
} & { mutators?: any }
  ? Omit<
      {
        [K in keyof T]: PickM<T[K]>;
      } & T[M],
      M
    >
  : T;

export type CreateFunctionResult<T> = PickM<SetM<T>>;

export type CreateFunction = {
  <T, U extends CreateFunctionResult<T>>(params: T): IGenerate<U>;
  <T>(): <U extends WithM<CreateState<T>>>(
    params: U
  ) => IGenerate<CreateFunctionResult<U>>;
};

export type IStore<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: IRecord | IStore<T> | Array<IRecord>;
};

type ISetFunc<T> = IStaticFunc<T, GeneratedType.SET>;

type IHook<T> = IStaticFunc<T, GeneratedType.USE>;

type IGet<T> = IStaticFunc<T, GeneratedType.GET>;

type IStaticFunc<T, N extends GeneratedType> = {
  [P in keyof T as FuncName<T, P, N>]: N extends GeneratedType.SET
    ? FuncSet<T, P>
    : FuncGet<T, P>;
};

type IFn<T> = {
  [P in keyof T as T[P] extends Function
    ? IsArray<P, never, Uncapitalize<P & string>>
    : never]: T[P];
};

type FuncName<
  T,
  P extends keyof T,
  N extends GeneratedType
> = T[P] extends Function
  ? P extends `${infer X}[]${infer Y}`
    ? `${N}${KeyCapitalize<X>}${KeyCapitalize<Y>}`
    : never
  : `${N}${KeyCapitalize<P>}`;

type FuncGet<T, P extends keyof T> = IsArray<
  P,
  T[P] extends (arg: infer A) => infer D ? (arg?: A) => D[] : never,
  () => T[P]
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

export type IGenerateFn<T> = ISetFunc<T> & IHook<T> & IGet<T> & IFn<T>;

export type IGenerate<T> = IGenerateFn<Flatten<T>>;
