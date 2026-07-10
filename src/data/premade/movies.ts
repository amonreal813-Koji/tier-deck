import type { PremadeList } from './types';

export const iconicMovies: PremadeList = {
  id: 'iconic-movies',
  title: 'Movies Everyone Argues About',
  category: 'movies',
  tagline: 'From all-time canon to legendary disasters.',
  basis: 'AFI and Sight & Sound polls, IMDb Top 250, Rotten Tomatoes consensus and box-office history.',
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'godfather',
          name: 'The Godfather',
          subtitle: '1972 · Coppola',
          art: { type: 'wiki', title: 'The Godfather' },
          reasoning:
            'Sits at or near #1 on virtually every serious all-time list — AFI, IMDb, critics\' polls. The performances, the score, the craft: it\'s the consensus pick for the greatest American film.',
        },
        {
          id: 'shawshank',
          name: 'The Shawshank Redemption',
          subtitle: '1994 · Darabont',
          art: { type: 'wiki', title: 'The Shawshank Redemption' },
          reasoning:
            '#1 on IMDb\'s Top 250 for decades straight, voted by millions. A box-office flop that word of mouth turned into the most beloved film on the internet.',
        },
        {
          id: 'darkknight',
          name: 'The Dark Knight',
          subtitle: '2008 · Nolan',
          art: { type: 'wiki', title: 'The Dark Knight' },
          reasoning:
            'Redefined what a comic-book film could be and earned Heath Ledger a posthumous Oscar. Its snub famously forced the Academy to expand the Best Picture field.',
        },
        {
          id: 'spiderverse',
          name: 'Into the Spider-Verse',
          subtitle: '2018 · Sony Animation',
          art: { type: 'wiki', title: 'Spider-Man: Into the Spider-Verse' },
          reasoning:
            'Won the Oscar, changed the entire look of animated features overnight, and sits among the highest-rated superhero films ever on every aggregator.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'pulpfiction',
          name: 'Pulp Fiction',
          subtitle: '1994 · Tarantino',
          art: { type: 'wiki', title: 'Pulp Fiction' },
          reasoning:
            'Palme d\'Or winner that reshaped 90s cinema and dialogue forever. A-tier only because its influence is slightly larger than its rewatch consensus.',
        },
        {
          id: 'parasite',
          name: 'Parasite',
          subtitle: '2019 · Bong Joon-ho',
          art: { type: 'wiki', title: 'Parasite (2019 film)' },
          reasoning:
            'First non-English-language Best Picture winner in history and a near-perfect critic score worldwide. Time will likely promote it to S.',
        },
        {
          id: 'endgame',
          name: 'Avengers: Endgame',
          subtitle: '2019 · Marvel',
          art: { type: 'wiki', title: 'Avengers: Endgame' },
          reasoning:
            'The biggest cinematic event of its era and briefly the highest-grossing film ever. An astonishing landing of a 22-film arc — but it leans on that arc to work.',
        },
        {
          id: 'logan',
          name: 'Logan',
          subtitle: '2017 · Mangold',
          art: { type: 'wiki', title: 'Logan (film)' },
          reasoning:
            'The superhero film critics compare to Westerns, with the first Best Adapted Screenplay nomination for the genre. Widely held up as the genre\'s dramatic peak.',
        },
        {
          id: 'schindler',
          name: "Schindler's List",
          subtitle: '1993 · Spielberg',
          art: { type: 'wiki', title: "Schindler's List" },
          reasoning:
            'A Best Picture winner routinely called the greatest film about the Holocaust ever made. It sits in the AFI top 10 — arguably S, but its unrelenting weight makes it a film people revere more than rewatch.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'titanic',
          name: 'Titanic',
          subtitle: '1997 · Cameron',
          art: { type: 'wiki', title: 'Titanic (1997 film)' },
          reasoning:
            '11 Oscars and a box-office record that stood for 12 years — but the script gets teased as much as the spectacle gets praised. Adored and mocked in equal measure: peak B.',
        },
        {
          id: 'avatar',
          name: 'Avatar',
          subtitle: '2009 · Cameron',
          art: { type: 'wiki', title: 'Avatar (2009 film)' },
          reasoning:
            'Still the highest-grossing film of all time, yet famously light on cultural footprint — "no one remembers the characters\' names" became its own meme. Massive, gorgeous, B.',
        },
        {
          id: 'batmanvsuperman',
          name: 'Batman v Superman',
          subtitle: '2016 · Snyder',
          art: { type: 'wiki', title: 'Batman v Superman: Dawn of Justice' },
          reasoning:
            '29% on Rotten Tomatoes against a passionate defender base — the most 50/50 blockbuster of its decade. "Martha" is shorthand for its problems.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'morbius',
          name: 'Morbius',
          subtitle: '2022 · Sony',
          art: { type: 'wiki', title: 'Morbius (film)' },
          reasoning:
            'Bombed, got memed so hard ("It\'s Morbin\' time") that Sony re-released it — and it bombed again. The internet\'s favorite modern bad movie.',
        },
        {
          id: 'catwoman',
          name: 'Catwoman',
          subtitle: '2004 · Warner Bros.',
          art: { type: 'wiki', title: 'Catwoman (film)' },
          reasoning:
            'Swept the Razzies, and Halle Berry famously accepted her Worst Actress award in person holding her Oscar. A masterclass in how not to adapt a comic.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'cats',
          name: 'Cats',
          subtitle: '2019 · Hooper',
          art: { type: 'wiki', title: 'Cats (2019 film)' },
          reasoning:
            'The "digital fur technology" fiasco: patched *after release* in theaters, savaged by critics, and a nine-figure write-off. The consensus modern disaster.',
        },
        {
          id: 'theroom',
          name: 'The Room',
          subtitle: '2003 · Wiseau',
          art: { type: 'wiki', title: 'The Room' },
          reasoning:
            'The undisputed "Citizen Kane of bad movies" — so wrong in every department it became a beloved midnight ritual and got its own Oscar-nominated biopic.',
        },
      ],
    },
  ],
};

