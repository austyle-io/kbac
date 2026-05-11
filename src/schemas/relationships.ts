import { Type, type Static } from "typebox";

export const DependsOnProps = Type.Object({
  type: Type.String({ minLength: 1 }),
});
export type DependsOn = Static<typeof DependsOnProps>;

export const UsesProps = Type.Object({
  role: Type.String({ minLength: 1 }),
});
export type Uses = Static<typeof UsesProps>;

export const ComposesWithProps = Type.Object({
  pattern: Type.String({ minLength: 1 }),
});
export type ComposesWith = Static<typeof ComposesWithProps>;

export const ImplementsProps = Type.Object({});
export type Implements = Static<typeof ImplementsProps>;

export const BelongsToProps = Type.Object({});
export type BelongsTo = Static<typeof BelongsToProps>;

export const AppliesProps = Type.Object({});
export type Applies = Static<typeof AppliesProps>;
