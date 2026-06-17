export const BACKGROUNDS = [
  { id: 'default', name: 'いつものへや', url: '/bg.png' },
  { id: 'space', name: 'うちゅう', url: '/space_bg.png' },
  { id: 'forest', name: 'もりのなか', url: '/forest_bg.png' },
  { id: 'ocean', name: 'うみのそこ', url: '/underwater_bg.png' },
  { id: 'castle', name: 'おしろ', url: '/castle_bg.png' },
  { id: 'dino', name: 'きょうりゅう', url: '/dino_bg.png' },
  { id: 'candy', name: 'おかしのくに', url: '/candy_bg.png' }
];

export const TITLES = [
  { id: 'beginner', name: 'しょしんしゃ', color: 'text-gray-600', bg: 'bg-gray-100' },
  { id: 'speedstar', name: 'スピードスター', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'master', name: 'タイピングマスター', color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'legend', name: 'でんせつのゆうしゃ', color: 'text-red-600', bg: 'bg-red-100' }
];

export const GACHA_ITEMS = [
  { id: 'bg_space', type: 'background', bgId: 'space', name: 'うちゅうの背景', rarity: 'rare' },
  { id: 'bg_forest', type: 'background', bgId: 'forest', name: 'もりの背景', rarity: 'normal' },
  { id: 'bg_ocean', type: 'background', bgId: 'ocean', name: 'うみの背景', rarity: 'rare' },
  { id: 'bg_castle', type: 'background', bgId: 'castle', name: 'おしろの背景', rarity: 'epic' },
  { id: 'bg_dino', type: 'background', bgId: 'dino', name: 'きょうりゅうの背景', rarity: 'epic' },
  { id: 'bg_candy', type: 'background', bgId: 'candy', name: 'おかしの背景', rarity: 'epic' },
  { id: 'title_speedstar', type: 'title', titleId: 'speedstar', name: '称号：スピードスター', rarity: 'rare' },
  { id: 'title_master', type: 'title', titleId: 'master', name: '称号：タイピングマスター', rarity: 'epic' },
  { id: 'title_legend', type: 'title', titleId: 'legend', name: '称号：でんせつのゆうしゃ', rarity: 'legendary' }
];

export const ROMAJI_TABLE = {
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['ti', 'chi', 'ci'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo', 'o'], 'ん': ['nn', 'n'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  
  // 拗音
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha', 'cya'], 'ちゅ': ['tyu', 'chu', 'cyu'], 'ちょ': ['tyo', 'cho', 'cyo'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja', 'jya'], 'じゅ': ['zyu', 'ju', 'jyu'], 'じょ': ['zyo', 'jo', 'jyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
  'でゃ': ['dha'], 'でゅ': ['dhu'], 'でょ': ['dho'],
  'てぃ': ['thi'], 'てゅ': ['thu'], 'でぃ': ['dhi'],
  
  // 長音・記号等
  'ー': ['-'], '！': ['!'], '？': ['?'], '。': ['.'], '、': [','], ' ': [' '],
  '0': ['0'], '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'],
  '5': ['5'], '6': ['6'], '7': ['7'], '8': ['8'], '9': ['9']
};

export const toHiragana = (str) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
};

export function generateAllRomaji(text) {
  const normalized = toHiragana(text);
  const results = [];
  
  function recurse(index, currentRomaji) {
    if (index >= normalized.length) {
      results.push(currentRomaji);
      return;
    }
    
    // 促音「っ」の処理
    if (normalized[index] === 'っ') {
      if (index + 1 < normalized.length) {
        let nextChar2 = normalized.substring(index + 1, index + 3);
        let nextChar1 = normalized[index + 1];
        
        let nextRomajis = [];
        let consumed = 0;
        
        if (ROMAJI_TABLE[nextChar2]) {
          nextRomajis = ROMAJI_TABLE[nextChar2];
          consumed = 2;
        } else if (ROMAJI_TABLE[nextChar1]) {
          nextRomajis = ROMAJI_TABLE[nextChar1];
          consumed = 1;
        }
        
        if (nextRomajis.length > 0) {
          nextRomajis.forEach(r => {
            const firstChar = r[0];
            recurse(index + 1 + consumed, currentRomaji + firstChar + r);
          });
          return;
        }
      }
      recurse(index + 1, currentRomaji + 'tsu');
      return;
    }
    
    // 2文字のチェック
    if (index + 1 < normalized.length) {
      const char2 = normalized.substring(index, index + 2);
      if (ROMAJI_TABLE[char2]) {
        ROMAJI_TABLE[char2].forEach(r => {
          recurse(index + 2, currentRomaji + r);
        });
        return;
      }
    }
    
    // 1文字のチェック
    const char1 = normalized[index];
    if (ROMAJI_TABLE[char1]) {
      ROMAJI_TABLE[char1].forEach(r => {
        recurse(index + 1, currentRomaji + r);
      });
    } else {
      recurse(index + 1, currentRomaji + char1.toLowerCase());
    }
  }
  
  recurse(0, '');
  return [...new Set(results)];
}