export const iconicTvShows: PremadeList = {
  id: 'iconic-tv',
  title: 'Prestige TV, Ranked',
  category: 'movies',
  tagline: 'The golden age dramas — and the endings that broke them.',
  basis: 'Emmy history, critic aggregates, and the collective memory of how each finale landed.',
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'breakingbad',
          name: 'Breaking Bad',
          subtitle: '2008–2013 · AMC',
          art: { type: 'itunes', kind: 'tvShow', term: 'Breaking Bad' },
          reasoning:
            'The consensus "greatest finale ever" and a Guinness record as the highest-rated show of all time. Five seasons, no wasted episode, perfect landing.',
        },
        {
          id: 'thewire',
          name: 'The Wire',
          subtitle: '2002–2008 · HBO',
          art: { type: 'itunes', kind: 'tvShow', term: 'The Wire' },
          reasoning:
            'Ignored by the Emmys, canonized by everyone since — the show critics and writers most often call the best ever made. Season 4 is routinely cited as TV\'s peak.',
        },
        {
          id: 'sopranos',
          name: 'The Sopranos',
          subtitle: '1999–2007 · HBO',
          art: { type: 'itunes', kind: 'tvShow', term: 'The Sopranos' },
          reasoning:
            'Invented prestige TV as we know it. Every antihero drama since lives in Tony\'s shadow, and the cut-to-black is still argued about — which is the point.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'bettercallsaul',
          name: 'Better Call Saul',
          subtitle: '2015–2022 · AMC',
          art: { type: 'itunes', kind: 'tvShow', term: 'Better Call Saul' },
          reasoning:
            '53 Emmy nominations, zero wins — the most acclaimed never-awarded show ever. Many critics quietly argue it surpassed Breaking Bad; the slow first seasons keep it at A.',
        },
        {
          id: 'chernobyl',
          name: 'Chernobyl',
          subtitle: '2019 · HBO',
          art: { type: 'itunes', kind: 'tvShow', term: 'Chernobyl HBO' },
          reasoning:
            'Briefly the highest-rated show in IMDb history when it aired. Five flawless hours — only its miniseries length keeps it from the S-tier longevity club.',
        },
        {
          id: 'theoffice',
          name: 'The Office (US)',
          subtitle: '2005–2013 · NBC',
          art: { type: 'itunes', kind: 'tvShow', term: 'The Office' },
          reasoning:
            'The most-streamed show in America years after it ended. Seasons 2–5 are comedy canon; the post-Michael seasons are the asterisk everyone agrees on.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'strangerthings',
          name: 'Stranger Things',
          subtitle: '2016– · Netflix',
          art: { type: 'itunes', kind: 'tvShow', term: 'Stranger Things' },
          reasoning:
            'Netflix\'s signature megahit and a nostalgia machine — but each season\'s reviews dip a little lower, and "it should have ended already" is now the prevailing take.',
        },
        {
          id: 'lost',
          name: 'Lost',
          subtitle: '2004–2010 · ABC',
          art: { type: 'itunes', kind: 'tvShow', term: 'Lost' },
          reasoning:
            'Appointment television that invented the modern mystery-box — then became the original cautionary tale about not paying it off. The finale still splits rooms 15 years later.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'got',
          name: 'Game of Thrones',
          subtitle: '2011–2019 · HBO',
          art: { type: 'itunes', kind: 'tvShow', term: 'Game of Thrones' },
          reasoning:
            'Six seasons of S-tier television torpedoed by the most widely rejected ending in TV history — 1.7M people petitioned for a remake. No show has ever fallen out of the conversation faster; the crash-landing defines the ranking.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'velma',
          name: 'Velma',
          subtitle: '2023 · HBO Max',
          art: { type: 'itunes', kind: 'tvShow', term: 'Velma' },
          reasoning:
            'One of the lowest audience scores ever recorded for an animated series. Managed to unite the entire internet — against it.',
        },
      ],
    },
  ],
};

