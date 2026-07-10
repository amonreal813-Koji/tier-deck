import type { PremadeList } from './types';

export const iconicAlbums: PremadeList = {
  id: 'iconic-albums',
  title: 'Albums That Defined Music',
  category: 'music',
  tagline: 'The canon, the classics, and one legendary faceplant.',
  basis: "Rolling Stone's 500 Greatest Albums, Grammy history, sales certifications and decades of critical consensus.",
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'whats-going-on',
          name: "What's Going On",
          subtitle: 'Marvin Gaye · 1971',
          art: { type: 'itunes', kind: 'album', term: "Marvin Gaye What's Going On" },
          reasoning:
            "#1 on Rolling Stone's 500 Greatest Albums list. A protest record so ahead of its time that Motown didn't want to release it — now it tops the canon itself.",
        },
        {
          id: 'abbey-road',
          name: 'Abbey Road',
          subtitle: 'The Beatles · 1969',
          art: { type: 'itunes', kind: 'album', term: 'The Beatles Abbey Road' },
          reasoning:
            'The Beatles\' farewell masterpiece with the most famous album cover ever shot. The Side 2 medley is still the reference point for how to close a record.',
        },
        {
          id: 'thriller',
          name: 'Thriller',
          subtitle: 'Michael Jackson · 1982',
          art: { type: 'itunes', kind: 'album', term: 'Michael Jackson Thriller' },
          reasoning:
            'The best-selling album of all time, a record eight Grammys in one night, and seven top-10 singles from nine tracks. Pop\'s absolute commercial and artistic peak.',
        },
        {
          id: 'dark-side',
          name: 'The Dark Side of the Moon',
          subtitle: 'Pink Floyd · 1973',
          art: { type: 'itunes', kind: 'album', term: 'Pink Floyd Dark Side of the Moon' },
          reasoning:
            '900+ consecutive weeks on the Billboard 200 — a chart run no album has ever approached. The definitive proof an album can be one single 43-minute idea.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'nevermind',
          name: 'Nevermind',
          subtitle: 'Nirvana · 1991',
          art: { type: 'itunes', kind: 'album', term: 'Nirvana Nevermind' },
          reasoning:
            'Knocked Michael Jackson off #1 and ended the hair-metal era in a single stroke. The most culturally decisive rock album of the last 35 years.',
        },
        {
          id: 'rumours',
          name: 'Rumours',
          subtitle: 'Fleetwood Mac · 1977',
          art: { type: 'itunes', kind: 'album', term: 'Fleetwood Mac Rumours' },
          reasoning:
            '40+ million sold, made by a band actively falling apart — every breakup documented in the songs. Still charts today thanks to each new generation discovering it.',
        },
        {
          id: 'ok-computer',
          name: 'OK Computer',
          subtitle: 'Radiohead · 1997',
          art: { type: 'itunes', kind: 'album', term: 'Radiohead OK Computer' },
          reasoning:
            'Topped "best of the 90s" polls almost immediately and predicted the alienated internet age before it arrived. The critics\' modern-rock touchstone.',
        },
        {
          id: 'gkmc',
          name: 'good kid, m.A.A.d city',
          subtitle: 'Kendrick Lamar · 2012',
          art: { type: 'itunes', kind: 'album', term: 'Kendrick Lamar good kid maad city' },
          reasoning:
            'The consensus classic of modern hip-hop — a debut-major concept album routinely called this generation\'s best. Kendrick later won a literal Pulitzer, cementing the arc it started.',
        },
        {
          id: 'kindofblue',
          name: 'Kind of Blue',
          subtitle: 'Miles Davis · 1959',
          art: { type: 'itunes', kind: 'album', term: 'Miles Davis Kind of Blue' },
          reasoning:
            'The best-selling jazz album of all time and the genre\'s single most recommended entry point. A near-unanimous fixture in "greatest albums ever" lists across every genre.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: '1989',
          name: '1989',
          subtitle: 'Taylor Swift · 2014',
          art: { type: 'itunes', kind: 'album', term: 'Taylor Swift 1989' },
          reasoning:
            'Album of the Year Grammy and the blueprint for the modern pop pivot. Enormous and beloved — but the all-time canon hasn\'t fully admitted it yet. Ask again in 20 years.',
        },
        {
          id: '21',
          name: '21',
          subtitle: 'Adele · 2011',
          art: { type: 'itunes', kind: 'album', term: 'Adele 21' },
          reasoning:
            'The best-selling album of the 21st century and a six-Grammy sweep. Commercially S-tier; critically "very good" — which averages out right here.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'be-here-now',
          name: 'Be Here Now',
          subtitle: 'Oasis · 1997',
          art: { type: 'itunes', kind: 'album', term: 'Oasis Be Here Now' },
          reasoning:
            'The fastest-selling UK album ever at release, then the textbook case of hype collapse — even the band disowned it. "Cocaine set to music," said Noel himself.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'lulu',
          name: 'Lulu',
          subtitle: 'Metallica & Lou Reed · 2011',
          art: { type: 'itunes', kind: 'album', term: 'Lou Reed Metallica Lulu' },
          reasoning:
            'The collaboration nobody asked for and everybody remembers. Routinely tops "worst albums by great artists" lists — a legendary misfire from two legends.',
        },
      ],
    },
  ],
};

