import { useEffect } from "react";

// بيغيّر عنوان التاب لكل صفحة (مفيد للـ accessibility وللـ History)
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · StepUp` : "StepUp";
  }, [title]);
}
