"use client";
import { FeedPage } from "@/types/feed";
import { useState, useEffect } from "react";

type FeedProps<T> = {
  fetchPage: (cursor?: string) => Promise<FeedPage<T>>;
  renderItem: (
    item: T,
    helpers: {
      removeItem: (key: string) => void;
    },
  ) => React.ReactNode;
  getKey: (item: T) => string;
};

export default function Feed<T>({
  fetchPage,
  renderItem,
  getKey,
}: FeedProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = nextCursor !== null;

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => getKey(item) !== key));
  }

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);

        const page = await fetchPage();

        setItems(page.items);
        setNextCursor(page.nextCursor ?? null);
      } catch (err) {
        console.error("[Feed] loadInitial failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load feed.");
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [fetchPage]);

  async function loadMore() {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      setError(null);

      const page = await fetchPage(nextCursor ?? undefined);

      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor ?? null);
    } catch (err) {
      console.error("[Feed] loadMore failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load more posts.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {items.map((item) => {
        const key = getKey(item);

        return <div key={key}>{renderItem(item, { removeItem })}</div>;
      })}
      {loading && <p>Loading...</p>}
      {hasMore && !loading && <button onClick={loadMore}>Load More</button>}
      {error && <p>{error}</p>}
    </div>
  );
}
