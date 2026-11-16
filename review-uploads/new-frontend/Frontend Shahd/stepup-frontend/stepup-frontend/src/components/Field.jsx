// حقل فورم موحّد: label + input + رسالة خطأ/تلميح. بيربط كل حاجة بالـ accessibility attributes.
// children: دالة بتاخد props الجاهزة وتحطها على الـ input
// مثال: <Field label="Email" id="email" error={errors.email}>{(p) => <input type="email" {...p} />}</Field>
export default function Field({ label, id, error, hint, wide, children }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field${wide ? " wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
