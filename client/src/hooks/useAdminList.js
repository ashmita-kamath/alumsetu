import { useSearchParams } from "react-router-dom";
import useApi from "./useApi";
import { toQuery } from "../services/api";

/**
 * Shared logic for the admin list pages (verifications, reports, users).
 *
 * Reads filters and the page number from the URL, loads
 * `${path}?filters&page&limit`, and gives back a setFilter() that
 * changes one filter and goes back to page 1.
 *
 *   const { data, loading, error, filters, setFilter, page, setPage, setData }
 *     = useAdminList("/admin/reports", { status: "pending" });
 */
const PAGE_SIZE = 20;

export default function useAdminList(path, defaults = {}) {
  const [params, setParams] = useSearchParams();

  const filters = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    filters[key] = params.get(key) ?? fallback;
  }
  const page = Number(params.get("page")) || 1;

  const { data, loading, error, setData, reload } = useApi(`${path}${toQuery({ ...filters, page, limit: PAGE_SIZE })}`);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.delete("page");
    setParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { data, loading, error, setData, reload, filters, setFilter, page, setPage };
}
