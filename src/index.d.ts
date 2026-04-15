import type { PluginCallback } from "alpinejs";

export interface VirtualListOptions<T = unknown> {
  items: T[];
  itemHeight?: number;
  estimateSize?: number;
  overscan?: number;
  as?: string;
  indexAs?: string;
  key?: keyof T | ((item: T, index: number) => string | number);
}

export interface VirtualRange {
  start: number;
  end: number;
  visibleStart: number;
  visibleEnd: number;
  totalHeight: number;
  offsetTop: number;
}

export declare function normalizeVirtualListOptions<T = unknown>(
  value?: VirtualListOptions<T> | T[],
): Required<Omit<VirtualListOptions<T>, "key">> &
  Pick<VirtualListOptions<T>, "key">;

export declare function getVirtualRange(input: {
  itemCount: number;
  itemHeight: number;
  viewportHeight: number;
  scrollTop: number;
  overscan?: number;
}): VirtualRange;

declare const virtualList: PluginCallback;
export default virtualList;
