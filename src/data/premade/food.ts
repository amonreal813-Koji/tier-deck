import type { PremadeList } from './types';

const logo = (domain: string) => ({ type: 'logo' as const, domain });
const ingredient = (name: string) => ({
  type: 'url' as const,
  url: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}.png`,
});

export const fastFoodChains: PremadeList = {
  id: 'fast-food-chains',
  title: 'Fast Food Chains, Settled',
  category: 'food',
  tagline: 'The drive-thru hierarchy America already agrees on.',
  basis: 'ACSI customer-satisfaction rankings, QSR industry surveys and years of taste-test consensus.',
  heroArt: { type: 'wiki', title: 'Hamburger' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'chickfila',
          name: 'Chick-fil-A',
          subtitle: 'Chicken · est. 1946',
          art: logo('chick-fil-a.com'),
          reasoning:
            'Has topped the American Customer Satisfaction Index for nearly a decade straight — no chain measures close. The service alone ("my pleasure") is an industry case study.',
        },
        {
          id: 'innout',
          name: 'In-N-Out',
          subtitle: 'Burgers · est. 1948',
          art: logo('in-n-out.com'),
          reasoning:
            'The chain people plan airport layovers around. Perennial #1 in burger-chain satisfaction surveys, with a cult menu and prices that feel like a typo.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'raisingcanes',
          name: "Raising Cane's",
          subtitle: 'Chicken fingers · est. 1996',
          art: logo('raisingcanes.com'),
          reasoning:
            'One menu item, executed flawlessly — and the fastest-growing cult following in fast food. The sauce carries a religion.',
        },
        {
          id: 'culvers',
          name: "Culver's",
          subtitle: 'ButterBurgers · est. 1984',
          art: logo('culvers.com'),
          reasoning:
            'Routinely beats every national burger chain in satisfaction surveys; the Midwest\'s best-kept non-secret. ButterBurgers and frozen custard do the talking.',
        },
        {
          id: 'fiveguys',
          name: 'Five Guys',
          subtitle: 'Burgers · est. 1986',
          art: logo('fiveguys.com'),
          reasoning:
            'Consistently top-3 in burger quality rankings, with fry portions that have their own memes. Docked only for prices that start burger-quality arguments.',
        },
        {
          id: 'popeyes',
          name: 'Popeyes',
          subtitle: 'Louisiana chicken · est. 1972',
          art: logo('popeyes.com'),
          reasoning:
            'The 2019 chicken sandwich launch broke the internet and genuinely shifted the industry. Food is A-tier; famously chaotic service keeps it out of S.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'mcdonalds',
          name: "McDonald's",
          subtitle: 'The empire · est. 1955',
          art: logo('mcdonalds.com'),
          reasoning:
            'The biggest restaurant company on Earth with S-tier fries and the most reliable consistency in the game — but it near-perpetually ranks last in burger satisfaction surveys. Scale up, taste middle.',
        },
        {
          id: 'wendys',
          name: "Wendy's",
          subtitle: 'Square burgers · est. 1969',
          art: logo('wendys.com'),
          reasoning:
            'Fresh-never-frozen beef, the Frosty institution, and the most-feared Twitter account in food. Solidly above the burger pack, never quite the destination.',
        },
        {
          id: 'tacobell',
          name: 'Taco Bell',
          subtitle: 'Tex-Mex-ish · est. 1962',
          art: logo('tacobell.com'),
          reasoning:
            'Nobody calls it authentic; everybody orders it at midnight. The menu-innovation king with the most loyal late-night base in fast food — a beloved, self-aware B.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'burgerking',
          name: 'Burger King',
          subtitle: 'Flame-grilled · est. 1954',
          art: logo('bk.com'),
          reasoning:
            'Sits at or near the bottom of major burger-chain satisfaction rankings year after year, kept afloat by the Whopper and nostalgia. "Fine" is the brand.',
        },
      ],
    },
    {
      label: 'D',
      color: '#38BDF8',
      items: [
        {
          id: 'subway',
          name: 'Subway',
          subtitle: 'Sandwiches · est. 1965',
          art: logo('subway.com'),
          reasoning:
            'From the biggest restaurant footprint on Earth to thousands of closures a year — the "footlong" lawsuit, tuna controversy and endless discounting tell the story of a fallen giant.',
        },
      ],
    },
  ],
};

export const pizzaToppings: PremadeList = {
  id: 'pizza-toppings',
  title: 'Pizza Toppings: The Verdict',
  category: 'food',
  tagline: 'The most argued-about food question, answered by the data.',
  basis: 'National topping-popularity surveys (YouGov, Harris) — pepperoni wins, anchovies lose, pineapple divides.',
  heroArt: { type: 'wiki', title: 'Pizza' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'pepperoni',
          name: 'Pepperoni',
          art: ingredient('Pepperoni'),
          reasoning:
            'The #1 topping in every US survey ever run — on roughly a third of ALL pizzas ordered. Crispy edges, grease pools, case closed.',
        },
        {
          id: 'extra-cheese',
          name: 'Extra Cheese',
          art: ingredient('Cheese'),
          reasoning:
            'Top-3 in every poll and the only topping with literally zero detractors. You cannot lose adding cheese to cheese.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'mushrooms',
          name: 'Mushrooms',
          art: ingredient('Mushrooms'),
          reasoning:
            'Consistently the highest-ranked vegetable in topping surveys — umami that plays nice with everything on the pie.',
        },
        {
          id: 'sausage',
          name: 'Italian Sausage',
          art: ingredient('Italian Sausage'),
          reasoning:
            'Pepperoni\'s heartier sibling and a fixture of every top-5 list. Chicago would riot at anything lower.',
        },
        {
          id: 'bacon',
          name: 'Bacon',
          art: ingredient('Bacon'),
          reasoning:
            'Polls in the top-5 nationally. It\'s bacon — the reasoning writes itself. Loses points only for going soggy under cheese.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'onions',
          name: 'Onions',
          art: ingredient('Onion'),
          reasoning:
            'A reliable mid-table performer in every survey: welcome on the pie, never the reason you ordered it.',
        },
        {
          id: 'black-olives',
          name: 'Black Olives',
          art: ingredient('Black Olives'),
          reasoning:
            'Splits rooms but keeps a loyal base — hovers mid-pack in polls with a strong "pick them off" minority.',
        },
        {
          id: 'jalapenos',
          name: 'Jalapeños',
          art: ingredient('Jalapeno'),
          reasoning:
            'The heat crowd\'s favorite, climbing every year in surveys as spice tolerance becomes a personality trait.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'pineapple',
          name: 'Pineapple',
          art: ingredient('Pineapple'),
          reasoning:
            'The single most divisive food question on the internet: polls split almost exactly down the middle, presidents have weighed in, Iceland\'s leader "joked" about banning it. C is the mathematically correct average of love and war.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'anchovies',
          name: 'Anchovies',
          art: ingredient('Anchovy Fillet'),
          reasoning:
            'Dead last in essentially every topping survey ever conducted — the consensus "least wanted" topping in America. Respect to the six people who love them.',
        },
      ],
    },
  ],
};

export const candyRankings: PremadeList = {
  id: 'candy-rankings',
  title: 'Candy Power Rankings',
  category: 'food',
  tagline: 'The trick-or-treat hierarchy, straight from the sales data.',
  basis: "US candy sales data (Reese's is America's #1), CandyStore.com's annual best/worst Halloween candy surveys.",
  heroArt: { type: 'wiki', title: 'Candy' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'reeses',
          name: "Reese's Cups",
          art: { type: 'wiki', title: "Reese's Peanut Butter Cups" },
          reasoning:
            "America's #1 selling candy brand and the #1 Halloween candy in nearly every state survey ever run. Peanut butter + chocolate is the closest thing candy has to a settled law.",
        },
        {
          id: 'mms',
          name: "M&M's",
          art: { type: 'wiki', title: "M&M's" },
          reasoning:
            'The best-selling candy in the world, in continuous production since 1941. "Melts in your mouth" is one of the most successful slogans in advertising history.',
        },
        {
          id: 'kitkat',
          name: 'Kit Kat',
          art: { type: 'wiki', title: 'Kit Kat' },
          reasoning:
            'Top-3 in US Halloween surveys and a literal cultural institution in Japan (400+ flavors). The snap is engineering, the wafer is perfect.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'snickers',
          name: 'Snickers',
          art: { type: 'wiki', title: 'Snickers' },
          reasoning:
            'The best-selling chocolate bar in the world for decades. Peanuts, caramel, nougat — the most complete candy bar ever engineered; only Reese\'s poll dominance keeps it from S.',
        },
        {
          id: 'twix',
          name: 'Twix',
          art: { type: 'wiki', title: 'Twix' },
          reasoning:
            'Perennial top-5 in every candy survey, and the "left vs right Twix" campaign proved it could carry a joke for a decade. Cookie crunch does heavy lifting.',
        },
        {
          id: 'sourpatch',
          name: 'Sour Patch Kids',
          art: { type: 'wiki', title: 'Sour Patch Kids' },
          reasoning:
            'The undisputed king of sour candy in US sales, and the top non-chocolate pick with younger voters in nearly every poll. Sour then sweet — a whole personality type.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'skittles',
          name: 'Skittles',
          art: { type: 'logo', domain: 'skittles.com' },
          reasoning:
            'Massive sales, top of the fruity category — but chronically mid-table when all candy competes head-to-head. Great, never anyone\'s single favorite.',
        },
        {
          id: 'hersheys',
          name: "Hershey's Bar",
          art: { type: 'wiki', title: 'Hershey bar' },
          reasoning:
            'The bar that built American chocolate — and the definition of "fine." Surveys consistently place it mid-pack: iconic history, plain present.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'candycorn',
          name: 'Candy Corn',
          art: { type: 'wiki', title: 'Candy corn' },
          reasoning:
            'The most polarizing candy in America: it appears on BOTH the most-loved and most-hated Halloween lists in the same surveys, year after year. C is the honest average.',
        },
        {
          id: 'tootsie',
          name: 'Tootsie Rolls',
          art: { type: 'wiki', title: 'Tootsie Roll' },
          reasoning:
            'Regularly in the bottom-10 of Halloween candy surveys — the piece left in the bowl November 3rd. Survives on nostalgia and parade throws.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'circuspeanuts',
          name: 'Circus Peanuts',
          art: { type: 'wiki', title: 'Circus peanut' },
          reasoning:
            'The perennial #1 on CandyStore.com\'s "worst candy" survey — an orange marshmallow that tastes like banana for reasons nobody can explain. The consensus worst candy in America.',
        },
      ],
    },
  ],
};

export const sodaRankings: PremadeList = {
  id: 'soda-rankings',
  title: 'Sodas, Settled',
  category: 'food',
  tagline: 'The cola wars have a scoreboard.',
  basis: 'Beverage Digest US market-share data and a century of head-to-head sales history.',
  heroArt: { type: 'wiki', title: 'Soft drink' },
  tiers: [
    {
      label: 'S',
      color: '#FF3B6B',
      items: [
        {
          id: 'coke',
          name: 'Coca-Cola',
          art: { type: 'wiki', title: 'Coca-Cola' },
          reasoning:
            'The best-selling soft drink on Earth, #1 in US market share every year since the data existed, and one of the most recognized brands in human history. The benchmark everything else is measured against.',
        },
      ],
    },
    {
      label: 'A',
      color: '#FF8A3D',
      items: [
        {
          id: 'drpepper',
          name: 'Dr Pepper',
          art: { type: 'wiki', title: 'Dr Pepper' },
          reasoning:
            'The quiet assassin of the cola wars: in 2023 it overtook Pepsi to become America\'s #2 soda — the first shakeup at the top in generations. 23 flavors, one upset.',
        },
        {
          id: 'sprite',
          name: 'Sprite',
          art: { type: 'wiki', title: 'Sprite (drink)' },
          reasoning:
            'The best-selling lemon-lime soda in the world and the default "I don\'t drink cola" answer. Consistently top-4 in US share with zero drama.',
        },
      ],
    },
    {
      label: 'B',
      color: '#FFD23F',
      items: [
        {
          id: 'pepsi',
          name: 'Pepsi',
          art: { type: 'wiki', title: 'Pepsi' },
          reasoning:
            'Won taste tests for decades, lost the war anyway — and in 2023 lost second place to Dr Pepper. A giant by any measure, but the scoreboard is the scoreboard.',
        },
        {
          id: 'mtndew',
          name: 'Mountain Dew',
          art: { type: 'wiki', title: 'Mountain Dew' },
          reasoning:
            'A top-5 US soda with the most devoted (and most caffeinated) fanbase in the category. Beloved and mocked in equal proportion — textbook B energy.',
        },
      ],
    },
    {
      label: 'C',
      color: '#4ADE80',
      items: [
        {
          id: 'fanta',
          name: 'Fanta',
          art: { type: 'wiki', title: 'Fanta' },
          reasoning:
            'Huge worldwide, an afterthought in America — it barely cracks the US top 10. Great at a party, never the reason for one.',
        },
      ],
    },
    {
      label: 'F',
      color: '#A78BFA',
      items: [
        {
          id: 'moxie',
          name: 'Moxie',
          art: { type: 'wiki', title: 'Moxie' },
          reasoning:
            'America\'s original soda (1876) and its most polarizing — a bitter gentian-root finish that non-New-Englanders reliably describe as "medicine." Maine made it the official state drink; everyone else made it F.',
        },
      ],
    },
  ],
};

export const foodLists: PremadeList[] = [fastFoodChains, pizzaToppings, candyRankings, sodaRankings];