export const iconicArtists: PremadeList = {
  id: 'iconic-artists',
  title: 'Music Icons, Ranked',
  category: 'music',
  tagline: 'Legacy, records broken, and one career-ending scandal.',
  basis: "Rolling Stone's 100 Greatest Artists list, RIAA/IFPI certified sales, Grammy records and Billboard chart history.",
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'beatles',
          name: 'The Beatles',
          subtitle: '1960–1970',
          art: { type: 'itunes', kind: 'album', term: 'The Beatles Abbey Road' },
          reasoning:
            '#1 on essentially every "greatest artists" list ever compiled, with more #1 hits than anyone in history. Modern popular music is measured before-and-after them.',
        },
        {
          id: 'mj',
          name: 'Michael Jackson',
          subtitle: 'King of Pop',
          art: { type: 'itunes', kind: 'album', term: 'Michael Jackson Thriller' },
          reasoning:
            'The most awarded artist in history and the performer every pop star since has studied. Thriller, the moonwalk, the videos — he built the template of global stardom.',
        },
        {
          id: 'queen',
          name: 'Queen',
          subtitle: '1970–1991',
          art: { type: 'itunes', kind: 'album', term: 'Queen A Night at the Opera' },
          reasoning:
            'Live Aid 1985 is still voted the greatest live performance of all time, and "Bohemian Rhapsody" refuses to leave the charts five decades on. Arena rock\'s eternal benchmark.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'beyonce',
          name: 'Beyoncé',
          subtitle: '1997–',
          art: { type: 'itunes', kind: 'album', term: 'Beyonce Lemonade' },
          reasoning:
            'The most Grammy-winning artist in history and the modern standard for performance craft. A-tier by a hair only because the singles canon runs thinner than the legends above.',
        },
        {
          id: 'taylor',
          name: 'Taylor Swift',
          subtitle: '2006–',
          art: { type: 'itunes', kind: 'album', term: 'Taylor Swift 1989' },
          reasoning:
            'Rewrote the economics of music: the Eras Tour became the first billion-dollar tour ever and her re-recordings upended label power itself. The defining commercial force of her era.',
        },
        {
          id: 'kendrick',
          name: 'Kendrick Lamar',
          subtitle: '2011–',
          art: { type: 'itunes', kind: 'album', term: 'Kendrick Lamar DAMN' },
          reasoning:
            'The only rapper with a Pulitzer Prize, and the critical consensus pick for the best lyricist of his generation. Halftime show, historic beef win — the résumé keeps growing.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'drake',
          name: 'Drake',
          subtitle: '2009–',
          art: { type: 'itunes', kind: 'album', term: 'Drake Take Care' },
          reasoning:
            'The most-streamed artist of the streaming era with chart records nobody will touch. But critical respect lags the numbers, and losing 2024\'s biggest rap beef dented the aura.',
        },
        {
          id: 'edsheeran',
          name: 'Ed Sheeran',
          subtitle: '2011–',
          art: { type: 'itunes', kind: 'album', term: 'Ed Sheeran Divide' },
          reasoning:
            'Stadium-filling, record-breaking, radio-dominating for a decade straight — and almost never anyone\'s pick for "greatest." The definition of huge-but-not-canon.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'nickelback',
          name: 'Nickelback',
          subtitle: '1995–',
          art: { type: 'itunes', kind: 'album', term: 'Nickelback Silver Side Up' },
          reasoning:
            '50 million albums sold *and* the most memed band in rock history. The internet\'s official punching bag — though "actually, they\'re fine" revisionism is slowly winning.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'millivanilli',
          name: 'Milli Vanilli',
          subtitle: '1988–1990',
          art: { type: 'itunes', kind: 'album', term: 'Milli Vanilli Girl You Know' },
          reasoning:
            'The only act ever stripped of a Grammy — after the world learned they never sang a note of their own records. The music industry\'s defining fraud story.',
        },
      ],
    },
  ],
};

export const musicLists: PremadeList[] = [iconicAlbums, iconicArtists];
