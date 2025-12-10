// Bible verses collection
// "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16
// "I can do all things through Christ who strengthens me." - Philippians 4:13
// "Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5
// "Be still, and know that I am God." - Psalm 46:10
// "The Lord is my shepherd, I lack nothing." - Psalm 23:1
// "Cast all your anxiety on him because he cares for you." - 1 Peter 5:7
// "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future." - Jeremiah 29:11
// "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6
// "Jesus said, 'I am the way and the truth and the life. No one comes to the Father except through me.'" - John 14:6
// "The Lord will fight for you; you need only to be still." - Exodus 14:14
// "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." - Romans 8:28
// "The Lord is close to the brokenhearted and saves those who are crushed in spirit." - Psalm 34:18
// "Come to me, all you who are weary and burdened, and I will give you rest." - Matthew 11:28
// "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." - Isaiah 40:31
// "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9

export const BIBLE_VERSES = [
  {
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16"
  },
  {
    text: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13"
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding.",
    reference: "Proverbs 3:5"
  },
  {
    text: "Be still, and know that I am God.",
    reference: "Psalm 46:10"
  },
  {
    text: "The Lord is my shepherd, I lack nothing.",
    reference: "Psalm 23:1"
  },
  {
    text: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7"
  },
  {
    text: "For I know the plans I have for you,\" declares the Lord, \"plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11"
  },
  {
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6"
  },
  {
    text: "Jesus said, 'I am the way and the truth and the life. No one comes to the Father except through me.'",
    reference: "John 14:6"
  },
  {
    text: "The Lord will fight for you; you need only to be still.",
    reference: "Exodus 14:14"
  },
  {
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    reference: "Romans 8:28"
  },
  {
    text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    reference: "Psalm 34:18"
  },
  {
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28"
  },
  {
    text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    reference: "Isaiah 40:31"
  },
  {
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9"
  }
];

/**
 * Get the Bible verse for today (rotates every 24 hours based on date)
 * Uses a consistent seed based on the date so all users see the same verse on the same day
 */
export function getTodaysVerse() {
  const today = new Date();
  // Create a date string in YYYY-MM-DD format (timezone-independent for consistency)
  const dateString = today.toISOString().split('T')[0];
  
  // Use the date string as a seed for consistent selection
  // Convert date string to a number by summing character codes
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed += dateString.charCodeAt(i);
  }
  
  // Use modulo to select a verse index
  const verseIndex = seed % BIBLE_VERSES.length;
  
  return BIBLE_VERSES[verseIndex];
}

/**
 * Get multiple verses for today (useful for showing a few verses)
 */
export function getTodaysVerses(count = 1) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed += dateString.charCodeAt(i);
  }
  
  const verses = [];
  for (let i = 0; i < count; i++) {
    const verseIndex = (seed + i) % BIBLE_VERSES.length;
    verses.push(BIBLE_VERSES[verseIndex]);
  }
  
  return verses;
}

