/*
 * THE TWENTY EDITION — personalise everything here.
 * Keep images/music in assets/ and use relative paths. Published repository assets are public.
 * The birthday code is a decorative entry gate, not access security.
 */
window.BIRTHDAY_CONFIG = {
  person: { name: "金琦", displayName: "JIN QI", age: 20, birthday: "11.20", year: "2026" },
  accessCode: "1120",
  cover: {
    image: "assets/jinqi-cover.jpg", // e.g. "assets/cover.jpg"
    alt: "Jin Qi"
  },
  portraits: [
    { image: "assets/jinqi-01.jpg", title: "Edition I", alt: "Jin Qi" },
    { image: "assets/jinqi-02.jpg", title: "Edition II", alt: "Jin Qi" },
    { image: "assets/jinqi-03.jpg", title: "Edition III", alt: "Jin Qi" },
    { image: "assets/jinqi-04.jpg", title: "Edition IV", alt: "Jin Qi" },
    { image: "assets/jinqi-05.jpg", title: "Edition V", alt: "Jin Qi" }
  ],
  note: {
    paragraphs: [
      "有些缘分很奇妙。",
      "认识了很久，中间也曾隔了好些年没有联系。很高兴今年夏天，我们又重新有了交集。",
      "二十岁是一个值得期待的新开始。愿你继续做自己喜欢的事，去想去的地方，遇见更多美好的人和事。",
      "生日快乐，金琦。"
    ],
    signature: "— With warm wishes"
  },
  wishes: [
    { title: "A LITTLE JOY", text: "愿你在平凡的日子里，也能发现许多值得开心的小事。" },
    { title: "A BEAUTIFUL JOURNEY", text: "愿你拥有选择自己喜欢的生活的底气，也有奔赴远方的自由。" },
    { title: "A WISH FOR YOU", text: "愿新的一岁，有新的惊喜，也有一直陪伴你的美好。" }
  ],
  easterEgg: {
    durations: { opening: 4000, portraits: 8000, note: 9000, ending: 9000 }, // milliseconds
    number: "20",
    moment: "This is your moment.",
    chapter: "Chapter 20.",
    story: "A story that is still unfolding.",
    // References to existing portraits (zero-based); adjust face framing per photo.
    photos: [
      { portraitIndex: 0, position: "50% 48%" },
      { portraitIndex: 1, position: "56% 45%" },
      { portraitIndex: 4, position: "50% 38%" }
    ],
    lines: ["有些相识，已经过去好多年。", "也曾有很长一段时间，没有联系。", "很高兴，今年夏天又重新聊起了天。"],
    title: "Happy 20th Birthday, Jin Qi.",
    blessing: "愿二十岁的你，\n拥有奔赴热爱的勇气，\n也拥有自由选择生活的底气。\n新的一岁，继续闪闪发光。",
    promise: "All the best is yet to come.",
    date: "20 NOV · 2026",
    dedication: "Made for you, and only you."
  },
  music: {
    // Original synthesised score "A New Page" (106.7 s); no samples or vocals.
    path: "assets/birthday-music.mp3",
    volume: 0.3,
    fadeInMs: 2000,
    useAmbientFallback: true,
    autoplayOnOpen: true
  }
};
