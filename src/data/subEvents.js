import { generateAllRomaji } from '../constants';

export const WRONG_PHRASES = [
  'ばーか！',
  'あっちいけ！',
  'うるさい！',
  'めんどくさい',
  'おまえがやれ！',
  'やだね！',
  'しらん！',
  'だめ！',
  'フンッ！',
  'おそい！',
  'へたくそ！',
  'むり！',
  'きらい！',
  'しらんかお',
  'かんけいない',
  'きにしないで',
  'じぶんでやれ',
];

export const SUB_EVENT_SPAWN_POSITIONS = [
  { top: '32%', left: '58%' },
  { top: '58%', left: '62%' },
  { top: '48%', left: '28%' },
  { top: '68%', left: '52%' },
  { top: '42%', left: '78%' },
  { top: '55%', left: '15%' },
];

function rally(speaker, text, kana, options = {}) {
  return {
    speaker,
    text,
    kana,
    textDisplay: options.textDisplay || text,
    kanaDisplay: options.kanaDisplay || kana,
    speakerDisplay: options.speakerDisplay || speaker,
    romaji: options.romaji || generateAllRomaji(kana),
  };
}

export const TYPING_SUB_EVENTS = [
  {
    id: 'lost_child',
    title: 'まいごで ないている おんなのこ',
    titleDisplay: 'まいごで ないている おんなのこ',
    emoji: '😭',
    image: '/subevent_lost_child.png',
    name: 'はなちゃん',
    rallies: [
      rally('はなちゃん', 'ママー！どこにいっちゃったの...？', 'だいじょうぶだよ', {
        kanaDisplay: '{だいじょうぶ|大丈夫}だよ',
      }),
      rally('はなちゃん', 'うえ〜ん、いっしょにさがしてくれる？', 'いっしょにさがそう', {
        kanaDisplay: '{いっしょ|一緒}に{さが|探}そう',
      }),
      rally('はなちゃん', 'あ！ママがいた！ありがとう！', 'よかったね'),
    ],
  },
  {
    id: 'quarrel',
    title: 'ケンカしている きょうだい',
    titleDisplay: '{けんか|ケンカ}している きょうだい',
    emoji: '😠',
    image: '/subevent_quarrel.png',
    name: 'たくや＆みさき',
    rallies: [
      rally('たくや＆みさき', 'ぼくが先に遊ぶんだ！／わたしのだよ！', 'じゅんばんであそぼう', {
        textDisplay: 'ぼくが{さき|先}に{あそ|遊}ぶんだ！／わたしのだよ！',
        kanaDisplay: '{じゅんばん|順番}で{あそ|遊}ぼう',
      }),
      rally('たくや＆みさき', 'え〜っ、でも僕が先に使ってたんだもん！', 'なかよくはんぶんこ', {
        textDisplay: 'え〜っ、でも{ぼく|僕}が{さき|先}に{つか|使}ってたんだもん！',
        kanaDisplay: '{なか|仲}{よ|良}く{はんぶん|半分}こ',
      }),
      rally('たくや＆みさき', '仲直りできたよ！ありがとう！', 'なかよくあそぼう', {
        textDisplay: '{なかなおり|仲直り}できたよ！ありがとう！',
        kanaDisplay: '{なか|仲}{よ|良}く{あそ|遊}ぼう',
      }),
    ],
  },
  {
    id: 'bad_mouth',
    title: 'わるぐちを いう おとこのこ',
    titleDisplay: 'わるぐちを いう おとこのこ',
    emoji: '👦💬',
    image: '/subevent_bad_mouth.png',
    name: 'りゅうとくん',
    rallies: [
      rally('りゅうとくん', 'あいつの服、へんなのー！ダサダサ！', 'わるぐちはだめだよ', {
        textDisplay: 'あいつの{ふく|服}、へんなのー！ダサダサ！',
        kanaDisplay: '{わるぐち|悪口}はだめだよ',
      }),
      rally('りゅうとくん', 'ちぇっ、おもしろがって言っただけなのに...', 'やさしいことばにしよう', {
        textDisplay: 'ちぇっ、おもしろがって{い|言}っただけなのに...',
        kanaDisplay: '{やさ|優}しい{ことば|言葉}にしよう',
      }),
      rally('りゅうとくん', 'ごめんなさい。もうチクチク言葉は使わないよ。', 'ともだちをたいせつに', {
        textDisplay: 'ごめんなさい。もうチクチク{ことば|言葉}は{つか|使}わないよ。',
        kanaDisplay: '{ともだち|友達}を{たいせつ|大切}に',
      }),
    ],
  },
  {
    id: 'litter',
    title: 'ゴミを すてそうな おとこのこ',
    titleDisplay: '{ごみ|ゴミ}を すてそうな おとこのこ',
    emoji: '🗑️',
    image: '/subevent_litter.png',
    name: 'こうたろうくん',
    rallies: [
      rally('こうたろうくん', 'ゴミ箱遠いし、このへんに置いちゃえ...', 'ゴミはゴミばこへ', {
        textDisplay: 'ゴミ{ばこ|箱}{とお|遠}いし、このへんに{お|置}いちゃえ...',
        kanaDisplay: 'ゴミはゴミ{ばこ|箱}へ',
      }),
      rally('こうたろうくん', 'だって歩くのめんどくさいんだもん...', 'きれいにしようね', {
        textDisplay: 'だって{ある|歩}くのめんどくさいんだもん...',
        kanaDisplay: '{きれい|綺麗}にしようね',
      }),
      rally('こうたろうくん', 'そうだよね、ゴミ箱を探して捨ててくる！', 'えらいね', {
        textDisplay: 'そうだよね、ゴミ{ばこ|箱}を{さが|探}して{す|捨}ててくる！',
      }),
    ],
  },
  {
    id: 'grandma',
    title: '荷物で こまっている おばあさん',
    titleDisplay: '{にもつ|荷物}で こまっている おばあさん',
    emoji: '👵💦',
    image: '/subevent_grandma.png',
    name: 'うめおばあさん',
    rallies: [
      rally(
        'うめおばあさん',
        'おやおや、袋が破れて荷物が散らばって困ったねぇ...',
        'おてつだいします',
        {
          textDisplay:
            'おやおや、{ふくろ|袋}が{ゆ|破}れて{にもつ|荷物}が{ち|散}らばって{こま|困}ったねぇ...',
          kanaDisplay: '{おてつだい|お手伝い}します',
        },
      ),
      rally('うめおばあさん', 'まあ、手伝ってくれるのかい？嬉しいねぇ。', 'ひろいましょうね', {
        textDisplay: 'まあ、{てつだ|手伝}ってくれるのかい？{うれ|嬉}しいねぇ。',
        kanaDisplay: '{ひろ|拾}いましょうね',
      }),
      rally(
        'うめおばあさん',
        'おかげで全部ひろえたよ。本当にありがとうね。',
        'どういたしまして',
        {
          textDisplay: 'おかげで{ぜんぶ|全部}{ひろ|拾}えたよ。{ほんとう|本当}にありがとうね。',
        },
      ),
    ],
  },
  {
    id: 'running',
    title: 'モールを はしりまわる おとこのこ',
    titleDisplay: 'モールを {はし|走}りまわる おとこのこ',
    emoji: '🏃‍♂️',
    image: '/subevent_running.png',
    name: 'しょうたくん',
    rallies: [
      rally('しょうたくん', 'わーい！ショッピングモールを走るのたのしー！', 'はしるとあぶないよ', {
        textDisplay: 'わーい！ショッピングモールを{はし|走}るのたのしー！',
        kanaDisplay: '{はし|走}ると{あぶ|危}ないよ',
      }),
      rally('しょうたくん', 'えー、急いでお店に行きたいんだもん！', 'ゆっくりあるこう', {
        textDisplay: 'えー、{いそ|急}いで{みせ|店}に{い|行}きたいんだもん！',
      }),
      rally('しょうたくん', '人にぶつかったら大変だね。歩いていくよ！', 'あんぜんだね', {
        textDisplay: '{ひと|人}にぶつかったら{たいへん|大変}だね。{ある|歩}いていくよ！',
        kanaDisplay: '{あんぜん|安全}だね',
      }),
    ],
  },
  {
    id: 'troubled_adult',
    title: '道に まよっている ひと',
    titleDisplay: '{みち|道}に まよっている ひと',
    emoji: '😰',
    image: '/subevent_elevator.png',
    name: 'おじさん',
    rallies: [
      rally('おじさん', 'このモール、どこにトイレがあるかわからなくて...', 'おてつだいします', {
        kanaDisplay: '{おてつだい|お手伝い}します',
      }),
      rally('おじさん', '案内してくれるの？助かるよ。', 'こちらへどうぞ', {
        textDisplay: '{あんない|案内}してくれるの？{たす|助}かるよ。',
      }),
      rally('おじさん', '見つかった！本当にありがとう！', 'どういたしまして', {
        textDisplay: '{み|見}つかった！{ほんとう|本当}にありがとう！',
      }),
    ],
  },
  {
    id: 'crying_girl',
    title: 'ベンチで ないている おんなのこ',
    titleDisplay: 'ベンチで ないている おんなのこ',
    emoji: '😢',
    image: '/subevent_saving.png',
    name: 'ゆいちゃん',
    rallies: [
      rally('ゆいちゃん', 'おともだちと けんかしちゃって...', 'だいじょうぶだよ', {
        textDisplay: '{おともだち|お友達}と {けんか|喧嘩}しちゃって...',
        kanaDisplay: '{だいじょうぶ|大丈夫}だよ',
      }),
      rally('ゆいちゃん', 'なんて いえば なおせるかな...', 'やさしいことばにしよう', {
        textDisplay: 'なんて {い|言}えば なおせるかな...',
        kanaDisplay: '{やさ|優}しい{ことば|言葉}にしよう',
      }),
      rally('ゆいちゃん', 'やさしく 話しかけたら わらってくれた！', 'よかったね', {
        textDisplay: '{やさ|優}しく {はな|話}しかけたら {わら|笑}ってくれた！',
      }),
    ],
  },
];
