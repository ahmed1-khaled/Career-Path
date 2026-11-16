// localStorage بشكل آمن: لو المتصفح منع التخزين (Private mode مثلًا) بنستخدم الذاكرة بدلها
// بدل ما التطبيق يقع. القيم بتتخزن كـ JSON.

const memory = {};

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // التخزين مش متاح أو القيمة بايظة: نكمل بالذاكرة
  }
  return key in memory ? memory[key] : fallback;
}

export function save(key, value) {
  memory[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // مفيش مشكلة: القيمة موجودة في الذاكرة لحد ما الصفحة تتقفل
  }
}

export function remove(key) {
  delete memory[key];
  try {
    localStorage.removeItem(key);
  } catch {
    // تجاهل
  }
}
