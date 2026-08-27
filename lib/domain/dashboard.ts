export const PAGE_SIZE_MAX = 100;

export function pagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

export function emptyPage(page: number, pageSize: number) {
  return { items: [], page, pageSize, total: 0, hasMore: false };
}
