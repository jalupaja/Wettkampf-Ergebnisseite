// Project-level declaration for uuid to silence TypeScript server when @types/uuid is not installed
declare module 'uuid' {
  export function v1(): string;
  export function v4(): string;
  const uuid: {
    v1: typeof v1;
    v4: typeof v4;
  };
  export default uuid;
}
