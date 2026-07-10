import type { PremadeList } from './types';

export const superheroes: PremadeList = {
  id: 'superheroes',
  title: 'Superheroes, Ranked',
  category: 'anything',
  tagline: 'Capes ranked by cultural firepower, not who wins the fight.',
  basis: 'Comic sales history, box-office and merchandising data, and public recognition polls (IGN, Ranker).',
  heroArt: { type: 'wiki', title: 'Batman' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'batman',
          name: 'Batman',
          subtitle: 'DC · 1939',
          art: { type: 'wiki', title: 'Batman' },
          reasoning:
            "DC's crown jewel and the best-selling superhero of all time. Routinely #1 in 'greatest superhero' polls — no powers, all iconography. Every brooding vigilante since is a Batman photocopy.",
        },
        {
          id: 'spiderman',
          name: 'Spider-Man',
          subtitle: 'Marvel · 1962',
          art: { type: 'wiki', title: 'Spider-Man' },
          reasoning:
            "Marvel's flagship and the most merchandised superhero on Earth. The everyman formula is so durable it has carried three separate beloved film franchises in twenty years.",
        },
        {
          id: 'superman',
          name: 'Superman',
          subtitle: 'DC · 1938',
          art: { type: 'wiki', title: 'Superman' },
          reasoning:
            'The original — every superhero that exists is a response to him. He invented the entire genre in 1938 and still defines the archetype, even if he is famously hard to write.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'ironman',
          name: 'Iron Man',
          subtitle: 'Marvel · 1963',
          art: { type: 'wiki', title: 'Iron Man' },
          reasoning:
            'A B-lister for decades until the 2008 film built the biggest franchise in cinema history on his back. His cultural stock has never been higher.',
        },
        {
          id: 'wonderwoman',
          name: 'Wonder Woman',
          subtitle: 'DC · 1941',
          art: { type: 'wiki', title: 'Wonder Woman' },
          reasoning:
            'The most iconic superheroine ever created and a feminist symbol since 1941 — the clear number one the moment the field narrows to heroines.',
        },
        {
          id: 'wolverine',
          name: 'Wolverine',
          subtitle: 'Marvel · 1974',
          art: { type: 'wiki', title: 'Wolverine (character)' },
          reasoning:
            "The breakout of the X-Men and comics' most popular antihero. Hugh Jackman played him for seventeen years — a superhero-casting record that cemented him in the mainstream.",
        },
        {
          id: 'hulk',
          name: 'Hulk',
          subtitle: 'Marvel · 1962',
          art: { type: 'wiki', title: 'Hulk' },
          reasoning:
            "Recognized worldwide thanks to the '70s TV show and the MCU. 'Hulk smash' is universal shorthand for rage — a rare hero everyone's grandparent can name.",
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'captainamerica',
          name: 'Captain America',
          subtitle: 'Marvel · 1941',
          art: { type: 'wiki', title: 'Captain America in film' },
          reasoning:
            'The MCU made him the moral center of the biggest film saga ever, but outside the U.S. he is a harder sell. Beloved, not quite universal.',
        },
        {
          id: 'blackpanther',
          name: 'Black Panther',
          subtitle: 'Marvel · 1966',
          art: { type: 'wiki', title: 'Black Panther (character)' },
          reasoning:
            'The 2018 film was a cultural landmark and a Best Picture nominee — a genuine phenomenon, even if the character\'s comics history is thinner than the icons above.',
        },
        {
          id: 'thor',
          name: 'Thor',
          subtitle: 'Marvel · 1962',
          art: { type: 'wiki', title: 'Thor (Marvel Comics)' },
          reasoning:
            'A literal god with A-list movies, held back by comics sales that never matched his screen fame. Huge on film, mid-tier on the page.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'aquaman',
          name: 'Aquaman',
          subtitle: 'DC · 1941',
          art: { type: 'wiki', title: 'Aquaman' },
          reasoning:
            "For decades the industry punchline ('he talks to fish'), partly rehabilitated by a billion-dollar movie. The comeback is real, but the jokes stuck.",
        },
        {
          id: 'greenlantern',
          name: 'Green Lantern',
          subtitle: 'DC · 1940',
          art: { type: 'wiki', title: 'Green Lantern' },
          reasoning:
            'A cornerstone of DC comics dragged down in public memory by one of the most infamous superhero movies ever made — the 2011 film even Ryan Reynolds mocks.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'mattereaterlad',
          name: 'Matter-Eater Lad',
          subtitle: 'DC · 1962',
          art: { type: 'wiki', title: 'Matter-Eater Lad' },
          reasoning:
            "A real DC hero whose entire power is eating any material. He perennially tops 'worst superhero ever' lists — the undisputed bottom of the barrel.",
        },
      ],
    },
  ],
};

