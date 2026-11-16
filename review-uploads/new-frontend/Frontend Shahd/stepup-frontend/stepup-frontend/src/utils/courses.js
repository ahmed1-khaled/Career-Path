// روابط بحث جاهزة لكل مهارة ناقصة (YouTube / Coursera / Udemy).
// دي روابط بحث، مش كورسات منتقاة. لو الـ Backend بقى يرجّع كورسات حقيقية نستبدلها.
export function courseLinks(skill) {
  const q = encodeURIComponent(skill);
  return [
    {
      provider: "YouTube",
      kind: "Free videos",
      title: `${skill} full course for beginners`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " full course for beginners")}`,
    },
    {
      provider: "Coursera",
      kind: "Courses with certificates",
      title: `${skill} courses`,
      url: `https://www.coursera.org/search?query=${q}`,
    },
    {
      provider: "Udemy",
      kind: "Paid courses",
      title: `${skill} courses`,
      url: `https://www.udemy.com/courses/search/?q=${q}`,
    },
  ];
}