// 子供向けの単語リスト（難易度別）
export const WORDS = {
  easy: [
    { kana: 'あり', romaji: ["ari"], emoji: '🐜' },
    { kana: 'いぬ', romaji: ["inu"], emoji: '🐶' },
    { kana: 'うし', romaji: ["usi","ushi"], emoji: '🐄' },
    { kana: 'かめ', romaji: ["kame"], emoji: '🐢' },
    { kana: 'さる', romaji: ["saru"], emoji: '🐵' },
    { kana: 'たこ', romaji: ["tako"], emoji: '🐙' },
    { kana: 'ねこ', romaji: ["neko"], emoji: '🐱' },
    { kana: 'はな', romaji: ["hana"], emoji: '🌸' },
    { kana: 'ふね', romaji: ["fune"], emoji: '🚢' },
    { kana: 'ほし', romaji: ["hosi","hoshi"], emoji: '⭐' },
    { kana: 'まど', romaji: ["mado"], emoji: '🪟' },
    { kana: 'ゆき', romaji: ["yuki"], emoji: '⛄' },
    { kana: 'よる', romaji: ["yoru"], emoji: '🌃' },
    { kana: 'くま', romaji: ["kuma"], emoji: '🐻' },
    { kana: 'とり', romaji: ["tori"], emoji: '🐦' },
    { kana: 'つき', romaji: ["tuki","tsuki"], emoji: '🌙' },
    { kana: 'もも', romaji: ["momo"], emoji: '🍑' },
    { kana: 'なし', romaji: ["nasi","nashi"], emoji: '🍐' },
    { kana: 'くつ', romaji: ["kutu","kutsu"], emoji: '👟' },
    { kana: 'かさ', romaji: ["kasa"], emoji: '☂️' },
    { kana: 'えき', romaji: ["eki"], emoji: '🚉' },
    { kana: 'うみ', romaji: ["umi"], emoji: '🌊' },
    { kana: 'そら', romaji: ["sora"], emoji: '☁️' },
    { kana: 'やま', romaji: ["yama"], emoji: '⛰️' },
    { kana: 'かわ', romaji: ["kawa"], emoji: '🏞️' },
    { kana: 'かに', romaji: ["kani"], emoji: '🦀' },
    { kana: 'ほん', romaji: ["honn"], emoji: '📖' },
    { kana: 'いえ', romaji: ["ie"], emoji: '🏠' },
    { kana: 'とら', romaji: ["tora"], emoji: '🐅' },
    { kana: 'むし', romaji: ["musi","mushi"], emoji: '🐛' },
    { kana: 'かい', romaji: ["kai"], emoji: '🐚' },
    { kana: 'いか', romaji: ["ika"], emoji: '🦑' },
    { kana: 'こま', romaji: ["koma"], emoji: '🌀' },
    { kana: 'もち', romaji: ["moti","mochi"], emoji: '🍡' },
    { kana: 'まめ', romaji: ["mame"], emoji: '🫘' },
    { kana: 'ごま', romaji: ["goma"], emoji: '🧂' },
    { kana: 'ほね', romaji: ["hone"], emoji: '🦴' },
    { kana: 'むぎ', romaji: ["mugi"], emoji: '🌾' },
    { kana: 'あせ', romaji: ["ase"], emoji: '💦' },
    { kana: 'あわ', romaji: ["awa"], emoji: '🫧' },
    { kana: 'いと', romaji: ["ito"], emoji: '🧵' },
    { kana: 'うた', romaji: ["uta"], emoji: '🎤' },
    { kana: 'えだ', romaji: ["eda"], emoji: '🌿' },
    { kana: 'かお', romaji: ["kao"], emoji: '👤' },
    { kana: 'ぐみ', romaji: ["gumi"], emoji: '🍬' },
    { kana: 'くも', romaji: ["kumo"], emoji: '🕷️' },
    { kana: 'ごみ', romaji: ["gomi"], emoji: '🗑️' }
  ],
  normal: [
    { kana: 'くるま', romaji: ["kuruma"], emoji: '🚗' },
    { kana: 'でんしゃ', romaji: ["dennsya","dennsha"], emoji: '🚃' },
    { kana: 'たぬき', romaji: ["tanuki"], emoji: '🦝' },
    { kana: 'りんご', romaji: ["rinngo"], emoji: '🍎' },
    { kana: 'みかん', romaji: ["mikann"], emoji: '🍊' },
    { kana: 'ぶどう', romaji: ["budou"], emoji: '🍇' },
    { kana: 'めろん', romaji: ["meronn"], emoji: '🍈' },
    { kana: 'いちご', romaji: ["itigo","ichigo"], emoji: '🍓' },
    { kana: 'ごりら', romaji: ["gorira"], emoji: '🦍' },
    { kana: 'ぱんだ', romaji: ["pannda"], emoji: '🐼' },
    { kana: 'うさぎ', romaji: ["usagi"], emoji: '🐰' },
    { kana: 'きりん', romaji: ["kirinn"], emoji: '🦒' },
    { kana: 'らいおん', romaji: ["raionn"], emoji: '🦁' },
    { kana: 'ちょこ', romaji: ["tyoko","cyoko","choco"], emoji: '🍫' },
    { kana: 'けーき', romaji: ["ke-ki"], emoji: '🍰' },
    { kana: 'とけい', romaji: ["tokei"], emoji: '⌚' },
    { kana: 'じゅーす', romaji: ["zyu-su","ju-su"], emoji: '🧃' },
    { kana: 'えんぴつ', romaji: ["ennpitu","ennpitsu"], emoji: '✏️' },
    { kana: 'れもん', romaji: ["remonn","lemonn"], emoji: '🍋' },
    { kana: 'ひまわり', romaji: ["himawari"], emoji: '🌻' },
    { kana: 'つくえ', romaji: ["tukue","tsukue"], emoji: '🪑' },
    { kana: 'にんじゃ', romaji: ["ninnja","ninnzya"], emoji: '🥷' },
    { kana: 'よっと', romaji: ["yotto"], emoji: '⛵' },
    { kana: 'ごはん', romaji: ["gohann"], emoji: '🍚' },
    { kana: 'おんぷ', romaji: ["onnpu"], emoji: '🎵' },
    { kana: 'おにぎり', romaji: ["onigiri"], emoji: '🍙' },
    { kana: 'たまご', romaji: ["tamago"], emoji: '🥚' },
    { kana: 'ぷりん', romaji: ["purinn"], emoji: '🍮' },
    { kana: 'すいか', romaji: ["suika"], emoji: '🍉' },
    { kana: 'ぱんつ', romaji: ["panntu","panntsu"], emoji: '🩲' },
    { kana: 'しんごう', romaji: ["sinngou","shinngou"], emoji: '🚥' },
    { kana: 'めがね', romaji: ["megane"], emoji: '👓' },
    { kana: 'はさみ', romaji: ["hasami"], emoji: '✂️' },
    { kana: 'かえる', romaji: ["kaeru"], emoji: '🐸' },
    { kana: 'すずめ', romaji: ["suzume"], emoji: '🕊️' },
    { kana: 'いるか', romaji: ["iruka"], emoji: '🐬' },
    { kana: 'くじら', romaji: ["kuzira","kujira"], emoji: '🐳' },
    { kana: 'だんご', romaji: ["danngo"], emoji: '🍡' },
    { kana: 'かがみ', romaji: ["kagami"], emoji: '🪞' },
    { kana: 'まくら', romaji: ["makura"], emoji: '🛌' },
    { kana: 'でんわ', romaji: ["dennwa"], emoji: '☎️' },
    { kana: 'てれび', romaji: ["terebi"], emoji: '📺' },
    { kana: 'ぱそこん', romaji: ["pasokonn"], emoji: '💻' },
    { kana: 'とまと', romaji: ["tomato"], emoji: '🍅' },
    { kana: 'ひこうき', romaji: ["hikouki"], emoji: '✈️' },
    { kana: 'せんせい', romaji: ["sennsei"], emoji: '🧑‍🏫' },
    { kana: 'ピアノ', romaji: ["piano"], emoji: '🎹' },
    { kana: 'ギター', romaji: ["gita-"], emoji: '🎸' },
    { kana: 'ハンバーグ', romaji: ["hannba-gu"], emoji: '🍽️' },
    { kana: 'オムライス', romaji: ["omuraisu"], emoji: '🍳' },
    { kana: 'オートバイ', romaji: ["o-tobai"], emoji: '🏍️' },
    { kana: 'トラクター', romaji: ["torakuta-"], emoji: '🚜' },
    { kana: 'ロケット', romaji: ["roketto"], emoji: '🚀' },
    { kana: 'ペンギン', romaji: ["pennginn"], emoji: '🐧' },
    { kana: 'カピバラ', romaji: ["kapibara"], emoji: '🐹' },
    { kana: 'ダイナソー', romaji: ["dainaso-"], emoji: '🦖' },
    { kana: 'よかったね', romaji: generateAllRomaji('よかったね'), emoji: '😄' },
    { kana: 'えらいね', romaji: generateAllRomaji('えらいね'), emoji: '👍' }
  ],
  hard: [
    { kana: 'スパゲッティ', romaji: ["supagetthi"], emoji: '🍝' },
    { kana: 'アイスクリーム', romaji: ["aisukuri-mu"], emoji: '🍦' },
    { kana: 'チョコレート', romaji: ["tyokore-to","chokore-to"], emoji: '🍫' },
    { kana: 'しょうぼうしゃ', romaji: ["syoubousya","shoubousha"], emoji: '🚒' },
    { kana: 'きゅうきゅうしゃ', romaji: ["kyuukyuusya","kyuukyuusha"], emoji: '🚑' },
    { kana: 'パトロールカー', romaji: ["patoro-ruka-"], emoji: '🚓' },
    { kana: 'ティラノサウルス', romaji: ["thiranosaurusu"], emoji: '🦖' },
    { kana: 'トリケラトプス', romaji: ["torikeratopusu"], emoji: '🦕' },
    { kana: 'マトリョーシカ', romaji: ["matoryo-sika","matoryo-shika"], emoji: '🪆' },
    { kana: 'プラネタリウム', romaji: ["puranetariumu"], emoji: '🌌' },
    { kana: 'スマートフォン', romaji: ["suma-tofonn"], emoji: '📱' },
    { kana: 'プロジェクター', romaji: ["purozyekuta-","purojekuta-"], emoji: '📽️' },
    { kana: 'コミュニケーション', romaji: ["komyunike-syonn","komyunike-shonn"], emoji: '🗣️' },
    { kana: 'キャタピラー', romaji: ["kyatapira-"], emoji: '🐛' },
    { kana: 'トランペット', romaji: ["torannpetto"], emoji: '🎺' },
    { kana: 'ジャックオランタン', romaji: ["zyakkuoranntann","jakkuoranntann"], emoji: '🎃' },
    { kana: 'ハンバーガー', romaji: ["hannba-ga-"], emoji: '🍔' },
    { kana: 'カレーライス', romaji: ["kare-raisu"], emoji: '🍛' },
    { kana: 'サンドイッチ', romaji: ["sanndoitti","sanndoitchi"], emoji: '🥪' },
    { kana: 'エレベーター', romaji: ["erebe-ta-"], emoji: '🛗' },
    { kana: 'エスカレーター', romaji: ["esukare-ta-"], emoji: '🛗' },
    { kana: 'パイナップル', romaji: ["painappuru"], emoji: '🍍' },
    { kana: 'ヘリコプター', romaji: ["herikoputa-"], emoji: '🚁' },
    { kana: 'ブルドーザー', romaji: ["burudo-za-"], emoji: '🚜' },
    { kana: 'イルミネーション', romaji: ["irumine-syonn","irumine-shonn"], emoji: '🌟' },
    { kana: 'ステゴサウルス', romaji: ["sutegosaurusu"], emoji: '🦕' },
    { kana: 'だいじょうぶだよ', romaji: generateAllRomaji('だいじょうぶだよ'), emoji: '🤝' },
    { kana: 'いっしょにさがそう', romaji: generateAllRomaji('いっしょにさがそう'), emoji: '🔍' },
    { kana: 'じゅんばんであそぼう', romaji: generateAllRomaji('じゅんばんであそぼう'), emoji: '🛝' },
    { kana: 'なかよくはんぶんこ', romaji: generateAllRomaji('なかよくはんぶんこ'), emoji: '🍰' },
    { kana: 'なかよくあそぼう', romaji: generateAllRomaji('なかよくあそぼう'), emoji: '🤝' },
    { kana: 'わるぐちはだめだよ', romaji: generateAllRomaji('わるぐちはだめだよ'), emoji: '👦💬' },
    { kana: 'やさしいことばにしよう', romaji: generateAllRomaji('やさしいことばにしよう'), emoji: '✨' },
    { kana: 'ともだちをたいせつに', romaji: generateAllRomaji('ともだちをたいせつに'), emoji: '🧑‍🤝‍🧑' },
    { kana: 'ゴミはゴミばこへ', romaji: generateAllRomaji('ゴミはゴミばこへ'), emoji: '🗑️' },
    { kana: 'きれいにしようね', romaji: generateAllRomaji('きれいにしようね'), emoji: '✨' },
    { kana: 'おてつだいします', romaji: generateAllRomaji('おてつだいします'), emoji: '👵' },
    { kana: 'ひろいましょうね', romaji: generateAllRomaji('ひろいましょうね'), emoji: '📦' },
    { kana: 'どういたしまして', romaji: generateAllRomaji('どういたしまして'), emoji: '😊' },
    { kana: 'はしるとあぶないよ', romaji: generateAllRomaji('はしるとあぶないよ'), emoji: '🏃‍♂️⚠️' },
    { kana: 'ゆっくりあるこう', romaji: generateAllRomaji('ゆっくりあるこう'), emoji: '🚶‍♂️' },
    { kana: 'あんぜんだね', romaji: generateAllRomaji('あんぜんだね'), emoji: '🛡️' },
    { kana: 'おさきにどうぞ', romaji: generateAllRomaji('おさきにどうぞ'), emoji: '🚪' },
    { kana: 'ゆずりあいましょう', romaji: generateAllRomaji('ゆずりあいましょう'), emoji: '🤝' },
    { kana: 'やさしいきもち', romaji: generateAllRomaji('やさしいきもち'), emoji: '💖' }
  ],
  very_hard: [
    { kana: 'こんにちは！', romaji: ["konnnitiha!","konnichihar!"], emoji: '👋' },
    { kana: 'ありがとう！', romaji: ["arigatou!"], emoji: '😊' },
    { kana: 'どうしたの？', romaji: ["dousitano?","doushitano?"], emoji: '❓' },
    { kana: 'すごいね！', romaji: ["sugoine!"], emoji: '✨' },
    { kana: 'やったぁ！', romaji: ["yattaa!"], emoji: '🙌' },
    { kana: 'うれしいなぁ！', romaji: ["uresiinaa!","ureshiinaa!"], emoji: '🥰' },
    { kana: 'だいじょうぶ？', romaji: ["daizyoubu?","daijoubu?"], emoji: '🤝' },
    { kana: 'ほんとう？', romaji: ["hontou?","honntou?"], emoji: '🤔' },
    { kana: 'まってね！', romaji: ["mattene!"], emoji: '⏳' },
    { kana: 'バイバイ！', romaji: ["baibai!"], emoji: '👋' },
    { kana: '3じにおやつ！', romaji: ["3zinioyatu!","3jinoyatsu!"], emoji: '🕒' },
    { kana: '1ばんだよ！', romaji: ["1banndayo!"], emoji: '🥇' },
    { kana: '100てん満点！', romaji: ["100tennmanntenn!","100tenmanten!"], emoji: '💯' },
    { kana: 'あと5ふん！', romaji: ["ato5funn!","ato5hunn!"], emoji: '⏱️' },
    { kana: 'ゴミはゴミばこへ', romaji: generateAllRomaji('ゴミはゴミばこへ'), emoji: '🗑️' },
    { kana: 'きれいにしようね', romaji: generateAllRomaji('きれいにしようね'), emoji: '✨' },
    { kana: 'えらいね', romaji: generateAllRomaji('えらいね'), emoji: '👍' },
    { kana: 'おてつだいします', romaji: generateAllRomaji('おてつだいします'), emoji: '👵' },
    { kana: 'ひろいましょうね', romaji: generateAllRomaji('ひろいましょうね'), emoji: '📦' },
    { kana: 'どういたしまして', romaji: generateAllRomaji('どういたしまして'), emoji: '😊' },
    { kana: 'はしるとあぶないよ', romaji: generateAllRomaji('はしるとあぶないよ'), emoji: '🏃‍♂️⚠️' },
    { kana: 'ゆっくりあるこう', romaji: generateAllRomaji('ゆっくりあるこう'), emoji: '🚶‍♂️' },
    { kana: 'あんぜんだね', romaji: generateAllRomaji('あんぜんだね'), emoji: '🛡️' },
    { kana: 'おさきにどうぞ', romaji: generateAllRomaji('おさきにどうぞ'), emoji: '🚪' },
    { kana: 'ゆずりあいましょう', romaji: generateAllRomaji('ゆずりあいましょう'), emoji: '🤝' },
    { kana: 'よい一日を', romaji: generateAllRomaji('よい一日を'), emoji: '🌅' }
  ],
  alphabet_quiz: 'abcdefghijklmnopqrstuvwxyz'.split('').map(c => ({
    kana: 'キーボードの大文字をさがしてね！',
    romaji: [c],
    emoji: '🔠',
    isAlphabetQuiz: true
  }))
};