export const socialMedia: PremadeList = {
  id: 'social-media',
  title: 'Social Media Apps',
  category: 'anything',
  tagline: 'Ranked by users, impact, and cultural staying power.',
  basis: 'Monthly-active-user figures (DataReportal, company filings) and platform influence over the last two decades.',
  heroArt: { type: 'wiki', title: 'Social media' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'facebook',
          name: 'Facebook',
          art: { type: 'wiki', title: 'Facebook' },
          reasoning:
            '~3 billion monthly users — the largest social network in human history and the app that defined the entire era. Whatever you think of it, nothing else is this big.',
        },
        {
          id: 'youtube',
          name: 'YouTube',
          art: { type: 'wiki', title: 'YouTube' },
          reasoning:
            "~2.5 billion users and the world's second-most-visited website. It didn't just host video — it invented the creator economy.",
        },
        {
          id: 'instagram',
          name: 'Instagram',
          art: { type: 'wiki', title: 'Instagram' },
          reasoning:
            '~2 billion users and the app that made the world visual — it reshaped photography, advertising, and self-image in a single decade.',
        },
        {
          id: 'whatsapp',
          name: 'WhatsApp',
          art: { type: 'wiki', title: 'WhatsApp' },
          reasoning:
            '~2 billion users and the default way entire countries text. Outside the U.S. its dominance over messaging is essentially total.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'tiktok',
          name: 'TikTok',
          art: { type: 'wiki', title: 'TikTok' },
          reasoning:
            'The fastest app ever to a billion users and the one everyone now copies — Reels and Shorts exist because of it. Only regulatory limbo keeps it out of S.',
        },
        {
          id: 'wechat',
          name: 'WeChat',
          art: { type: 'wiki', title: 'WeChat' },
          reasoning:
            "China's everything-app: chat, pay, shop, book, government services. A billion-plus people live inside it — arguably the most powerful app on Earth, just walled off from the West.",
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'twitter',
          name: 'X (Twitter)',
          art: { type: 'wiki', title: 'Twitter' },
          reasoning:
            "Punches far above its user count on influence — it's where news breaks. But turbulent ownership and an exodus since 2022 make it the most volatile major platform.",
        },
        {
          id: 'reddit',
          name: 'Reddit',
          art: { type: 'wiki', title: 'Reddit' },
          reasoning:
            "'The front page of the internet' and the web's biggest forum — enormous cultural reach, and famously hard to monetize.",
        },
        {
          id: 'snapchat',
          name: 'Snapchat',
          art: { type: 'logo', domain: 'snapchat.com' },
          reasoning:
            'Invented the Story and disappearing messages that everyone copied, and still owns the under-25 crowd. Never quite a giant, never going away.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'linkedin',
          name: 'LinkedIn',
          art: { type: 'logo', domain: 'linkedin.com' },
          reasoning:
            "Massive and profitable, but nobody's favorite app — the one you open out of obligation, not joy.",
        },
        {
          id: 'pinterest',
          name: 'Pinterest',
          art: { type: 'wiki', title: 'Pinterest' },
          reasoning:
            'Quietly huge for planning and shopping, and culturally near-invisible next to the feeds above. The introvert of big social apps.',
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'threads',
          name: 'Threads',
          art: { type: 'wiki', title: 'Threads (social network)' },
          reasoning:
            'Launched to 100 million sign-ups in five days — the fastest ever — then most of them never came back. The definition of a hype crash.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'googleplus',
          name: 'Google+',
          art: { type: 'wiki', title: 'Google+' },
          reasoning:
            'Google forced it on everyone, nobody used it, and it shut down in 2019 after a data breach. The textbook social-media failure by a tech giant.',
        },
      ],
    },
  ],
};

export const dogBreeds: PremadeList = {
  id: 'dog-breeds',
  title: 'Dog Breeds, Ranked',
  category: 'anything',
  tagline: 'By popularity and temperament — fight us (gently).',
  basis: 'AKC registration rankings and breed temperament/family-friendliness ratings.',
  heroArt: { type: 'wiki', title: 'Dog' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'labrador',
          name: 'Labrador Retriever',
          art: { type: 'wiki', title: 'Labrador Retriever' },
          reasoning:
            "The most popular breed in America for 31 straight years — friendly, trainable, endlessly good with kids. The default 'great dog' for a reason.",
        },
        {
          id: 'golden',
          name: 'Golden Retriever',
          art: { type: 'wiki', title: 'Golden Retriever' },
          reasoning:
            "Perennial top-3 in AKC rankings and the internet's favorite good boy. Gentle, patient, and nearly impossible to dislike.",
        },
        {
          id: 'frenchbulldog',
          name: 'French Bulldog',
          art: { type: 'wiki', title: 'French Bulldog' },
          reasoning:
            "Overtook the Lab as America's #1 registered breed in 2022 — perfectly suited to apartment life, which is where everyone now lives.",
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'germanshepherd',
          name: 'German Shepherd',
          art: { type: 'wiki', title: 'German Shepherd' },
          reasoning:
            "The world's premier working dog — police, military, service. Fiercely loyal and brilliant, just a lot of dog for a first-timer.",
        },
        {
          id: 'poodle',
          name: 'Poodle',
          art: { type: 'wiki', title: 'Poodle' },
          reasoning:
            'Routinely ranked the second-smartest breed and hypoallergenic — the reason half of today\'s "doodle" mixes exist.',
        },
        {
          id: 'beagle',
          name: 'Beagle',
          art: { type: 'wiki', title: 'Beagle' },
          reasoning:
            'A merry, kid-friendly nose on legs, top-10 for decades. That same nose (and the howl attached to it) is the only real knock.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'corgi',
          name: 'Pembroke Welsh Corgi',
          art: { type: 'wiki', title: 'Pembroke Welsh Corgi' },
          reasoning:
            "The internet's darling and the Queen's dog of choice — adorable and smart, if a little prone to herding your ankles.",
        },
        {
          id: 'dachshund',
          name: 'Dachshund',
          art: { type: 'wiki', title: 'Dachshund' },
          reasoning:
            'Endlessly beloved and endlessly memed, but the long back brings real spinal risks. Big personality, small caveats.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'chihuahua',
          name: 'Chihuahua',
          art: { type: 'wiki', title: 'Chihuahua (dog)' },
          reasoning:
            'Fiercely devoted to its one person and famously wary of everyone else — the most polarizing small breed, adored and side-eyed in equal measure.',
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'pomeranian',
          name: 'Pomeranian',
          art: { type: 'wiki', title: 'Pomeranian (dog)' },
          reasoning:
            'A glorious floof with a big-dog attitude and a bark to match — more high-maintenance grooming and noise than newcomers bargain for.',
        },
      ],
    },
  ],
};

