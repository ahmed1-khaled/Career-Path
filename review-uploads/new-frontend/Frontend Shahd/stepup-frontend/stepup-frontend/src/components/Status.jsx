// حالات الصفحة اللي بتتكرر: تحميل، خطأ، فاضي، ورسالة تنبيه. موحّدة في كل المشروع.

export function Loading({ text = "Loading..." }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <h2>Something went wrong</h2>
      <p>{message || "Please try again."}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, text, children }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children && <div className="state-actions">{children}</div>}
    </div>
  );
}

// type: info | success | error | warning
export function Alert({ type = "info", children }) {
  return (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
