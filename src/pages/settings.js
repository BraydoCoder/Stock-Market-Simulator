// settings.js — user preferences: display name, audio, price alerts, danger zone
import { getState, updateSettings, setDisplayName, addPriceAlert, removePriceAlert, resetPortfolio, subscribe, toggleWatchlist } from '../state/store.js'
import { applyTheme } from '../main.js'
import { STOCKS } from '../data/stocks.js'
import { pc } from '../utils/format.js'
import { toast } from '../components/toast.js'
import { startTutorial } from '../components/tutorial.js'
import { supabase } from '../lib/supabase.js'
import { t, setLanguage } from '../i18n/index.js'
import { renderNavbar } from '../components/navbar.js'

const THEMES = [
  { id: 'dark',      name: 'Dark',       bg: '10 14 26',    a1: '0 212 170',    a2: '99 102 241'   },
  { id: 'light',     name: 'Light',      bg: '248 250 252', a1: '0 168 132',    a2: '79 70 229'    },
  { id: 'hacker',    name: 'Hacker',     bg: '0 3 0',       a1: '0 255 65',     a2: '0 180 50'     },
  { id: 'midnight',  name: 'Midnight',   bg: '10 14 40',    a1: '56 189 248',   a2: '99 145 241'   },
  { id: 'sunset',    name: 'Sunset',     bg: '22 10 5',     a1: '249 115 22',   a2: '244 63 94'    },
  { id: 'ocean',     name: 'Ocean',      bg: '3 12 22',     a1: '6 182 212',    a2: '34 211 238'   },
  { id: 'cyberpunk', name: 'Cyberpunk',  bg: '5 0 12',      a1: '255 0 255',    a2: '255 232 0'    },
  { id: 'rose',      name: 'Rose',       bg: '18 10 14',    a1: '251 113 133',  a2: '215 165 75'   },
  { id: 'amber',     name: 'Amber',      bg: '10 5 0',      a1: '251 191 36',   a2: '245 158 11'   },
  { id: 'nord',      name: 'Nord',       bg: '24 28 38',    a1: '136 192 208',  a2: '163 190 140'  },
  { id: 'dracula',   name: 'Dracula',    bg: '22 24 34',    a1: '189 147 249',  a2: '255 121 198'  },
  { id: 'crimson',   name: 'Crimson',    bg: '14 4 4',      a1: '220 38 38',    a2: '251 113 133'  },
  { id: 'retro',     name: 'Retro',      bg: '10 0 22',     a1: '0 255 255',    a2: '255 0 200'    },
  { id: 'solarized', name: 'Solarized',  bg: '0 43 54',     a1: '38 139 210',   a2: '42 161 152'   },
]

