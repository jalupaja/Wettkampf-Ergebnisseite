// Minimal declaration to satisfy TypeScript language server for the 'uuid' ESM package
declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  const _default: {
    v1: typeof v1;
    v4: typeof v4;
  };
  export default _default;
}
