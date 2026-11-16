import { useEffect, useState } from "react";

// Hook صغير بيدّي لكل صفحة حالات: loading / error / data، ودالة reload لزرار "Try again".
// استخدام: const { data, loading, error, reload } = useAsync(() => getJobs(), []);
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false; // لو المستخدم سابك الصفحة قبل ما الطلب يخلص منحدّثش الـ state
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: "" }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