const LANGUAGE_GROUPS = [
  {
    group: 'English',
    langs: [{ code: 'en', name: 'English' }],
  },
  {
    group: 'Germanic',
    langs: [
      { code: 'de',  name: 'Deutsch' },
      { code: 'nl',  name: 'Nederlands' },
      { code: 'sv',  name: 'Svenska' },
      { code: 'no',  name: 'Norsk' },
      { code: 'da',  name: 'Dansk' },
      { code: 'fi',  name: 'Suomi' },
      { code: 'af',  name: 'Afrikaans' },
      { code: 'is',  name: 'Íslenska' },
      { code: 'lb',  name: 'Lëtzebuergesch' },
      { code: 'nds', name: 'Plattdüütsch' },
      { code: 'sco', name: 'Scots' },
      { code: 'gsw', name: 'Alemannisch' },
      { code: 'fo',  name: 'Føroyskt' },
      { code: 'fy',  name: 'Frysk' },
      { code: 'yi',  name: 'ייִדיש' },
      { code: 'bar', name: 'Boarisch' },
      { code: 'ksh', name: 'Kölsch' },
      { code: 'li',  name: 'Limburgs' },
      { code: 'vls', name: 'West-Vlams' },
      { code: 'stq', name: 'Seeltersk' },
      { code: 'hrx', name: 'Hunsrik' },
      { code: 'pfl', name: 'Pälzisch' },
      { code: 'swg', name: 'Schwäbisch' },
      { code: 'wae', name: 'Walserdialekt' },
      { code: 'sxu', name: 'Sächsisch' },
      { code: 'vmf', name: 'Mainfränkisch' },
      { code: 'pdt', name: 'Plautdietsch' },
    ],
  },
  {
    group: 'Romance',
    langs: [
      { code: 'fr',  name: 'Français' },
      { code: 'es',  name: 'Español' },
      { code: 'pt',  name: 'Português' },
      { code: 'it',  name: 'Italiano' },
      { code: 'ro',  name: 'Română' },
      { code: 'ca',  name: 'Català' },
      { code: 'gl',  name: 'Galego' },
      { code: 'ast', name: 'Asturianu' },
      { code: 'an',  name: 'Aragonés' },
      { code: 'sc',  name: 'Sardu' },
      { code: 'oc',  name: 'Occitan' },
      { code: 'rm',  name: 'Rumantsch' },
      { code: 'ht',  name: 'Kreyòl ayisyen' },
      { code: 'la',  name: 'Latina' },
      { code: 'vec', name: 'Vèneto' },
      { code: 'fur', name: 'Furlan' },
      { code: 'wa',  name: 'Walon' },
      { code: 'nap', name: 'Napulitano' },
      { code: 'lad', name: 'Ladino' },
      { code: 'lmo', name: 'Lumbaart' },
      { code: 'pms', name: 'Piemontèis' },
      { code: 'rgn', name: 'Rumagnòl' },
      { code: 'egl', name: 'Emigliàn' },
      { code: 'scn', name: 'Sicilianu' },
      { code: 'lij', name: 'Ligure' },
      { code: 'frp', name: 'Arpetan' },
      { code: 'mwl', name: 'Mirandés' },
      { code: 'ext', name: 'Estremeñu' },
      { code: 'pcd', name: 'Picard' },
      { code: 'nrm', name: 'Nouormand' },
      { code: 'ang', name: 'Englisc' },
      { code: 'rup', name: 'Armãneashti' },
      { code: 'rmy', name: 'Romani' },
      { code: 'lld', name: 'Ladin' },
      { code: 'pap', name: 'Papiamentu' },
      { code: 'mfe', name: 'Morisyen' },
      { code: 'cbk', name: 'Chavacano' },
      { code: 'sdc', name: 'Sassaresu' },
      { code: 'ist', name: 'Istrioto' },
      { code: 'dlm', name: 'Dalmatín' },
      { code: 'co',  name: 'Corsu' },
      { code: 'gcf', name: 'Créole guadeloupéen' },
      { code: 'jam', name: 'Patwa' },
      { code: 'bzj', name: 'Kriol' },
      { code: 'rmn', name: 'Romano' },
    ],
  },
  {
    group: 'Slavic',
    langs: [
      { code: 'ru',  name: 'Русский' },
      { code: 'pl',  name: 'Polski' },
      { code: 'cs',  name: 'Čeština' },
      { code: 'uk',  name: 'Українська' },
      { code: 'bg',  name: 'Български' },
      { code: 'sk',  name: 'Slovenčina' },
      { code: 'sr',  name: 'Српски' },
      { code: 'hr',  name: 'Hrvatski' },
      { code: 'sl',  name: 'Slovenščina' },
      { code: 'mk',  name: 'Македонски' },
      { code: 'bs',  name: 'Bosanski' },
      { code: 'be',  name: 'Беларуская' },
      { code: 'hsb', name: 'Hornjoserbšćina' },
      { code: 'dsb', name: 'Dolnoserbšćina' },
      { code: 'rue', name: 'Русиньскый' },
      { code: 'csb', name: 'Kaszëbsczi' },
      { code: 'szl', name: 'Ślōnskŏ godka' },
      { code: 'cnr', name: 'Crnogorski' },
    ],
  },
  {
    group: 'Baltic & Finno-Ugric',
    langs: [
      { code: 'lt',  name: 'Lietuvių' },
      { code: 'lv',  name: 'Latviešu' },
      { code: 'et',  name: 'Eesti' },
      { code: 'hu',  name: 'Magyar' },
      { code: 'kv',  name: 'Коми' },
      { code: 'udm', name: 'Удмурт' },
      { code: 'myv', name: 'Эрзянь' },
      { code: 'mhr', name: 'Марий' },
      { code: 'se',  name: 'Davvisámegiella' },
      { code: 'smj', name: 'Julevsámegiella' },
      { code: 'vro', name: 'Võro' },
      { code: 'mdf', name: 'Мокшень кяль' },
      { code: 'liv', name: 'Līvõ kēļ' },
      { code: 'vep', name: "Vepsän kel'" },
      { code: 'sma', name: 'Åarjelsaemiengïele' },
      { code: 'sms', name: 'Nuõrttsääʹmǩiõll' },
      { code: 'ltg', name: 'Latgalīšu' },
      { code: 'smn', name: 'Anarâškielâ' },
      { code: 'koi', name: 'Перем коми' },
      { code: 'krl', name: 'Karjala' },
      { code: 'fit', name: 'Meänkieli' },
      { code: 'yrk', name: 'Ненэцяʼ вада' },
      { code: 'evn', name: 'Эвэды' },
      { code: 'sel', name: 'Селькуп' },
      { code: 'niv', name: 'Нивхгу мерӈ' },
      { code: 'olo', name: 'Livvi' },
      { code: 'kca', name: 'Хантый' },
      { code: 'mns', name: 'Мансийский' },
      { code: 'ykg', name: 'Вадул' },
      { code: 'ket', name: 'Кетский' },
      { code: 'mrj', name: 'Горно марий' },
    ],
  },
  {
    group: 'Celtic',
    langs: [
      { code: 'cy', name: 'Cymraeg' },
      { code: 'ga', name: 'Gaeilge' },
      { code: 'gd', name: 'Gàidhlig' },
      { code: 'gv', name: 'Gaelg' },
      { code: 'kw', name: 'Kernewek' },
      { code: 'br', name: 'Brezhoneg' },
      { code: 'eu', name: 'Euskara' },
    ],
  },
  {
    group: 'Greek & Balkan',
    langs: [
      { code: 'el', name: 'Ελληνικά' },
      { code: 'sq', name: 'Shqip' },
    ],
  },
  {
    group: 'East Asian',
    langs: [
      { code: 'zh',    name: '中文 (简体)' },
      { code: 'zh-tw', name: '中文 (繁體)' },
      { code: 'yue',   name: '粵語' },
      { code: 'nan',   name: '閩南語' },
      { code: 'ja',    name: '日本語' },
      { code: 'ko',    name: '한국어' },
      { code: 'mn',    name: 'Монгол' },
      { code: 'bo',    name: 'བོད་སྐད་' },
      { code: 'dz',    name: 'རྫོང་ཁ' },
      { code: 'wuu',  name: '吳語' },
      { code: 'hak',  name: '客家話' },
      { code: 'gan',  name: '贛語' },
      { code: 'cdo',  name: '閩東語' },
      { code: 'za',   name: 'Vahcuengh' },
      { code: 'ain',  name: 'アイヌ・イタㇰ' },
      { code: 'kac',  name: 'Jinghpaw' },
      { code: 'lzh',  name: '文言' },
      { code: 'cnh',  name: 'Laiholh' },
      { code: 'lhu',  name: 'Lahu' },
      { code: 'bua',  name: 'Буряад хэлэн' },
      { code: 'pwn',  name: 'Pinayuanan' },
      { code: 'dng',  name: 'Хуэйзу хуа' },
      { code: 'cjm',  name: 'Cam' },
      { code: 'tay',  name: 'Tayal' },
      { code: 'ami',  name: 'Pangcah' },
      { code: 'trv',  name: 'Truku' },
      { code: 'bnn',  name: 'Bunun' },
    ],
  },
  {
    group: 'South Asian',
    langs: [
      { code: 'hi',  name: 'हिन्दी' },
      { code: 'bn',  name: 'বাংলা' },
      { code: 'ur',  name: 'اردو' },
      { code: 'pa',  name: 'ਪੰਜਾਬੀ' },
      { code: 'gu',  name: 'ગુજરાતી' },
      { code: 'mr',  name: 'मराठी' },
      { code: 'ta',  name: 'தமிழ்' },
      { code: 'te',  name: 'తెలుగు' },
      { code: 'kn',  name: 'ಕನ್ನಡ' },
      { code: 'ml',  name: 'മലയാളം' },
      { code: 'si',  name: 'සිංහල' },
      { code: 'ne',  name: 'नेपाली' },
      { code: 'mai', name: 'मैथिली' },
      { code: 'bho', name: 'भोजपुरी' },
      { code: 'kok', name: 'कोंकणी' },
      { code: 'ks',  name: 'کٲشُر' },
      { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ' },
      { code: 'mni', name: 'ꯃꯤꯇꯩ ꯂꯣꯟ' },
      { code: 'or',  name: 'ଓଡ଼ିଆ' },
      { code: 'as',  name: 'অসমীয়া' },
      { code: 'sd',  name: 'سنڌي' },
      { code: 'awa', name: 'अवधी' },
      { code: 'new', name: 'नेपाल भाषा' },
      { code: 'doi', name: 'डोगरी' },
      { code: 'lus', name: 'Mizo ṭawng' },
      { code: 'kha', name: 'Khasi' },
      { code: 'tcy', name: 'ತುಳು' },
      { code: 'raj', name: 'राजस्थानी' },
      { code: 'bgc', name: 'हरियाणवी' },
      { code: 'brh', name: 'براہوئی' },
      { code: 'kru', name: 'कुड़ुख़' },
      { code: 'gon', name: 'गोंडी' },
      { code: 'bsk', name: 'Burushaski' },
      { code: 'hne', name: 'छत्तीसगढ़ी' },
      { code: 'syl', name: 'ꠍꠤꠟꠐꠤ' },
      { code: 'bpy', name: 'বিষ্ণুপ্রিয়া' },
      { code: 'dv',  name: 'ދިވެހި' },
      { code: 'gbm', name: 'गढ़वाली' },
      { code: 'kfy', name: 'कुमाऊँनी' },
      { code: 'rkt', name: 'রংপুরী' },
      { code: 'trp', name: 'ককবরক' },
      { code: 'xnr', name: 'कांगड़ी' },
      { code: 'wtm', name: 'मेवाती' },
      { code: 'sck', name: 'सादरी' },
      { code: 'lmn', name: 'లంబాడి' },
      { code: 'saz', name: 'ꢯꣃꢬꢵꢰ꣄ꢙ꣄ꢜ꣄' },
      { code: 'sa',  name: 'संस्कृतम्' },
      { code: 'pi',  name: 'Pāḷi' },
      { code: 'mag', name: 'मगही' },
      { code: 'bra', name: 'ब्रजभाषा' },
      { code: 'gom', name: 'कोंकणी' },
      { code: 'mwr', name: 'मारवाड़ी' },
      { code: 'hoc', name: 'Ho' },
      { code: 'unr', name: 'Mundari' },
      { code: 'lif', name: 'Yakthung Pān' },
    ],
  },
  {
    group: 'Southeast Asian',
    langs: [
      { code: 'id',  name: 'Bahasa Indonesia' },
      { code: 'ms',  name: 'Bahasa Melayu' },
      { code: 'vi',  name: 'Tiếng Việt' },
      { code: 'th',  name: 'ภาษาไทย' },
      { code: 'tl',  name: 'Filipino' },
      { code: 'ceb', name: 'Cebuano' },
      { code: 'ilo', name: 'Ilokano' },
      { code: 'war', name: 'Winaray' },
      { code: 'hil', name: 'Ilonggo' },
      { code: 'jv',  name: 'Basa Jawa' },
      { code: 'su',  name: 'Basa Sunda' },
      { code: 'min', name: 'Baso Minangkabau' },
      { code: 'my',  name: 'မြန်မာ' },
      { code: 'km',  name: 'ខ្មែរ' },
      { code: 'lo',  name: 'ລາວ' },
      { code: 'ace', name: 'Basa Acèh' },
      { code: 'bug', name: 'Basa Ugi' },
      { code: 'pam', name: 'Kapampangan' },
      { code: 'ban', name: 'Basa Bali' },
      { code: 'mad', name: 'Basa Madura' },
      { code: 'bjn', name: 'Bahasa Banjar' },
      { code: 'bbc', name: 'Hata Batak' },
      { code: 'gor', name: 'Bahasa Hulontalo' },
      { code: 'pag', name: 'Pangasinan' },
      { code: 'bik', name: 'Bikolano' },
      { code: 'shn', name: 'ၽႃႇသႃႇတႆး' },
      { code: 'tsg', name: 'Bahasa Sūg' },
      { code: 'nij', name: 'Bahasa Ngaju' },
      { code: 'nia', name: 'Li Niha' },
      { code: 'msi', name: 'Bahasa Sabah' },
      { code: 'ifb', name: 'Ifugao' },
      { code: 'mnw', name: 'ဘာသာ မန်' },
      { code: 'khb', name: 'ᦌᦹᧈᦋᦲᧃᧈ' },
      { code: 'mrw', name: 'Maranao' },
      { code: 'aoz', name: 'Dawan' },
      { code: 'mak', name: 'Makassar' },
      { code: 'bew', name: 'Betawi' },
      { code: 'blt', name: 'Tai Dam' },
      { code: 'kjg', name: 'Kmhmu' },
    ],
  },
  {
    group: 'Middle Eastern',
    langs: [
      { code: 'ar',  name: 'العربية' },
      { code: 'he',  name: 'עברית' },
      { code: 'fa',  name: 'فارسی' },
      { code: 'tr',  name: 'Türkçe' },
      { code: 'mt',  name: 'Malti' },
      { code: 'ku',  name: 'Kurdî' },
      { code: 'ckb', name: 'کوردی سۆرانی' },
      { code: 'ps',  name: 'پښتو' },
      { code: 'bal', name: 'بلوچی' },
      { code: 'lrc', name: 'لۊری شومالی' },
      { code: 'mzn', name: 'مازِرونی' },
      { code: 'glk', name: 'گیلکی' },
      { code: 'haz', name: 'هزارگی' },
      { code: 'skr', name: 'سرائیکی' },
      { code: 'tly', name: 'Tolışi' },
      { code: 'ary', name: 'الدارجة' },
      { code: 'aeb', name: 'تونسي' },
      { code: 'prs', name: 'درى' },
      { code: 'sdh', name: 'کوردیی باشووری' },
      { code: 'arc', name: 'ܐܪܡܝܐ' },
      { code: 'lki', name: 'لەکی' },
      { code: 'bqi', name: 'بختیاری' },
      { code: 'apc', name: 'عربية شامية' },
      { code: 'acm', name: 'عراقي' },
      { code: 'ayl', name: 'عربي ليبي' },
    ],
  },
  {
    group: 'Turkic & Central Asian',
    langs: [
      { code: 'az',  name: 'Azərbaycanca' },
      { code: 'kk',  name: 'Қазақша' },
      { code: 'uz',  name: "O'zbek" },
      { code: 'ky',  name: 'Кыргызча' },
      { code: 'tt',  name: 'Татарча' },
      { code: 'tg',  name: 'Тоҷикӣ' },
      { code: 'ug',  name: 'ئۇيغۇرچە' },
      { code: 'ba',  name: 'Башҡортса' },
      { code: 'cv',  name: 'Чӑвашла' },
      { code: 'sah', name: 'Саха тыла' },
      { code: 'tk',  name: 'Türkmençe' },
      { code: 'kaa', name: 'Qaraqalpaqsha' },
      { code: 'nog', name: 'Ногай тили' },
      { code: 'alt', name: 'Алтай тил' },
      { code: 'kum', name: 'Къумукъ тил' },
      { code: 'krc', name: 'Малкъар тил' },
      { code: 'tyv', name: 'Тыва дыл' },
      { code: 'kjh', name: 'Хакас тілі' },
      { code: 'xal', name: 'Хальмг келн' },
      { code: 'crh', name: 'Qırımtatar' },
      { code: 'gag', name: 'Gagauzça' },
      { code: 'zza', name: 'Zazaki' },
      { code: 'klj', name: 'Xalaj' },
      { code: 'yai', name: 'Яғнобӣ' },
    ],
  },
  {
    group: 'Caucasian',
    langs: [
      { code: 'ka', name: 'ქართული' },
      { code: 'hy', name: 'Հայerեն' },
      { code: 'ce', name: 'Нохчийн' },
      { code: 'os', name: 'Ирон' },
      { code: 'ab',  name: 'Аҧсуа' },
      { code: 'lez', name: 'Лезги' },
      { code: 'av',  name: 'Авар' },
      { code: 'inh', name: 'Гӏалгӏай' },
      { code: 'syr', name: 'ܣܘܪܝܝܐ' },
      { code: 'tig', name: 'ትግረ' },
      { code: 'har', name: 'ሐረሪ' },
      { code: 'lzz', name: 'Lazuri' },
      { code: 'dar', name: 'Дарган' },
      { code: 'lbe', name: 'Лак чIу' },
      { code: 'tkr', name: 'Цахур чIал' },
      { code: 'xmf', name: 'მარგარული' },
      { code: 'sva', name: 'ლუშნუ ნინ' },
      { code: 'agx', name: 'Агъул чIал' },
      { code: 'rut', name: 'Муьхъал мицI' },
      { code: 'tab', name: 'ТабасаранцIакар' },
    ],
  },
  {
    group: 'Berber',
    langs: [
      { code: 'kab', name: 'Taqbaylit' },
      { code: 'zgh', name: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' },
      { code: 'shi', name: 'ⵜⴰⵛⵍⵃⵉⵢⵜ' },
      { code: 'tzm', name: 'ⵜⴰⵎⴰⵣⵉⵖⵜ (Atlas)' },
      { code: 'tmh', name: 'Tamaheq' },
      { code: 'rif', name: 'Tarifit' },
    ],
  },
  {
    group: 'Pacific & Oceanic',
    langs: [
      { code: 'mg',  name: 'Malagasy' },
      { code: 'sm',  name: 'Gagana Samoa' },
      { code: 'mi',  name: 'Te Reo Māori' },
      { code: 'haw', name: 'ʻŌlelo Hawaiʻi' },
      { code: 'fj',  name: 'Na Vosa Vakaviti' },
      { code: 'to',  name: 'Lea Fakatonga' },
      { code: 'ty',  name: 'Reo Tahiti' },
      { code: 'bi',  name: 'Bislama' },
      { code: 'tet', name: 'Tetun' },
      { code: 'ch',  name: 'Chamoru' },
      { code: 'tpi', name: 'Tok Pisin' },
      { code: 'mh',  name: 'Kajin M̧ajeļ' },
      { code: 'rap', name: 'Vananga Rapa Nui' },
      { code: 'tvl', name: 'Te Ggana Tuvalu' },
      { code: 'niu', name: 'Vagahau Niue' },
      { code: 'gil', name: 'Taetae ni Kiribati' },
      { code: 'pau', name: 'A tekoi er a Belau' },
      { code: 'crs', name: 'Kreol Seselwa' },
      { code: 'pon', name: 'Mwahu en Pohnpei' },
      { code: 'meu', name: 'Hiri Motu' },
      { code: 'wls', name: "Fakaʻuvea" },
      { code: 'tkl', name: 'Tokelau' },
      { code: 'nau', name: 'Dorerin Naoero' },
      { code: 'kos', name: 'Kosrae' },
      { code: 'yap', name: 'Yapese' },
      { code: 'chk', name: 'Chuukese' },
      { code: 'wbp', name: 'Warlpiri' },
      { code: 'pis', name: 'Pijin' },
      { code: 'mqm', name: 'ʻEo Enana' },
      { code: 'hif', name: 'Fiji Hindi' },
      { code: 'rtm', name: 'Rotuṃan' },
      { code: 'rar', name: "Māori Kūki 'Āirani" },
    ],
  },
  {
    group: 'African',
    langs: [
      { code: 'sw',  name: 'Kiswahili' },
      { code: 'am',  name: 'አማርኛ' },
      { code: 'so',  name: 'Soomaali' },
      { code: 'ha',  name: 'Hausa' },
      { code: 'yo',  name: 'Yorùbá' },
      { code: 'ig',  name: 'Igbo' },
      { code: 'zu',  name: 'isiZulu' },
      { code: 'xh',  name: 'isiXhosa' },
      { code: 'nd',  name: 'isiNdebele' },
      { code: 'nso', name: 'Sesotho sa Leboa' },
      { code: 'sn',  name: 'chiShona' },
      { code: 'rw',  name: 'Kinyarwanda' },
      { code: 'ki',  name: 'Gĩkũyũ' },
      { code: 'luo', name: 'Dholuo' },
      { code: 'ach', name: 'Acholi' },
      { code: 'din', name: 'Thuɔŋjäŋ' },
      { code: 'wo',  name: 'Wolof' },
      { code: 'ny',  name: 'Chichewa' },
      { code: 'ln',  name: 'Lingála' },
      { code: 'ti',  name: 'ትግርኛ' },
      { code: 'om',  name: 'Afaan Oromoo' },
      { code: 'lg',  name: 'Luganda' },
      { code: 'st',  name: 'Sesotho' },
      { code: 've',  name: 'Tshivenda' },
      { code: 'ts',  name: 'Xitsonga' },
      { code: 'tn',  name: 'Setswana' },
      { code: 'ss',  name: 'siSwati' },
      { code: 'bem', name: 'Icibemba' },
      { code: 'bm',  name: 'Bamanankan' },
      { code: 'ff',  name: 'Fulfulde' },
      { code: 'tw',  name: 'Twi' },
      { code: 'ee',  name: 'Eʋegbe' },
      { code: 'fon', name: 'Fongbe' },
      { code: 'mos', name: 'Mooré' },
      { code: 'kg',  name: 'Kikongo' },
      { code: 'sg',  name: 'Sängö' },
      { code: 'wal', name: 'Wolaytta' },
      { code: 'aa',  name: 'Qafar af' },
      { code: 'tum', name: 'Chitumbuka' },
      { code: 'loz', name: 'Silozi' },
      { code: 'gaa', name: 'Ga' },
      { code: 'lua', name: 'Tshiluba' },
      { code: 'mer', name: 'Kĩmĩrũ' },
      { code: 'kln', name: 'Kalenjin' },
      { code: 'nus', name: 'Thok Nath' },
      { code: 'mas', name: 'Maa' },
      { code: 'ebu', name: 'Kĩembu' },
      { code: 'cgg', name: 'Rukiga' },
      { code: 'xog', name: 'Lusoga' },
      { code: 'dyo', name: 'Jóola' },
      { code: 'nup', name: 'Nupe' },
      { code: 'luy', name: 'Luhya' },
      { code: 'dua', name: 'Duala' },
      { code: 'guz', name: 'Ekegusii' },
      { code: 'kam', name: 'Kikamba' },
      { code: 'teo', name: 'Ateso' },
      { code: 'dje', name: 'Zarma' },
      { code: 'ses', name: 'Koyraboro Senni' },
      { code: 'men', name: 'Mende' },
      { code: 'kpe', name: 'Kpelle' },
      { code: 'seh', name: 'Sena' },
      { code: 'rn',  name: 'Ikirundi' },
      { code: 'sbp', name: 'Ishisangu' },
      { code: 'rwk', name: 'Kiruwa' },
      { code: 'vun', name: 'Kimashami' },
      { code: 'lag', name: 'Kɨlaangi' },
      { code: 'bez', name: 'Kiyungu' },
      { code: 'jmc', name: 'Kimachame' },
      { code: 'kde', name: 'Shimakonde' },
      { code: 'asa', name: 'Kipare' },
      { code: 'mgh', name: 'Emakhuwa' },
      { code: 'fuv', name: 'Fulfulde' },
      { code: 'nmg', name: 'Ŋkôs' },
      { code: 'jgo', name: "Ndaꞌa" },
      { code: 'nnh', name: 'Shüŋ' },
      { code: 'bas', name: 'Ɓasaá' },
      { code: 'yav', name: 'nuasue' },
      { code: 'agq', name: 'Aghem' },
      { code: 'mua', name: 'MUNDAŊ' },
      { code: 'mgo', name: "metaʼ" },
      { code: 'bci', name: 'Baoulé' },
      { code: 'tem', name: 'Timne' },
      { code: 'nyo', name: 'Runyoro' },
      { code: 'ttj', name: 'Rutooro' },
      { code: 'kbp', name: 'Kabɩyɛ' },
      { code: 'snk', name: 'Soninke' },
      { code: 'bbj', name: "Ghomálá'" },
      { code: 'vai', name: 'ꕙꔤ' },
      { code: 'sus', name: 'Sosoxui' },
      { code: 'kri', name: 'Krio' },
      { code: 'pcm', name: 'Naijá' },
      { code: 'nqo', name: 'ߒߞߏ' },
      { code: 'alz', name: 'Dha Alur' },
      { code: 'lgg', name: 'Lugbara' },
      { code: 'bss', name: 'Akoose' },
      { code: 'kcg', name: 'Tyap' },
      { code: 'bej', name: 'Bidhaawyeet' },
      { code: 'byv', name: 'Medumba' },
      { code: 'heh', name: 'Kihehe' },
      { code: 'rof', name: 'Kirombo' },
      { code: 'twq', name: 'Tasawaq' },
      { code: 'khq', name: 'Koyra ciini' },
      { code: 'ibb', name: 'Ibibio' },
      { code: 'tiv', name: 'Tiv' },
      { code: 'urh', name: 'Urhobo' },
      { code: 'bin', name: 'Edo' },
      { code: 'gur', name: 'Farefare' },
      { code: 'dag', name: 'Dagbani' },
      { code: 'kea', name: 'Kabuverdianu' },
      { code: 'acf', name: 'Kwéyòl' },
      { code: 'ktu', name: 'Kikongo ya leta' },
      { code: 'nzi', name: 'Nzema' },
      { code: 'lun', name: 'Chilunda' },
      { code: 'nyn', name: 'Runyankore' },
      { code: 'suk', name: 'Kisukuma' },
      { code: 'grb', name: 'Grebo' },
      { code: 'shu', name: 'عربي تشادي' },
      { code: 'wni', name: 'Shingazidja' },
      { code: 'swb', name: 'Shimaore' },
      { code: 'hz',  name: 'Otjiherero' },
      { code: 'ndo', name: 'Oshindonga' },
      { code: 'umb', name: 'Umbundu' },
      { code: 'kmb', name: 'Kimbundu' },
      { code: 'ybb', name: 'Yemba' },
      { code: 'lns', name: 'Lamnso' },
      { code: 'nr',  name: 'isiNdebele' },
      { code: 'bum', name: 'Bulu' },
      { code: 'ewo', name: 'Ewondo' },
      { code: 'fmp', name: "Fʼe fʼe" },
      { code: 'bkm', name: 'Kom' },
      { code: 'srn', name: 'Sranan Tongo' },
    ],
  },
  {
    group: 'Indigenous Americas',
    langs: [
      { code: 'qu',  name: 'Runasimi' },
      { code: 'gn',  name: 'Avañeʼẽ' },
      { code: 'ay',  name: 'Aymar aru' },
      { code: 'nah', name: 'Nāhuatl' },
      { code: 'yua', name: 'Maaya Tʼaan' },
      { code: 'quc', name: 'Kʼicheʼ' },
      { code: 'arn', name: 'Mapudungun' },
      { code: 'nv',  name: 'Diné Bizaad' },
      { code: 'lkt', name: 'Lakȟótiyapi' },
      { code: 'oj',  name: 'Anishinaabemowin' },
      { code: 'iu',  name: 'ᐃᓄᒃᑎᑐᑦ' },
      { code: 'chr', name: 'ᏣᎳᎩ' },
      { code: 'cr',  name: 'ᓀᐦᐃᔭᐍᐏᐣ' },
      { code: 'moh', name: "Kanienʼkéha" },
      { code: 'tzo', name: "Batsʼi kʼop" },
      { code: 'tzh', name: "Batsʼil kʼop" },
      { code: 'cho', name: 'Chahta' },
      { code: 'mam', name: 'Mam' },
      { code: 'kek', name: "Q'eqchi'" },
      { code: 'otq', name: 'Hñähñu' },
      { code: 'win', name: 'Hocąk' },
      { code: 'zap', name: 'Diidxazá' },
      { code: 'hch', name: 'Wixaritari' },
      { code: 'dak', name: 'Dakota' },
      { code: 'pot', name: 'Bodéwadmi' },
      { code: 'ctu', name: "Chʼol" },
      { code: 'tsz', name: "P'urhépecha" },
      { code: 'cab', name: 'Garifuna' },
      { code: 'kaq', name: 'Kaqchikel' },
      { code: 'miq', name: 'Miskitu' },
      { code: 'tar', name: 'Rarámuri' },
      { code: 'pbb', name: 'Nasa Yuwe' },
      { code: 'jiv', name: 'Shuar-Chicham' },
      { code: 'ngu', name: 'Nahuatl' },
      { code: 'yrl', name: 'Nheengatu' },
      { code: 'kgp', name: 'Kanhgág' },
      { code: 'otm', name: 'Hñähñu' },
      { code: 'maz', name: 'Jñatho' },
      { code: 'mix', name: 'Mixteco' },
      { code: 'hus', name: 'Teenek' },
      { code: 'czn', name: 'Chatino' },
      { code: 'crj', name: 'Nēhiyawēwin' },
      { code: 'tli', name: 'Lingít' },
      { code: 'gwi', name: "Gwich'in" },
      { code: 'tsi', name: "Sm'algyax" },
      { code: 'oka', name: 'Nsyilxcən' },
      { code: 'str', name: 'SENĆOŦEN' },
      { code: 'acr', name: "Achi'" },
      { code: 'nch', name: 'Nahuatl' },
      { code: 'zun', name: "Shiwi'ma" },
      { code: 'mto', name: 'Ayöök' },
      { code: 'tzj', name: "Tz'utujil" },
      { code: 'top', name: 'Totonaku' },
      { code: 'yad', name: 'Yagua' },
      { code: 'gub', name: 'Guajajara' },
    ],
  },
  {
    group: 'Constructed & Classical',
    langs: [
      { code: 'eo',  name: 'Esperanto' },
      { code: 'ia',  name: 'Interlingua' },
      { code: 'io',  name: 'Ido' },
      { code: 'vo',  name: 'Volapük' },
      { code: 'tok', name: 'toki pona' },
      { code: 'nov', name: 'Novial' },
      { code: 'jbo', name: 'la lojban' },
      { code: 'lfn', name: 'Lingua Franca Nova' },
      { code: 'prg', name: 'Prūsiskan' },
      { code: 'cop', name: 'ⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ' },
      { code: 'lzh', name: '文言' },
      { code: 'got', name: '𐌲𐌿𐍄𐌹𐍃𐌺' },
      { code: 'non', name: 'Norrœnt' },
      { code: 'enm', name: 'Middle English' },
      { code: 'tlh', name: 'tlhIngan Hol' },
      { code: 'sjn', name: 'Sindarin' },
    ],
  },
]

let container = null
let unsub = null

export function mountSettings(el) {
  container = el
  unsub = subscribe(() => render())
  render()
}

export function unmountSettings() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

function render() {
  if (!container) return
  const state = getState()
  const s = state.settings

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Settings</h1>

      <!-- Profile -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Profile</h2>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Display Name</label>
          <div class="flex gap-2">
            <input id="display-name-input" type="text" maxlength="24"
              value="${state.user.displayName}"
              class="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
            <button id="save-name-btn" class="px-4 py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">Save</button>
          </div>
        </div>
        ${supabase ? `
        <div class="border-t border-border pt-4">
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Change Password</label>
          <div class="space-y-2">
            <input id="new-password-input" type="password" placeholder="New password (min 6 chars)"
              class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
            <input id="confirm-password-input" type="password" placeholder="Confirm new password"
              class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
            <button id="change-password-btn" class="px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors">
              Update Password
            </button>
            <div id="pw-error" class="hidden text-xs text-loss"></div>
          </div>
        </div>` : ''}
      </section>

      <!-- Appearance -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Appearance</h2>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-3 block">Theme</label>
          <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
            ${THEMES.map(th => {
              const active = (s.theme ?? 'dark') === th.id
              return `
                <button data-theme="${th.id}"
                  class="theme-btn relative flex flex-col items-center gap-1.5 pt-2 pb-2.5 px-1 rounded-xl border transition-all
                  ${active ? 'border-accent-primary ring-2 ring-accent-primary/30' : 'border-border hover:border-accent-primary/40'}">
                  <!-- Swatch -->
                  <div class="w-full h-7 rounded-lg overflow-hidden flex gap-0" style="background:rgb(${th.bg})">
                    <div class="w-1/2 h-full" style="background:rgb(${th.a1});opacity:0.85"></div>
                    <div class="w-1/3 h-full" style="background:rgb(${th.a2});opacity:0.7"></div>
                  </div>
                  <span class="text-[10px] font-medium ${active ? 'text-text-primary' : 'text-text-muted'} leading-none">${th.name}</span>
                  ${active ? '<div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-primary"></div>' : ''}
                </button>
              `
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Language -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Language</h2>
        <div class="space-y-3">
          ${LANGUAGE_GROUPS.map(group => `
            <div>
              <div class="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">${group.group}</div>
              <div class="flex flex-wrap gap-1.5">
                ${group.langs.map(lang => {
                  const active = (s.language ?? 'en') === lang.code
                  return `<button data-lang="${lang.code}"
                    class="lang-btn px-3 py-1 rounded-lg text-xs font-medium border transition-all
                    ${active ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface-elevated border-border text-text-secondary hover:border-accent-primary/40 hover:text-text-primary'}">
                    ${lang.name}
                  </button>`
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Audio -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Audio</h2>

        <div class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Sound Effects</span>
          <button id="sfx-toggle" class="relative w-11 h-6 rounded-full transition-colors ${s.soundEnabled ? 'bg-accent-primary' : 'bg-surface-elevated border border-border'}">
            <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${s.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}"></div>
          </button>
        </div>

        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 flex justify-between">
            <span>SFX Volume</span>
            <span id="sfx-vol-label">${s.sfxVolume ?? 70}%</span>
          </label>
          <input id="sfx-volume" type="range" min="0" max="100" value="${s.sfxVolume ?? 70}"
            class="w-full accent-accent-primary" />
        </div>
      </section>

      <!-- Price Alerts -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-text-primary">Price Alerts</h2>
          <button id="add-alert-btn" class="px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary hover:text-bg transition-colors">
            + Add Alert
          </button>
        </div>

        ${state.priceAlerts.length === 0
          ? `<div class="text-sm text-text-muted">No price alerts set. Add one to get notified when a stock crosses a threshold.</div>`
          : `<div class="divide-y divide-border">
              ${state.priceAlerts.map(alert => `
                <div class="flex items-center justify-between py-3">
                  <div>
                    <span class="font-mono font-semibold text-text-primary">${alert.symbol}</span>
                    <span class="text-text-muted text-xs ml-2">${alert.direction === 'above' ? '↑ above' : '↓ below'} ${pc(alert.threshold)}</span>
                    ${!alert.active ? '<span class="text-[10px] text-text-muted ml-2">(triggered)</span>' : ''}
                  </div>
                  <button data-remove-alert="${alert.id}"
                    class="text-xs text-loss hover:text-loss/80 transition-colors">Remove</button>
                </div>
              `).join('')}
             </div>`}

        <!-- Add alert form (hidden by default) -->
        <div id="alert-form" class="hidden space-y-3 pt-3 border-t border-border">
          <div class="relative">
            <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Stock Symbol</label>
            <input id="alert-symbol-search" type="text" autocomplete="off" placeholder="Search symbol or company..."
              class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary
                     focus:outline-none focus:border-accent-primary transition-colors" />
            <input id="alert-symbol" type="hidden" value="" />
            <div id="alert-symbol-dropdown"
              class="hidden absolute left-0 right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
            </div>
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Direction</label>
              <select id="alert-direction" class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary">
                <option value="above">Price goes ABOVE</option>
                <option value="below">Price goes BELOW</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Threshold (PC$)</label>
              <input id="alert-threshold" type="number" min="0.01" step="0.01" placeholder="0.00"
                class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
            </div>
          </div>
          <button id="save-alert-btn" class="w-full py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">Save Alert</button>
        </div>
      </section>

      <!-- Watchlist -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Watchlist</h2>
        ${state.watchlist.length === 0
          ? `<div class="text-sm text-text-muted">No stocks on your watchlist. Add them from any stock page.</div>`
          : `<div class="divide-y divide-border">
              ${state.watchlist.map(sym => {
                const stock = STOCKS.find(s => s.symbol === sym)
                return `
                  <div class="flex items-center justify-between py-3">
                    <div>
                      <span class="font-mono font-semibold text-text-primary">${sym}</span>
                      <span class="text-text-muted text-xs ml-2">${stock?.name ?? ''}</span>
                    </div>
                    <button data-remove-watch="${sym}" class="text-xs text-loss hover:text-loss/80 transition-colors">Remove</button>
                  </div>
                `
              }).join('')}
             </div>`}
      </section>

      <!-- Danger Zone -->
      <section class="bg-surface border border-loss/30 rounded-2xl p-5 space-y-3">
        <h2 class="font-semibold text-loss">Danger Zone</h2>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-text-primary">Replay Tutorial</div>
            <div class="text-xs text-text-muted">Walk through the guided tour again.</div>
          </div>
          <button id="replay-tutorial-btn" class="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-primary transition-colors">
            Replay
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-text-primary">Reset Portfolio</div>
            <div class="text-xs text-text-muted">Wipes all holdings, transactions, XP, and achievements. Restores PC$50,000.</div>
          </div>
          <button id="reset-btn" class="px-4 py-2 rounded-lg border border-loss/40 text-loss text-sm hover:bg-loss/10 transition-colors">
            Reset
          </button>
        </div>
      </section>

    </div>
  `

  bindEvents()
}

function bindEvents() {
  // Display name
  container.querySelector('#save-name-btn')?.addEventListener('click', () => {
    const val = container.querySelector('#display-name-input')?.value.trim()
    if (!val) { toast('Name cannot be empty', 'error'); return }
    setDisplayName(val)
    toast('Display name updated!', 'success')
  })

  // Password change
  container.querySelector('#change-password-btn')?.addEventListener('click', async () => {
    const pw  = container.querySelector('#new-password-input')?.value
    const pw2 = container.querySelector('#confirm-password-input')?.value
    const err = container.querySelector('#pw-error')
    err.classList.add('hidden')
    if (!pw || pw.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); return }
    if (pw !== pw2) { err.textContent = 'Passwords do not match.'; err.classList.remove('hidden'); return }
    const btn = container.querySelector('#change-password-btn')
    btn.disabled = true; btn.textContent = 'Updating…'
    const { error } = await supabase.auth.updateUser({ password: pw })
    btn.disabled = false; btn.textContent = 'Update Password'
    if (error) { err.textContent = error.message; err.classList.remove('hidden') }
    else {
      container.querySelector('#new-password-input').value = ''
      container.querySelector('#confirm-password-input').value = ''
      toast('Password updated!', 'success')
    }
  })

  // Audio
  container.querySelector('#sfx-toggle')?.addEventListener('click', () => {
    updateSettings({ soundEnabled: !getState().settings.soundEnabled })
  })

  const sfxSlider = container.querySelector('#sfx-volume')
  sfxSlider?.addEventListener('input', () => {
    container.querySelector('#sfx-vol-label').textContent = sfxSlider.value + '%'
    updateSettings({ sfxVolume: Number(sfxSlider.value) })
  })

  // Price alerts
  container.querySelector('#add-alert-btn')?.addEventListener('click', () => {
    const form = container.querySelector('#alert-form')
    form?.classList.toggle('hidden')
    // Reset search when opening
    if (!form?.classList.contains('hidden')) {
      const s = container.querySelector('#alert-symbol-search')
      const h = container.querySelector('#alert-symbol')
      if (s) s.value = ''
      if (h) h.value = ''
      container.querySelector('#alert-symbol-dropdown')?.classList.add('hidden')
    }
  })

  container.querySelectorAll('[data-remove-alert]').forEach(btn => {
    btn.addEventListener('click', () => {
      removePriceAlert(btn.dataset.removeAlert)
      toast('Alert removed', 'info')
    })
  })

  // Symbol search
  const alertSearch = container.querySelector('#alert-symbol-search')
  const alertDrop   = container.querySelector('#alert-symbol-dropdown')
  const alertHidden = container.querySelector('#alert-symbol')

  function _renderAlertDrop(q) {
    if (!alertDrop) return
    const matches = STOCKS.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 50)
    if (!matches.length || !q) { alertDrop.classList.add('hidden'); return }
    alertDrop.innerHTML = matches.map(s => `
      <button type="button" data-sym="${s.symbol}" data-name="${s.name}"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-elevated text-left transition-colors">
        <span class="font-mono font-semibold text-text-primary w-14 shrink-0">${s.symbol}</span>
        <span class="text-text-muted truncate">${s.name}</span>
      </button>
    `).join('')
    alertDrop.classList.remove('hidden')
    alertDrop.querySelectorAll('[data-sym]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (alertHidden) alertHidden.value = btn.dataset.sym
        if (alertSearch) alertSearch.value = `${btn.dataset.sym} — ${btn.dataset.name}`
        alertDrop.classList.add('hidden')
      })
    })
  }

  alertSearch?.addEventListener('input', () => _renderAlertDrop(alertSearch.value.toLowerCase()))
  alertSearch?.addEventListener('focus', () => { if (alertSearch.value) _renderAlertDrop(alertSearch.value.toLowerCase()) })

  document.addEventListener('click', (e) => {
    if (alertDrop && !alertDrop.contains(e.target) && e.target !== alertSearch) {
      alertDrop.classList.add('hidden')
    }
  }, { capture: true })

  container.querySelector('#save-alert-btn')?.addEventListener('click', () => {
    const symbol    = container.querySelector('#alert-symbol')?.value
    const direction = container.querySelector('#alert-direction')?.value
    const threshold = parseFloat(container.querySelector('#alert-threshold')?.value)
    if (!symbol || !direction || isNaN(threshold) || threshold <= 0) {
      toast('Please select a stock and fill in all alert fields', 'error'); return
    }
    addPriceAlert({ symbol, direction, threshold })
    toast(`Alert set: ${symbol} ${direction} ${pc(threshold)}`, 'success')
    container.querySelector('#alert-form')?.classList.add('hidden')
  })

  // Theme
  container.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme
      updateSettings({ theme })
      applyTheme(theme)
    })
  })

  // Language
  container.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang)
      renderNavbar()
    })
  })

  // Watchlist remove
  container.querySelectorAll('[data-remove-watch]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWatchlist(btn.dataset.removeWatch)
    })
  })

  // Danger zone
  container.querySelector('#replay-tutorial-btn')?.addEventListener('click', startTutorial)

  container.querySelector('#reset-btn')?.addEventListener('click', () => {
    if (confirm('Reset your portfolio to PC$50,000? All holdings and transactions will be deleted. This cannot be undone.')) {
      resetPortfolio()
      toast('Portfolio reset!', 'info')
    }
  })
}
