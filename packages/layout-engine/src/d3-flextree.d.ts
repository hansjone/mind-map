declare module "d3-flextree" {
  type Accessor<T, R> = ((node: T) => R) | R;

  interface FlexLayout {
    (root: unknown): unknown;
    nodeSize(arg: Accessor<{ data: unknown }, [number, number]>): FlexLayout;
    spacing(arg: Accessor<unknown, number> | ((a: unknown, b: unknown) => number)): FlexLayout;
    children(arg: (d: unknown) => unknown[] | null | undefined): FlexLayout;
    hierarchy(data: unknown, children?: (d: unknown) => unknown[] | null | undefined): {
      each: (fn: (d: { depth: number; x: number; y: number; data: unknown }) => void) => void;
      x: number;
      y: number;
      depth: number;
      data: unknown;
    };
  }

  export function flextree(options?: Record<string, unknown>): FlexLayout;
}