export const pixarRanked: PremadeList = {
  id: 'pixar-ranked',
  title: 'Pixar, Ranked',
  category: 'movies',
  tagline: 'From the studio that never missed — until it did.',
  basis: 'Rotten Tomatoes and Metacritic aggregates, Academy Award history, and box-office performance.',
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'toystory',
          name: 'Toy Story',
          subtitle: '1995',
          art: { type: 'wiki', title: 'Toy Story' },
          reasoning:
            '100% on Rotten Tomatoes and the first fully computer-animated feature ever made — it invented an entire art form and is still one of its best examples. Preserved in the Library of Congress.',
        },
        {
          id: 'walle',
          name: 'WALL-E',
          subtitle: '2008',
          art: { type: 'wiki', title: 'WALL-E' },
          reasoning:
            'A nearly dialogue-free first act that critics call the bravest thing a family studio ever shipped. Regularly tops "best animated film of the century" polls, including the BBC\'s.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'up',
          name: 'Up',
          subtitle: '2009',
          art: { type: 'wiki', title: 'Up (2009 film)' },
          reasoning:
            'The first ten minutes are routinely called the best short film Pixar ever made, and it earned a rare Best Picture nomination. The balloon-house middle is merely great — hence A.',
        },
        {
          id: 'nemo',
          name: 'Finding Nemo',
          subtitle: '2003',
          art: { type: 'wiki', title: 'Finding Nemo' },
          reasoning:
            'Oscar winner, then the best-selling DVD of all time — the Pixar film the most households actually own. 99% on RT and endlessly rewatchable.',
        },
        {
          id: 'insideout',
          name: 'Inside Out',
          subtitle: '2015',
          art: { type: 'wiki', title: 'Inside Out (2015 film)' },
          reasoning:
            'The concept-execution peak of late Pixar: emotions as characters, 98% on RT, an Oscar, and its sequel became the highest-grossing animated film ever — proof the idea had legs.',
        },
        {
          id: 'coco',
          name: 'Coco',
          subtitle: '2017',
          art: { type: 'wiki', title: 'Coco (2017 film)' },
          reasoning:
            'Two Oscars, 97% on RT, and "Remember Me" became a generational tearjerker. The strongest of Pixar\'s second decade by broad consensus.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'monstersinc',
          name: 'Monsters, Inc.',
          subtitle: '2001',
          art: { type: 'wiki', title: 'Monsters, Inc.' },
          reasoning:
            'Adored, endlessly quoted, and Boo is an all-timer — but in Pixar ranking round-ups it reliably lands just outside the top tier. The definition of high-B.',
        },
        {
          id: 'brave',
          name: 'Brave',
          subtitle: '2012',
          art: { type: 'wiki', title: 'Brave (2012 film)' },
          reasoning:
            'Won the Oscar in a weak year, but 78% on RT and a troubled production show — critics agree it\'s gorgeous and narratively muddled. Mid-table in every Pixar ranking.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'cars',
          name: 'Cars',
          subtitle: '2006',
          art: { type: 'wiki', title: 'Cars (film)' },
          reasoning:
            'Pixar\'s lowest-rated film of its golden era (74% RT) — and its biggest merchandise machine ever ($10B+). Kids adore it, critics shrug, the toy aisle decided the tier.',
        },
        {
          id: 'gooddino',
          name: 'The Good Dinosaur',
          subtitle: '2015',
          art: { type: 'wiki', title: 'The Good Dinosaur' },
          reasoning:
            'Pixar\'s first box-office bomb, released the same year as Inside Out — the comparison was brutal. Gorgeous landscapes, forgettable story is the near-universal verdict.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'cars2',
          name: 'Cars 2',
          subtitle: '2011',
          art: { type: 'wiki', title: 'Cars 2' },
          reasoning:
            'The only Pixar film rated "rotten" on Rotten Tomatoes (39%) — the moment the studio\'s perfect streak died. A spy movie about Mater that even Pixar\'s own retrospectives skip.',
        },
      ],
    },
  ],
};

export const movieLists: PremadeList[] = [iconicMovies, iconicTvShows, pixarRanked];
