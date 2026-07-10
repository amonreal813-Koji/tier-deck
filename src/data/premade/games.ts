import type { PremadeList } from './types';

export const iconicGames: PremadeList = {
  id: 'iconic-games',
  title: 'Iconic Video Games',
  category: 'games',
  tagline: 'The masterpieces, the giants, and the infamous flops.',
  basis: "Metacritic's all-time charts, Guinness World Records sales data, Game of the Year award tallies, and IGN/Polygon greatest-games retrospectives.",
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'botw',
          name: 'Zelda: Breath of the Wild',
          subtitle: '2017 · Nintendo',
          art: { type: 'wiki', title: 'The Legend of Zelda: Breath of the Wild' },
          reasoning:
            '97 on Metacritic and the most "game of the generation" awards ever collected. It rewrote the rules of open-world design — nearly every big open-world game since has borrowed from it.',
        },
        {
          id: 'mario64',
          name: 'Super Mario 64',
          subtitle: '1996 · Nintendo',
          art: { type: 'wiki', title: 'Super Mario 64' },
          reasoning:
            'The blueprint for 3D games, full stop. Analog movement, the camera, momentum — it invented conventions in 1996 that the entire industry still uses today.',
        },
        {
          id: 'tetris',
          name: 'Tetris',
          subtitle: '1984 · Alexey Pajitnov',
          art: { type: 'wiki', title: 'Tetris' },
          reasoning:
            'The most ported game in history and still perfect 40 years later. Routinely tops "greatest game ever" lists because its design has literally zero fat to cut.',
        },
        {
          id: 'minecraft',
          name: 'Minecraft',
          subtitle: '2011 · Mojang',
          art: { type: 'logo', domain: 'minecraft.net' },
          reasoning:
            'The best-selling video game of all time (300M+ copies) and a whole generation\'s creative outlet. Few games have ever mattered culturally at this scale.',
        },
        {
          id: 'ocarina',
          name: 'Ocarina of Time',
          subtitle: '1998 · Nintendo',
          art: { type: 'wiki', title: 'The Legend of Zelda: Ocarina of Time' },
          reasoning:
            'The single highest-rated game in Metacritic history (99) and the title most often named the greatest ever made. It defined 3D action-adventure the way Mario 64 defined 3D platforming.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'witcher3',
          name: 'The Witcher 3',
          subtitle: '2015 · CD Projekt Red',
          art: { type: 'wiki', title: 'The Witcher 3: Wild Hunt' },
          reasoning:
            'The gold standard for RPG storytelling and side quests that matter. Racked up more Game of the Year awards than almost anything in its decade — held just shy of S by clunky combat.',
        },
        {
          id: 'portal2',
          name: 'Portal 2',
          subtitle: '2011 · Valve',
          art: { type: 'wiki', title: 'Portal 2' },
          reasoning:
            'Frequently rated the best-written game ever made, with puzzle design nobody has matched since. Short length is the only thing critics ever dock it for.',
        },
        {
          id: 'rdr2',
          name: 'Red Dead Redemption 2',
          subtitle: '2018 · Rockstar',
          art: { type: 'wiki', title: 'Red Dead Redemption 2' },
          reasoning:
            '97 on Metacritic and the most detailed open world ever shipped. Deliberately slow, weighty controls keep it a notch below the very top for a lot of players.',
        },
        {
          id: 'eldenring',
          name: 'Elden Ring',
          subtitle: '2022 · FromSoftware',
          art: { type: 'wiki', title: 'Elden Ring' },
          reasoning:
            'Game of the Year 2022 nearly everywhere, and the moment FromSoftware went from cult favorite to mainstream titan. Brutal onboarding is the one asterisk.',
        },
        {
          id: 'halflife2',
          name: 'Half-Life 2',
          subtitle: '2004 · Valve',
          art: { type: 'wiki', title: 'Half-Life 2' },
          reasoning:
            'The most acclaimed shooter of its era and the game that launched Steam. Its physics-driven design was so far ahead that shooters spent a decade catching up.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'skyrim',
          name: 'Skyrim',
          subtitle: '2011 · Bethesda',
          art: { type: 'wiki', title: 'The Elder Scrolls V: Skyrim' },
          reasoning:
            'Beloved, endlessly re-released, and genuinely huge — but "wide as an ocean, deep as a puddle" stuck for a reason. Its bugs are as legendary as its dragons.',
        },
        {
          id: 'gtav',
          name: 'GTA V',
          subtitle: '2013 · Rockstar',
          art: { type: 'wiki', title: 'Grand Theft Auto V' },
          reasoning:
            'One of the most profitable entertainment products in history. The single-player is A-tier; a decade of being re-sold on every console while fans waited for GTA VI cools the goodwill.',
        },
        {
          id: 'fortnite',
          name: 'Fortnite',
          subtitle: '2017 · Epic Games',
          art: { type: 'logo', domain: 'fortnite.com' },
          reasoning:
            'A cultural phenomenon that redefined live-service gaming and made the battle pass universal. Critics respect it more than they love it — massive, but polarizing.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'cyberpunk',
          name: 'Cyberpunk 2077',
          subtitle: '2020 · CD Projekt Red',
          art: { type: 'wiki', title: 'Cyberpunk 2077' },
          reasoning:
            'One of the most infamous launches ever — pulled from the PlayStation Store entirely. Years of patches and the Phantom Liberty expansion earned real redemption, which is exactly what C-tier means: fixed, not forgotten.',
        },
        {
          id: 'nomanssky',
          name: "No Man's Sky",
          subtitle: '2016 · Hello Games',
          art: { type: 'wiki', title: "No Man's Sky" },
          reasoning:
            'The poster child for over-promising at launch — and then for the greatest comeback in games. Consensus lands it mid-tier: the redemption arc is admired more than the game is adored.',
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'fallout76',
          name: 'Fallout 76',
          subtitle: '2018 · Bethesda',
          art: { type: 'wiki', title: 'Fallout 76' },
          reasoning:
            'Launched broken, review-bombed to the 50s on Metacritic, and spawned the canvas-bag scandal. Improved since, but it remains the cautionary tale of the franchise.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'et',
          name: 'E.T. (Atari 2600)',
          subtitle: '1982 · Atari',
          art: { type: 'wiki', title: 'E.T. the Extra-Terrestrial (video game)' },
          reasoning:
            'So bad that unsold cartridges were literally buried in a New Mexico desert, and it helped trigger the 1983 video game crash. The consensus worst-famous-game of all time.',
        },
      ],
    },
  ],
};

