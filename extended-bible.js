// Extended Bible text sample to demonstrate more features
// Adding John 3 for theological discussions and Romans 1 for creation topics

// Ensure core containers exist when this file loads before others
window.TOPIC_INDEX = window.TOPIC_INDEX || {};
window.COMMENTARIES = window.COMMENTARIES || {};
window.CROSS_REFERENCES = window.CROSS_REFERENCES || {};
window.LEXICON = window.LEXICON || {};

if (!window.BIBLE_TEXTS.kjv.John) window.BIBLE_TEXTS.kjv.John = {};
if (!window.BIBLE_TEXTS.kjv.Romans) window.BIBLE_TEXTS.kjv.Romans = {};
if (!window.BIBLE_TEXTS.kjv.Job) window.BIBLE_TEXTS.kjv.Job = {};

// John 3 - For salvation and eternal life discussions
window.BIBLE_TEXTS.kjv.John[3] = [
  { verse: 1, text: 'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:' },
  { verse: 2, text: 'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.' },
  { verse: 3, text: 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.' },
  { verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { verse: 17, text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' }
];

// Romans 1 - For creation and natural revelation
window.BIBLE_TEXTS.kjv.Romans[1] = [
  { verse: 19, text: 'Because that which may be known of God is manifest in them; for God hath shewed it unto them.' },
  { verse: 20, text: 'For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:' }
];

// Job 40-41 - For Behemoth and Leviathan discussions
window.BIBLE_TEXTS.kjv.Job[40] = [
  { verse: 15, text: 'Behold now behemoth, which I made with thee; he eateth grass as an ox.' },
  { verse: 16, text: 'Lo now, his strength is in his loins, and his force is in the navel of his belly.' },
  { verse: 17, text: 'He moveth his tail like a cedar: the sinews of his stones are wrapped together.' }
];

window.BIBLE_TEXTS.kjv.Job[41] = [
  { verse: 1, text: 'Canst thou draw out leviathan with an hook? or his tongue with a cord which thou lettest down?' },
  { verse: 10, text: 'None is so fierce that dare stir him up: who then is able to stand before me?' }
];

// Extend topic index
Object.assign(window.TOPIC_INDEX, {
  'salvation': ['John 3:16', 'Romans 10:9'],
  'born again': ['John 3:3', 'John 3:16'],
  'evolution': ['Romans 1:20', 'Genesis 1:1'],
  'dinosaurs': ['Job 40:15', 'Job 41:1'],
  'behemoth': ['Job 40:15'],
  'leviathan': ['Job 41:1']
});

// Add more commentaries
Object.assign(window.COMMENTARIES, {
  'John 3:16': [
    { author: 'Augustine of Hippo', work: 'Tractates on John', excerpt: 'God so loved — not the righteous, but the world, the whole mass of sinners. What love is this!' },
    { author: 'John Chrysostom', work: 'Homilies on John', excerpt: 'When you hear "God so loved," do not suppose this was easy for Him. For costly was the love and the Gift costly.' }
  ],
  'Job 40:15': [
    { author: 'John Chrysostom', work: 'Commentary on Job', excerpt: 'Behold Behemoth — God displays His power through the creatures He has made, showing Job the divine majesty in creation.' }
  ]
});

// Add cross references
Object.assign(window.CROSS_REFERENCES, {
  'John 3:16': ['Romans 5:8', '1 John 4:9', 'John 1:12'],
  'Romans 1:20': ['Psalm 19:1', 'Acts 14:17', 'Romans 2:14-15'],
  'Job 40:15': ['Job 41:1', 'Psalm 104:26']
});

// Add more lexicon entries
Object.assign(window.LEXICON, {
  'loved': { headword: 'ἠγάπησεν (ēgapēsen)', translit: 'egapesen', lang: 'greek', strongs: 'G25', glosses: ['loved'], morph: 'Verb aorist active', senses: ['divine love', 'sacrificial love'], refs: ['John 3:16'] },
  'world': { headword: 'κόσμος (kosmos)', translit: 'kosmos', lang: 'greek', strongs: 'G2889', glosses: ['world', 'universe'], morph: 'Noun masculine', senses: ['created order', 'humanity in rebellion'], refs: ['John 3:16'] },
  'born': { headword: 'γεννηθῇ (gennēthē)', translit: 'gennethe', lang: 'greek', strongs: 'G1080', glosses: ['born', 'begotten'], morph: 'Verb aorist passive subjunctive', senses: ['physical birth', 'spiritual regeneration'], refs: ['John 3:3'] }
});