const BASE = import.meta.env.BASE_URL;

const introTrack = `${BASE}music/01-intro-soft-piano.mp3`;
const dedicationTrack = `${BASE}music/02-dedication-piano.mp3`;
const letterTrack = `${BASE}music/03-letter-warm-piano.mp3`;

export const pages = [
  { image: `${BASE}pages/page-01.png`, music: introTrack },
  { image: `${BASE}pages/page-02.png`, music: dedicationTrack },
  { image: `${BASE}pages/page-03.png`, music: letterTrack },
  { image: `${BASE}pages/page-04.png`, music: introTrack },
  { image: `${BASE}pages/page-05.png`, music: dedicationTrack },
  { image: `${BASE}pages/page-06.png`, music: letterTrack },
  { image: `${BASE}pages/page-07.png`, music: introTrack },
  { image: `${BASE}pages/page-08.png`, music: dedicationTrack },
  { image: `${BASE}pages/page-09.png`, music: letterTrack },
  { image: `${BASE}pages/page-10.png`, music: introTrack },
  { image: `${BASE}pages/page-11.png`, music: dedicationTrack },
  { image: `${BASE}pages/page-12.png`, music: letterTrack },
];