export const carBrands: PremadeList = {
  id: 'car-brands',
  title: 'Car Brands, Ranked',
  category: 'anything',
  tagline: 'Reliability meets prestige — your mechanic voted too.',
  basis: 'Consumer Reports and J.D. Power reliability studies, plus market position and brand prestige.',
  heroArt: { type: 'wiki', title: 'Sports car' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'toyota',
          name: 'Toyota',
          art: { type: 'logo', domain: 'toyota.com' },
          reasoning:
            "The world's best-selling automaker and the benchmark for reliability — near the top of Consumer Reports every single year. The safe answer that's almost never wrong.",
        },
        {
          id: 'lexus',
          name: 'Lexus',
          art: { type: 'logo', domain: 'lexus.com' },
          reasoning:
            "Toyota's luxury arm and the most reliable brand on the planet in survey after survey — luxury that doesn't punish you with repair bills.",
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'honda',
          name: 'Honda',
          art: { type: 'logo', domain: 'honda.com' },
          reasoning:
            "Toyota's eternal rival in dependability — the Civic and Accord are among the most trusted cars ever built.",
        },
        {
          id: 'porsche',
          name: 'Porsche',
          art: { type: 'logo', domain: 'porsche.com' },
          reasoning:
            "Tops J.D. Power dependability among premium brands while building the driver's-choice sports cars — a rare do-everything reputation.",
        },
        {
          id: 'bmw',
          name: 'BMW',
          art: { type: 'logo', domain: 'bmw.com' },
          reasoning:
            "'The Ultimate Driving Machine' and the prestige-performance benchmark, dinged only by famously expensive out-of-warranty maintenance.",
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'mercedes',
          name: 'Mercedes-Benz',
          art: { type: 'logo', domain: 'mercedes-benz.com' },
          reasoning:
            'The inventor of the automobile and the byword for luxury — cost of ownership and middling recent reliability keep it just short of the top.',
        },
        {
          id: 'hyundai',
          name: 'Hyundai',
          art: { type: 'logo', domain: 'hyundai.com' },
          reasoning:
            'The biggest quality glow-up in the industry: from punchline to 10-year-warranty juggernaut in two decades.',
        },
        {
          id: 'subaru',
          name: 'Subaru',
          art: { type: 'logo', domain: 'subaru.com' },
          reasoning:
            'A cult of loyal owners built on standard all-wheel-drive and top safety scores — dependable and beloved, if never exciting.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'ford',
          name: 'Ford',
          art: { type: 'logo', domain: 'ford.com' },
          reasoning:
            "America's truck king — the F-150 has been the best-selling vehicle for 40+ years — but middling reliability scores across the rest of the lineup.",
        },
        {
          id: 'volkswagen',
          name: 'Volkswagen',
          art: { type: 'logo', domain: 'vw.com' },
          reasoning:
            "'The People's Car' with lovely engineering and a spotty reliability record — and the Dieselgate scandal still lingers in the background.",
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'nissan',
          name: 'Nissan',
          art: { type: 'logo', domain: 'nissanusa.com' },
          reasoning:
            'Coasting on past hits with an aging lineup and a dreaded CVT-transmission reputation — a former innovator gone quiet.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'landrover',
          name: 'Land Rover',
          art: { type: 'logo', domain: 'landrover.com' },
          reasoning:
            'Gorgeous, desirable, and routinely dead last in reliability surveys — the brand you lust after and your mechanic quietly thanks you for.',
        },
      ],
    },
  ],
};

export const cultureLists: PremadeList[] = [superheroes, socialMedia, dogBreeds, carBrands];