export const gameConsoles: PremadeList = {
  id: 'game-consoles',
  title: 'Game Consoles, Ranked',
  category: 'games',
  tagline: 'Sixty years of hardware, from thrones to trainwrecks.',
  basis: 'Official lifetime sales figures, Guinness records, and how each machine is remembered by retrospectives.',
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'ps2',
          name: 'PlayStation 2',
          subtitle: '2000 · Sony',
          art: { type: 'wiki', title: 'PlayStation 2' },
          reasoning:
            'The best-selling console of all time (160M+) with the deepest library ever assembled. Its record has stood for 25 years and counting — undisputed S.',
        },
        {
          id: 'switch',
          name: 'Nintendo Switch',
          subtitle: '2017 · Nintendo',
          art: { type: 'wiki', title: 'Nintendo Switch' },
          reasoning:
            'Right behind the PS2 in lifetime sales and the machine that made "handheld or docked" the industry\'s favorite idea. Saved Nintendo after the Wii U and never looked back.',
        },
        {
          id: 'snes',
          name: 'Super Nintendo',
          subtitle: '1991 · Nintendo',
          art: { type: 'wiki', title: 'Super Nintendo Entertainment System' },
          reasoning:
            'Routinely voted the greatest console library pound-for-pound: Super Metroid, Link to the Past, Chrono Trigger, Mario World. Retrospective rankings put it #1 more than any other machine.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'gameboy',
          name: 'Game Boy',
          subtitle: '1989 · Nintendo',
          art: { type: 'wiki', title: 'Game Boy' },
          reasoning:
            '118M sold on a green-tinted screen because the games (and the AA batteries) never quit. Invented portable gaming as a mass market and carried Pokémon to the world.',
        },
        {
          id: 'ps4',
          name: 'PlayStation 4',
          subtitle: '2013 · Sony',
          art: { type: 'wiki', title: 'PlayStation 4' },
          reasoning:
            '117M sold and the definitive home of the prestige single-player era — God of War, Spider-Man, Bloodborne. Won its generation in a walk.',
        },
        {
          id: 'xbox360',
          name: 'Xbox 360',
          subtitle: '2005 · Microsoft',
          art: { type: 'wiki', title: 'Xbox 360' },
          reasoning:
            'Xbox Live made online console gaming mainstream and its controller became the PC standard. Only the Red Ring of Death — a billion-dollar hardware failure — keeps it out of S.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'wii',
          name: 'Wii',
          subtitle: '2006 · Nintendo',
          art: { type: 'wiki', title: 'Wii' },
          reasoning:
            '101M sold and it put a console in grandma\'s living room — a cultural phenomenon. But the shovelware flood and how fast it went dusty in cabinets settle it at B.',
        },
        {
          id: 'dreamcast',
          name: 'Dreamcast',
          subtitle: '1999 · Sega',
          art: { type: 'wiki', title: 'Dreamcast' },
          reasoning:
            'Online play, VMUs, Shenmue — years ahead of everyone, dead in two years. The consensus "best console that failed," and the machine that ended Sega hardware forever.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'gamecube',
          name: 'GameCube',
          subtitle: '2001 · Nintendo',
          art: { type: 'wiki', title: 'GameCube' },
          reasoning:
            'Beloved now, but it finished a distant last in its generation (21M vs the PS2\'s 160M). A cult classic with a handle — nostalgia keeps trying to promote it, sales history says C.',
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'wiiu',
          name: 'Wii U',
          subtitle: '2012 · Nintendo',
          art: { type: 'wiki', title: 'Wii U' },
          reasoning:
            'Nintendo\'s worst-selling home console ever (13.5M) — nobody could explain what it was, including the ads. Its best games all got re-released on Switch, which says everything.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'virtualboy',
          name: 'Virtual Boy',
          subtitle: '1995 · Nintendo',
          art: { type: 'wiki', title: 'Virtual Boy' },
          reasoning:
            'Discontinued within a year, under a million sold, and famous for headaches and red-only 3D. The consensus worst console launch by a major company, ever.',
        },
      ],
    },
  ],
};

export const gameLists: PremadeList[] = [iconicGames, gameConsoles];