// タイピング時の指ガイド用マッピング
export const FINGER_MAP = {
  q: { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび' },
  a: { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび' },
  z: { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび' },
  w: { hand: 'left', finger: 'ring', label: 'ひだり手・くすりゆび' },
  s: { hand: 'left', finger: 'ring', label: 'ひだり手・くすりゆび' },
  x: { hand: 'left', finger: 'ring', label: 'ひだり手・くすりゆび' },
  e: { hand: 'left', finger: 'middle', label: 'ひだり手・なかゆび' },
  d: { hand: 'left', finger: 'middle', label: 'ひだり手・なかゆび' },
  c: { hand: 'left', finger: 'middle', label: 'ひだり手・なかゆび' },
  r: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  f: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  v: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  t: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  g: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  b: { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  y: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  h: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  n: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  u: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  j: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  m: { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  i: { hand: 'right', finger: 'middle', label: 'みぎ手・なかゆび' },
  k: { hand: 'right', finger: 'middle', label: 'みぎ手・なかゆび' },
  o: { hand: 'right', finger: 'ring', label: 'みぎ手・くすりゆび' },
  l: { hand: 'right', finger: 'ring', label: 'みぎ手・くすりゆび' },
  p: { hand: 'right', finger: 'pinky', label: 'みぎ手・こゆび' },
  '-': { hand: 'right', finger: 'pinky', label: 'みぎ手・こゆび' },
  ',': { hand: 'right', finger: 'middle', label: 'みぎ手・なかゆび' },
  '.': { hand: 'right', finger: 'ring', label: 'みぎ手・くすりゆび' },
  '/': { hand: 'right', finger: 'pinky', label: 'みぎ手・こゆび' },
  '1': { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび' },
  '2': { hand: 'left', finger: 'ring', label: 'ひだり手・くすりゆび' },
  '3': { hand: 'left', finger: 'middle', label: 'ひだり手・なかゆび' },
  '4': { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  '5': { hand: 'left', finger: 'index', label: 'ひだり手・ひとさしゆび' },
  '6': { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  '7': { hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' },
  '8': { hand: 'right', finger: 'middle', label: 'みぎ手・なかゆび' },
  '9': { hand: 'right', finger: 'ring', label: 'みぎ手・くすりゆび' },
  '0': { hand: 'right', finger: 'pinky', label: 'みぎ手・こゆび' },
  '!': { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび (Shiftも押すよ)' },
  '?': { hand: 'right', finger: 'pinky', label: 'みぎ手・こゆび (Shiftも押すよ)' },
  shift: { hand: 'left', finger: 'pinky', label: 'ひだり手・こゆび' },
  ' ': { hand: 'both', finger: 'thumb', label: 'おやゆび' },
};
