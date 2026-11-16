import { useId } from "react";
import Field from "./Field";

// قسم قابل للتكرار (Education / Experience / ...): كل عنصر ليه حقول، وفي زرار إضافة وحذف.
// fields: [{ key, label, type?: "text" | "textarea", wide?: true }]
export default function RepeatableSection({ title, itemName, items, onChange, fields, emptyText, newItem }) {
  const uid = useId();
  const update = (index, key, value) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p className="muted">{emptyText}</p>}

      {items.map((item, i) => (
        <fieldset key={i} className="repeat-item">
          <legend>
            {itemName} {i + 1}
          </legend>
          <div className="form-grid">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} id={`${uid}-${i}-${f.key}`} wide={f.wide}>
                {(p) =>
                  f.type === "textarea" ? (
                    <textarea rows={3} value={item[f.key] || ""} onChange={(e) => update(i, f.key, e.target.value)} {...p} />
                  ) : (
                    <input value={item[f.key] || ""} onChange={(e) => update(i, f.key, e.target.value)} {...p} />
                  )
                }
              </Field>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(items.filter((_, n) => n !== i))}>
            Remove {itemName.toLowerCase()} {i + 1}
          </button>
        </fieldset>
      ))}

      <button type="button" className="btn btn-secondary" onClick={() => onChange([...items, newItem()])}>
        + Add {itemName.toLowerCase()}
      </button>
    </section>
  );
}
