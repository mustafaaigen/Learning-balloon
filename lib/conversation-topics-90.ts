import { ConversationItem, LanguageInfo } from './languages';

export interface ConversationTopicNode {
  id: number; // 1..90
  sectionNumber: number; // 1..9
  unitNumber: number; // 1..18 (5 topics per unit)
  icon: string;
  accentColor: string;
  titleEn: string;
  titleUr: string;
  titleHi: string;
  titleAr: string;
  titleFa: string;
  titleFr: string;
  titleEs: string;
  titleDe: string;
  titleTr: string;
  titleRu: string;
  titleZh: string;
  titleJa: string;
  titleKo: string;
}

const RAW_NINETY_TOPICS: Array<{
  icon: string;
  en: string;
  ur: string;
  hi: string;
  ar: string;
  fa: string;
  fr: string;
  es: string;
  de: string;
  tr: string;
  ru: string;
  zh: string;
  ja: string;
  ko: string;
}> = [
  // SECTION 1 (Topics 1–10): Traveler Arrival, Airport, Hotel & First Steps
  { icon: '🛬', en: 'Airport Arrival & Passport Control', ur: 'ایئرپورٹ آمد اور پاسپورٹ کنٹرول', hi: 'एयरपोर्ट आगमन और पासपोर्ट जांच', ar: 'الوصول للمطار ومراقبة الجوازات', fa: 'ورود به فرودگاه و کنترل گذرنامه', fr: 'Arrivée à l’aéroport et passeport', es: 'Llegada al aeropuerto y pasaporte', de: 'Flughafenankunft & Passkontrolle', tr: 'Havalimanı Varış ve Pasaport', ru: 'Прибытие в аэропорт и паспортный контроль', zh: '机场抵达与护照检查', ja: '空港到着と入国審査', ko: '공항 도착 및 여권 심사' },
  { icon: '🧳', en: 'Baggage Claim & Customs', ur: 'سامان کی وصولی اور کسٹمز', hi: 'सामान प्राप्ति और कस्टम', ar: 'استلام الأمتعة والجمارك', fa: 'تحویل بار و گمرک', fr: 'Bagages et douane', es: 'Equipaje y aduana', de: 'Gepäckausgabe & Zoll', tr: 'Bagaj Teslim ve Gümrük', ru: 'Получение багажа и таможня', zh: '提取行李与海关', ja: '手荷物受取と税関', ko: '수하물 찾기 및 세관' },
  { icon: '📶', en: 'Getting a Local SIM Card & Wi-Fi', ur: 'مقامی سم کارڈ اور وائی فائی لینا', hi: 'लोकल सिम कार्ड और वाई-फाई लेना', ar: 'شراء شريحة اتصال محلية وواي فاي', fa: 'تهیه سیم‌کارت محلی و وای‌فای', fr: 'Acheter une carte SIM et Wi-Fi', es: 'Comprar tarjeta SIM y Wi-Fi', de: 'Lokale SIM-Karte & WLAN holen', tr: 'Yerel SIM Kart ve Wi-Fi Alma', ru: 'Покупка местной SIM-карты и Wi-Fi', zh: '购买当地电话卡与无线网', ja: '現地SIMカードとWi-Fiの取得', ko: '현지 유심칩 및 와이파이 구매' },
  { icon: '💱', en: 'Currency Exchange & ATM', ur: 'کرنسی ایکسچینج اور اے ٹی ایم', hi: 'मुद्रा विनिमय और एटीएम', ar: 'صرف العملات والصراف الآلي', fa: 'صرافی و خودپرداز بانکی', fr: 'Change de devises et distributeur', es: 'Cambio de divisas y cajero', de: 'Geldwechsel & Geldautomat', tr: 'Döviz Bürosu ve ATM', ru: 'Обмен валюты и банкомат', zh: '货币兑换与取款机', ja: '両替とATMの利用', ko: '환전 및 ATM 이용' },
  { icon: '🚕', en: 'Taking a Taxi or Airport Shuttle', ur: 'ٹیکسی یا ایئرپورٹ شٹل لینا', hi: 'टैक्सी या एयरपोर्ट शटल लेना', ar: 'ركوب سيارة أجرة أو حافلة المطار', fa: 'گرفتن تاکسی یا شاتل فرودگاه', fr: 'Prendre un taxi ou une navette', es: 'Tomar un taxi o autobús del aeropuerto', de: 'Taxi oder Flughafenshuttle nehmen', tr: 'Taksi veya Havalimanı Servisi', ru: 'Поездка на такси или шаттле', zh: '乘坐出租车或机场巴士', ja: 'タクシーや空港シャトルの利用', ko: '택시 및 공항 셔틀 타기' },
  { icon: '🏨', en: 'Hotel Check-In & Room Keys', ur: 'ہوٹل چیک اِن اور کمرے کی چابی', hi: 'होटल चेक-इन और कमरे की चाबी', ar: 'تسجيل الوصول في الفندق ومفتاح الغرفة', fa: 'پذیرش در هتل و کلید اتاق', fr: 'Enregistrement à l’hôtel et clés', es: 'Registro en el hotel y llaves', de: 'Hotel-Check-in & Zimmerschlüssel', tr: 'Otel Girişi ve Oda Anahtarı', ru: 'Заселение в отель и ключи', zh: '酒店入住与房卡', ja: 'ホテルのチェックインと部屋の鍵', ko: '호텔 체크인 및 객실 키' },
  { icon: '🛎️', en: 'Asking Hotel Staff for Help', ur: 'ہوٹل اسٹاف سے مدد اور سہولیات مانگنا', hi: 'होटल स्टाफ से मदद मांगना', ar: 'طلب المساعدة من موظفي الفندق', fa: 'درخواست کمک از کارکنان هتل', fr: 'Demander de l’aide au personnel', es: 'Pedir ayuda al personal del hotel', de: 'Hotelpersonal um Hilfe bitten', tr: 'Otel Personelinden Yardım İsteme', ru: 'Обращение к персоналу отеля', zh: '向酒店员工寻求帮助', ja: 'ホテルスタッフへの質問と依頼', ko: '호텔 직원에게 도움 요청하기' },
  { icon: '👋', en: 'Polite Greetings Like a Local', ur: 'مقامی لوگوں کی طرح خوش اخلاقی سے سلام دعا', hi: 'स्थानीय लोगों की तरह विनम्र अभिवादन', ar: 'التحيات المهذبة مثل أهل البلد', fa: 'احوال‌پرسی محترمانه مثل بومی‌ها', fr: 'Salutations polies comme un local', es: 'Saludos corteses como un local', de: 'Höfliche Begrüßung wie ein Einheimischer', tr: 'Yerliler Gibi Nazik Selamlaşma', ru: 'Вежливые приветствия как местный', zh: '像当地人一样礼貌问候', ja: '現地の人のような丁寧な挨拶', ko: '현지인처럼 정중하게 인사하기' },
  { icon: '🌍', en: 'Talking About Home Countries', ur: 'آبائی ممالک اور اپنے شہر پر بات کریں', hi: 'अपने देश और शहर के बारे में बात करें', ar: 'التحدث عن البلدان الأصلية ومدينتك', fa: 'صحبت درباره کشور و شهر زادگاه', fr: 'Parler de son pays d’origine', es: 'Hablar de los países de origen', de: 'Über Heimatländer sprechen', tr: 'Memleket ve Ülkeler Hakkında Konuşma', ru: 'Разговор о родных странах', zh: '谈论祖国与家乡', ja: '出身国や故郷について話す', ko: '고향과 출신 국가 이야기하기' },
  { icon: '🗺️', en: 'Asking for Directions on the Street', ur: 'سڑک پر راستہ اور پتہ پوچھنا', hi: 'सड़क पर रास्ता और पता पूछना', ar: 'السؤال عن الاتجاهات في الشارع', fa: 'پرسیدن آدرس و مسیر در خیابان', fr: 'Demander son chemin dans la rue', es: 'Pedir direcciones en la calle', de: 'Auf der Straße nach dem Weg fragen', tr: 'Sokakta Adres ve Yön Sorma', ru: 'Как спросить дорогу на улице', zh: '在街上问路', ja: '道端で道を尋ねる', ko: '거리에서 길 물어보기' },

  // SECTION 2 (Topics 11–20): Public Transport, Cafes, Restaurants & Street Food
  { icon: '🚇', en: 'Riding the Metro & Subway', ur: 'میٹرو اور ٹرین کا سفر', hi: 'मेट्रो और सबवे में यात्रा', ar: 'ركوب المترو والقطار الأنفاق', fa: 'سفر با مترو و قطار شهری', fr: 'Prendre le métro', es: 'Viajar en metro', de: 'U-Bahn & Metro fahren', tr: 'Metro ile Seyahat', ru: 'Поездка на метро', zh: '乘坐地铁', ja: '地下鉄や電車の利用', ko: '지하철 타고 이동하기' },
  { icon: '🚌', en: 'City Buses & Transit Cards', ur: 'سٹی بس اور ٹریول کارڈ کا استعمال', hi: 'सिटी बस और ट्रांजिट कार्ड', ar: 'حافلات المدينة وبطاقات النقل', fa: 'اتوبوس شهری و کارت حمل‌ونقل', fr: 'Bus de ville et carte de transport', es: 'Autobuses urbanos y tarjeta de transporte', de: 'Stadtbusse & Fahrkarten', tr: 'Şehir Otobüsü ve Ulaşım Kartı', ru: 'Городские автобусы и проездные', zh: '公交车与交通卡', ja: '市内バスと交通ICカード', ko: '시내버스와 교통카드 이용' },
  { icon: '☕', en: 'Ordering Coffee & Bakery Treats', ur: 'کافی شاپ اور بیکری سے آرڈر کرنا', hi: 'कॉफी शॉप और बेकरी में ऑर्डर करना', ar: 'طلب القهوة والمخبوزات في المقهى', fa: 'سفارش قهوه و شیرینی در کافه', fr: 'Commander un café et des pâtisseries', es: 'Pedir café y pastelería', de: 'Kaffee & Gebäck bestellen', tr: 'Kafede Kahve ve Kruvasan Siparişi', ru: 'Заказ кофе и выпечки в кафе', zh: '在咖啡馆点咖啡与甜点', ja: 'カフェでコーヒーとパンを注文', ko: '카페에서 커피와 베이커리 주문' },
  { icon: '🍽️', en: 'Reserving a Table at a Restaurant', ur: 'ریسٹورنٹ میں ٹیبل بک کروانا', hi: 'रेस्तरां में टेबल बुक करना', ar: 'حجز طاولة في مطعم', fa: 'رزرو میز در رستوران', fr: 'Réserver une table au restaurant', es: 'Reservar una mesa en el restaurante', de: 'Einen Tisch im Restaurant reservieren', tr: 'Restoranda Masa Rezervasyonu', ru: 'Бронирование столика в ресторане', zh: '在餐厅预订餐桌', ja: 'レストランで席を予約する', ko: '레스토랑 테이블 예약하기' },
  { icon: '🥘', en: 'Ordering Local Specialties & Halal/Veg Food', ur: 'مقامی کھانے اور حلال یا سبزی خور کھانا مانگنا', hi: 'स्थानीय व्यंजन और शाकाहारी/हलाल खाना', ar: 'طلب الأطباق المحلية والطعام الحلال أو النباتي', fa: 'سفارش غذای محلی و حلال یا گیاهی', fr: 'Commander des spécialités locales', es: 'Pedir platos locales y comida halal/veg', de: 'Lokale Spezialitäten bestellen', tr: 'Yöresel Yemekler ve Helal/Sebze Seçimi', ru: 'Заказ местных блюд и халяльной/вег еды', zh: '点当地特色菜与清真/素食', ja: '名物料理やハラール・ベジタリアン注文', ko: '현지 특식 및 할랄/채식 메뉴 주문' },
  { icon: '🍢', en: 'Exploring Street Food Markets', ur: 'اسٹریٹ فوڈ اور رات کے بازار کی سیر', hi: 'स्ट्रीट फूड बाजार का आनंद लेना', ar: 'تجربة طعام الشارع والأسواق الشعبية', fa: 'گشت‌وگذار در بازار غذاهای خیابانی', fr: 'Explorer les marchés de cuisine de rue', es: 'Explorar mercados de comida callejera', de: 'Streetfood-Märkte entdecken', tr: 'Sokak Lezzetleri Pazarını Keşfetme', ru: 'Знакомство с уличной едой', zh: '探索街头美食夜市', ja: '屋台やストリートフードを楽しむ', ko: '길거리 음식 시장 탐방하기' },
  { icon: '🧾', en: 'Asking for the Bill & Tipping', ur: 'بل مانگنا اور ادائیگی کرنا', hi: 'बिल मांगना और भुगतान करना', ar: 'طلب الفاتورة والدفع والإكرامية', fa: 'درخواست صورت‌حساب و پرداخت', fr: 'Demander l’addition et le pourboire', es: 'Pedir la cuenta y propina', de: 'Nach der Rechnung fragen & Trinkgeld', tr: 'Hesap İsteme ve Bahşiş', ru: 'Просьба принести счёт и чаевые', zh: '买单结账与小费', ja: 'お会計とチップの支払い', ko: '계산서 요청 및 팁 지불하기' },
  { icon: '🛒', en: 'Grocery Shopping at the Supermarket', ur: 'سپر مارکیٹ سے روزمرہ کا سامان خریدنا', hi: 'सुपरमार्केट से किराने का सामान खरीदना', ar: 'التسوق لشراء البقالة من السوبرماركت', fa: 'خرید روزانه از سوپرمارکت', fr: 'Faire les courses au supermarché', es: 'Comprar comestibles en el supermercado', de: 'Lebensmitteleinkauf im Supermarkt', tr: 'Süpermarketten Mutfak Alışverişi', ru: 'Покупка продуктов в супермаркете', zh: '在超市购买日常食品', ja: 'スーパーで日用品や食材を買う', ko: '슈퍼마켓에서 장보기' },
  { icon: '🍎', en: 'Fresh Fruit & Farmers Market Bargaining', ur: 'پھل منڈی میں بھاؤ تاؤ اور خریداری', hi: 'फल और किसान बाजार में मोलभाव', ar: 'سوق الفواكه والخضروات والمساومة اللطيفة', fa: 'خرید میوه تازه و چانه‌زنی محترمانه', fr: 'Marché aux fruits frais et négociation', es: 'Mercado de frutas frescas y regateo', de: 'Obstmarkt & freundlich verhandeln', tr: 'Semt Pazarında Taze Meyve ve Pazarlık', ru: 'Фруктовый рынок и дружелюбный торг', zh: '生鲜果蔬市场与礼貌讲价', ja: '青果市場での買い物と値段交渉', ko: '청과물 시장에서 과일 사기' },
  { icon: '👕', en: 'Shopping for Clothes, Sizes & Refunds', ur: 'کپڑوں کی خریداری، سائز اور تبدیلی', hi: 'कपड़ों की खरीदारी, साइज और वापसी', ar: 'شراء الملابس والمقاسات والاستبدال', fa: 'خرید لباس، سایزها و تعویض کالا', fr: 'Acheter des vêtements, tailles et retours', es: 'Comprar ropa, tallas y devoluciones', de: 'Kleidung kaufen, Größen & Umtausch', tr: 'Kıyafet Alışverişi, Beden ve İade', ru: 'Покупка одежды, размеры и возврат', zh: '买衣服、尺码与退换货', ja: '服の買い物・サイズ確認・返品', ko: '옷 쇼핑, 사이즈 문의 및 환불' },

  // SECTION 3 (Topics 21–30): Sightseeing, Culture, Weather & Making Friends
  { icon: '🏛️', en: 'Buying Museum & Attraction Tickets', ur: 'میوزیم اور تاریخی مقامات کے ٹکٹ خریدنا', hi: 'संग्रहालय और पर्यटन टिकट खरीदना', ar: 'شراء تذاكر المتاحف والمعالم السياحية', fa: 'خرید بلیت موزه و دیدنی‌ها', fr: 'Acheter des billets de musée', es: 'Comprar entradas para museos', de: 'Museums- & Eintrittskarten kaufen', tr: 'Müze ve Ören Yeri Bileti Alma', ru: 'Покупка билетов в музеи', zh: '购买博物馆与景点门票', ja: '博物館や観光地のチケット購入', ko: '박물관 및 관광지 티켓 구매' },
  { icon: '📸', en: 'Asking Someone to Take a Photo', ur: 'کسی سے تصویر کھینچنے کی درخواست کرنا', hi: 'किसी से फोटो खींचने का अनुरोध करना', ar: 'طلب التقاط صورة تذكارية بلطف', fa: 'درخواست محترمانه برای گرفتن عکس', fr: 'Demander à quelqu’un de prendre une photo', es: 'Pedir a alguien que tome una foto', de: 'Jemanden bitten, ein Foto zu machen', tr: 'Birinden Fotoğraf Çekmesini İsteme', ru: 'Просьба сфотографировать вас', zh: '请路人帮忙拍照', ja: '写真を撮ってもらうよう頼む', ko: '사진 찍어달라고 부탁하기' },
  { icon: '⛩️', en: 'Local Customs & Cultural Etiquette', ur: 'مقامی ثقافت اور آداب کا احترام', hi: 'स्थानीय रीति-रिवाज और शिष्टाचार', ar: 'العادات المحلية وآداب الثقافة', fa: 'آداب و رسوم و فرهنگ محلی', fr: 'Coutumes locales et étiquette culturelle', es: 'Costumbres locales y etiqueta cultural', de: 'Lokale Bräuche & Etikette', tr: 'Yerel Kültür ve Görgü Kuralları', ru: 'Местные обычаи и культурный этикет', zh: '当地风俗与文化礼仪', ja: '現地の習慣とマナーを守る', ko: '현지 관습과 문화 예절' },
  { icon: '🌳', en: 'Walking in Parks & Nature Trails', ur: 'پارک اور قدرتی مناظر کی سیر', hi: 'पार्क और प्रकृति पथों में घूमना', ar: 'التنزه في الحدائق والمسارات الطبيعية', fa: 'قدم زدن در پارک و طبیعت', fr: 'Promenade dans les parcs et la nature', es: 'Pasear por parques y senderos', de: 'Spaziergang im Park & in der Natur', tr: 'Parklarda ve Doğa Yürüyüşünde Sohbet', ru: 'Прогулки в парках и на природе', zh: '在公园与自然步道散步', ja: '公園や自然の遊歩道を散歩する', ko: '공원 및 자연 산책로 걷기' },
  { icon: '🌦️', en: 'Talking About Weather & Seasons', ur: 'موسم اور آب و ہوا پر گفتگو', hi: 'मौसम और ऋतुओं के बारे में बातचीत', ar: 'التحدث عن الطقس والفصول', fa: 'صحبت درباره آب‌وهوا و فصل‌ها', fr: 'Parler de la météo et des saisons', es: 'Hablar del clima y las estaciones', de: 'Über Wetter & Jahreszeiten sprechen', tr: 'Hava Durumu ve Mevsimler', ru: 'Разговор о погоде и временах года', zh: '谈论天气与季节变化', ja: '天気や季節について話す', ko: '날씨와 계절에 대해 이야기하기' },
  { icon: '🤝', en: 'Making New Local Friends', ur: 'مقامی لوگوں سے دوستی کرنا', hi: 'नए स्थानीय दोस्त बनाना', ar: 'تكوين صداقات جديدة مع أهل البلد', fa: 'پیدا کردن دوستان جدید بومی', fr: 'Se faire de nouveaux amis locaux', es: 'Hacer nuevos amigos locales', de: 'Neue einheimische Freunde finden', tr: 'Yeni Yerel Arkadaşlar Edinme', ru: 'Как завести местных друзей', zh: '结交当地新朋友', ja: '現地の新しい友達を作る', ko: '현지에서 새 친구 사귀기' },
  { icon: '🎨', en: 'Sharing Hobbies, Music & Sports', ur: 'مشاغل، موسیقی اور کھیلوں پر بات چیت', hi: 'शौक, संगीत और खेलों पर चर्चा', ar: 'مشاركة الهوايات والموسيقى والرياضة', fa: 'صحبت درباره سرگرمی‌ها، موسیقی و ورزش', fr: 'Partager ses loisirs, musique et sport', es: 'Compartir pasatiempos, música y deportes', de: 'Hobbys, Musik & Sport teilen', tr: 'Hobiler, Müzik ve Spor Sohbeti', ru: 'Хобби, музыка и спорт', zh: '分享个人爱好、音乐与运动', ja: '趣味や音楽・スポーツを語り合う', ko: '취미, 음악, 스포츠 이야기 나누기' },
  { icon: '🎉', en: 'Accepting Invitations to Dinner or Parties', ur: 'رات کے کھانے یا تقریب کی دعوت قبول کرنا', hi: 'डिनर या पार्टी का निमंत्रण स्वीकार करना', ar: 'قبول دعوات العشاء أو المناسبات', fa: 'پذیرفتن دعوت شام یا مهمانی', fr: 'Accepter une invitation à dîner', es: 'Aceptar invitaciones a cenar', de: 'Einladungen zum Abendessen annehmen', tr: 'Akşam Yemeği Davetini Kabul Etme', ru: 'Принятие приглашения на ужин', zh: '接受晚餐或聚会邀请', ja: '夕食やパーティーの招待を受ける', ko: '저녁 식사나 모임 초대 수락하기' },
  { icon: '🎁', en: 'Giving Compliments & Thanking Hosts', ur: 'میزبان کی تعریف اور شکریہ ادا کرنا', hi: 'मेजबान की प्रशंसा और धन्यवाद करना', ar: 'تقديم الإطراء وشكر المضيفين', fa: 'تعریف کردن و تشکر گرم از میزبان', fr: 'Faire des compliments et remercier', es: 'Dar cumplidos y agradecer al anfitrión', de: 'Komplimente machen & Gastgebern danken', tr: 'Ev Sahibine İltifat ve Teşekkür', ru: 'Комплименты и благодарность хозяевам', zh: '赞美他人与感谢主人招待', ja: '褒め言葉とホストへの感謝', ko: '칭찬 건네기와 호스트에게 감사 표현' },
  { icon: '📱', en: 'Exchanging Social Media & Phone Numbers', ur: 'فون نمبر اور سوشل میڈیا شیئر کرنا', hi: 'फोन नंबर और सोशल मीडिया साझा करना', ar: 'تبادل أرقام الهاتف وحسابات التواصل', fa: 'رد و بدل کردن شماره تلفن و شبکه‌های اجتماعی', fr: 'Échanger ses coordonnées et réseaux', es: 'Intercambiar teléfono y redes sociales', de: 'Telefonnummern & Social Media tauschen', tr: 'Telefon Numarası ve Sosyal Medya Paylaşımı', ru: 'Обмен телефонами и соцсетями', zh: '交换电话号码与社交账号', ja: '連絡先やSNSを交換する', ko: '전화번호 및 소셜 미디어 교환' },

  // SECTION 4 (Topics 31–40): Settling In — Apartments, Neighborhood & Utilities
  { icon: '🏠', en: 'Searching for an Apartment to Rent', ur: 'کرائے کے لیے فلیٹ یا گھر تلاش کرنا', hi: 'किराए के लिए अपार्टमेंट ढूंढना', ar: 'البحث عن شقة للإيجار والاستقرار', fa: 'جست‌وجوی آپارتمان برای اجاره', fr: 'Chercher un appartement à louer', es: 'Buscar un apartamento para alquilar', de: 'Eine Mietwohnung suchen', tr: 'Kiralık Daire ve Ev Arama', ru: 'Поиск квартиры в аренду', zh: '寻找租房与看房', ja: '賃貸アパートや部屋を探す', ko: '임대 아파트 및 집 구하기' },
  { icon: '🔑', en: 'Talking to the Landlord & Lease Terms', ur: 'مالک مکان سے کرایہ اور معاہدے پر بات', hi: 'मकान मालिक से किराए और शर्तों पर बात', ar: 'التحدث مع صاحب العقار وشروط العقد', fa: 'صحبت با صاحب‌خانه و قرارداد اجاره', fr: 'Parler au propriétaire et du bail', es: 'Hablar con el propietario y el contrato', de: 'Mit dem Vermieter über den Mietvertrag sprechen', tr: 'Ev Sahibi ve Kira Sözleşmesi', ru: 'Разговор с арендодателем и договор', zh: '与房东洽谈租约条款', ja: '大家さんとの会話と契約条件', ko: '집주인과 임대 계약 조건 상의' },
  { icon: '🛋️', en: 'Shopping for Furniture & Home Essentials', ur: 'فرنیچر اور گھر کا سامان خریدنا', hi: 'फर्नीचर और घर का सामान खरीदना', ar: 'شراء الأثاث ومستلزمات المنزل', fa: 'خرید مبلمان و وسایل منزل', fr: 'Acheter des meubles et articles ménagers', es: 'Comprar muebles y artículos del hogar', de: 'Möbel & Haushaltswaren kaufen', tr: 'Mobilya ve Ev Eşyası Alışverişi', ru: 'Покупка мебели и товаров для дома', zh: '购买家具与家居用品', ja: '家具や生活必需品を揃える', ko: '가구 및 생활용품 쇼핑하기' },
  { icon: '💡', en: 'Setting Up Electricity, Water & Home Internet', ur: 'بجلی، پانی اور گھر کا انٹرنیٹ لگوانا', hi: 'बिजली, पानी और होम इंटरनेट लगवाना', ar: 'تفعيل الكهرباء والماء والإنترنت المنزلي', fa: 'راه‌اندازی برق، آب و اینترنت خانگی', fr: 'Installer l’électricité, l’eau et Internet', es: 'Contratar electricidad, agua e internet', de: 'Strom, Wasser & Heim-Internet einrichten', tr: 'Elektrik, Su ve Ev İnterneti Bağlatma', ru: 'Подключение света, воды и интернета', zh: '开通水电与家庭宽带', ja: '電気・水道・自宅ネットの契約', ko: '전기, 수도 및 집 인터넷 설치' },
  { icon: '👋', en: 'Introducing Yourself to Neighbors', ur: 'نئے پڑوسیوں سے اپنا تعارف کروانا', hi: 'पड़ोसियों से अपना परिचय कराना', ar: 'تقديم نفسك للجيران الجدد', fa: 'آشنایی و معرفی خود به همسایه‌ها', fr: 'Se présenter aux voisins', es: 'Presentarse a los vecinos', de: 'Sich den Nachbarn vorstellen', tr: 'Komşularla Tanışma ve Sohbet', ru: 'Знакомство с соседями', zh: '向新邻居自我介绍', ja: 'ご近所さんへの挨拶と自己紹介', ko: '이웃에게 자기소개하고 인사하기' },
  { icon: '♻️', en: 'Trash, Recycling & Building Rules', ur: 'صفائی، ری سائیکلنگ اور بلڈنگ کے قوانین', hi: 'कचरा, रीसाइक्लिंग और सोसाइटी के नियम', ar: 'النظافة وإعادة التدوير وقواعد المبنى', fa: 'تفکیک زباله و قوانین ساختمان', fr: 'Tri des déchets et règles de l’immeuble', es: 'Reciclaje y normas del edificio', de: 'Mülltrennung & Hausordnung', tr: 'Geri Dönüşüm ve Apartman Kuralları', ru: 'Сортировка мусора и правила дома', zh: '垃圾分类与公寓守则', ja: 'ゴミ出しの分別とマンション規則', ko: '쓰레기 분리수거 및 건물 규칙' },
  { icon: '🔧', en: 'Calling a Plumber or Electrician for Repairs', ur: 'پلمبر یا الیکٹریشن کو مرمت کے لیے بلانا', hi: 'प्लंबर या इलेक्ट्रीशियन को मरम्मत के लिए बुलाना', ar: 'الاتصال بالسباك أو الكهربائي للصيانة', fa: 'تماس با لوله‌کش یا برق‌کار برای تعمیرات', fr: 'Appeler un plombier ou un électricien', es: 'Llamar a un fontanero o electricista', de: 'Klempner oder Elektriker rufen', tr: 'Tesisatçı ve Elektrikçi Çağırma', ru: 'Вызов сантехника или электрика', zh: '联系水电工上门维修', ja: '水道や電気の修理業者を呼ぶ', ko: '배관공이나 전기 기사 부르기' },
  { icon: '📦', en: 'Post Office, Packages & Home Delivery', ur: 'ڈاک خانہ، پارسل اور ہوم ڈیلیوری', hi: 'डाकघर, पार्सल और होम डिलीवरी', ar: 'مكتب البريد والطرود والتوصيل للمنزل', fa: 'اداره پست، بسته‌ها و تحویل درب منزل', fr: 'Bureau de poste, colis et livraison', es: 'Oficina de correos, paquetes y entregas', de: 'Postamt, Pakete & Hauslieferung', tr: 'Postane, Kargo ve Eve Teslimat', ru: 'Почта, посылки и доставка на дом', zh: '邮局寄件与快递送货上门', ja: '郵便局・宅配便・置き配の手配', ko: '우체국, 택배 및 집 앞 배송' },
  { icon: '🧺', en: 'Dry Cleaning, Laundry & Tailor Services', ur: 'ڈرائی کلیننگ، لانڈری اور درزی کا کام', hi: 'ड्राई क्लीनिंग, लॉन्ड्री और दर्जी', ar: 'المغسلة والتنظيف الجاف والخياط', fa: 'خشک‌شویی، لباس‌شویی و خیاطی', fr: 'Pressing, laverie et couturier', es: 'Tintorería, lavandería y sastre', de: 'Reinigung, Waschsalon & Änderungsschneiderei', tr: 'Kuru Temizleme ve Terzi Hizmeti', ru: 'Химчистка, прачечная и ателье', zh: '干洗店、洗衣房与裁缝改衣', ja: 'クリーニング・コインランドリー・洋服直し', ko: '세탁소, 코인세탁 및 수선집 이용' },
  { icon: '💇', en: 'Getting a Haircut at the Barber or Salon', ur: 'حجام یا سیلون پر بال کٹوانا', hi: 'नाई या सैलून में बाल कटवाना', ar: 'قص الشعر عند الحلاق أو الصالون', fa: 'اصلاح مو در آرایشگاه و سالن زیبایی', fr: 'Se faire couper les cheveux au salon', es: 'Cortarse el pelo en la peluquería', de: 'Haarschnitt beim Friseur', tr: 'Kuaför ve Berbere Gitme', ru: 'Стрижка в парикмахерской или салоне', zh: '在理发店或沙龙剪发造型', ja: '美容院や理髪店で髪を切る', ko: '미용실이나 이발소에서 머리 자르기' },

  // SECTION 5 (Topics 41–50): Healthcare, Emergencies, Pharmacy & Fitness
  { icon: '💊', en: 'Visiting a Pharmacy for Medicine', ur: 'میڈیکل اسٹور سے دوا اور مشورہ لینا', hi: 'फार्मेसी से दवा और सलाह लेना', ar: 'زيارة الصيدلية لشراء الدواء والاستشارة', fa: 'مراجعه به داروخانه و تهیه دارو', fr: 'Aller à la pharmacie pour des médicaments', es: 'Ir a la farmacia por medicamentos', de: 'In der Apotheke Medikamente holen', tr: 'Eczaneden İlaç ve Tavsiye Alma', ru: 'Покупка лекарств в аптеке', zh: '去药店买药与咨询', ja: '薬局で薬を買う・相談する', ko: '약국에서 증상 말하고 약 사기' },
  { icon: '🩺', en: 'Booking a Doctor’s Appointment', ur: 'ڈاکٹر سے وقت لینا اور علامات بتانا', hi: 'डॉक्टर से अपॉइंटमेंट लेना और लक्षण बताना', ar: 'حجز موعد مع الطبيب وشرح الأعراض', fa: 'گرفتن نوبت پزشک و توضیح علائم', fr: 'Prendre rendez-vous chez le médecin', es: 'Pedir cita médica y explicar síntomas', de: 'Arzttermin vereinbaren & Symptome erklären', tr: 'Doktor Randevusu ve Belirtileri Anlatma', ru: 'Запись к врачу и описание симптомов', zh: '预约看病与描述身体症状', ja: '病院の予約と症状の説明', ko: '병원 예약 및 의사에게 증상 설명' },
  { icon: '🦷', en: 'Visiting the Dentist or Optometrist', ur: 'دانتوں یا آنکھوں کے ڈاکٹر کا معائنہ', hi: 'दंत चिकित्सक या नेत्र विशेषज्ञ से मिलना', ar: 'زيارة طبيب الأسنان أو طبيب العيون', fa: 'مراجعه به دندان‌پزشک یا چشم‌پزشک', fr: 'Aller chez le dentiste ou l’opticien', es: 'Visitar al dentista u oculista', de: 'Beim Zahnarzt oder Optiker', tr: 'Diş Hekimi ve Göz Muayenesi', ru: 'Визит к стоматологу или окулисту', zh: '看牙医或验光配镜', ja: '歯医者や眼科・メガネ店へ行く', ko: '치과 및 안과 검진받기' },
  { icon: '🚑', en: 'Handling Medical Emergencies & Hospitals', ur: 'ہنگامی طبی امداد اور ہسپتال کا رابطہ', hi: 'आपातकालीन चिकित्सा और अस्पताल', ar: 'التعامل مع الطوارئ الطبية والمستشفى', fa: 'اورژانس پزشکی و مراجعه به بیمارستان', fr: 'Urgences médicales et hôpital', es: 'Emergencias médicas y hospital', de: 'Medizinische Notfälle & Krankenhaus', tr: 'Acil Durumlar ve Hastane', ru: 'Медицинская помощь и больница', zh: '处理紧急医疗情况与医院急诊', ja: '救急医療と病院での対応', ko: '응급 의료 상황 및 병원 이용' },
  { icon: '🚓', en: 'Reporting a Lost Wallet or Passport to Police', ur: 'گمشدہ بٹوہ یا پاسپورٹ کی پولیس رپورٹ', hi: 'खोए हुए पर्स या पासपोर्ट की पुलिस रिपोर्ट', ar: 'الإبلاغ عن فقدان المحفظة أو الجواز للشرطة', fa: 'گزارش گم شدن کیف پول یا گذرنامه به پلیس', fr: 'Signaler un portefeuille ou passeport perdu', es: 'Reportar billetera o pasaporte perdido', de: 'Verlorenen Pass oder Geldbörse melden', tr: 'Kayıp Cüzdan veya Pasaport Bildirimi', ru: 'Заявление о потере паспорта или кошелька', zh: '向警方报失钱包或护照', ja: '財布やパスポートの紛失届を出す', ko: '분실한 지갑이나 여권 경찰 신고' },
  { icon: '🏋️', en: 'Joining a Local Gym & Fitness Class', ur: 'مقامی جم اور فٹنس کلاس کی ممبرشپ', hi: 'स्थानीय जिम और फिटनेस क्लास से जुड़ना', ar: 'الاشتراك في النادي الرياضي واللياقة', fa: 'ثبت‌نام در باشگاه ورزشی و تناسب اندام', fr: 'S’inscrire à la salle de sport', es: 'Inscribirse en el gimnasio local', de: 'Im Fitnessstudio anmelden', tr: 'Spor Salonuna Kayıt ve Antrenman', ru: 'Запись в спортзал и фитнес-клуб', zh: '办理健身房会员与运动课程', ja: '地域のジムやフィットネスに入会', ko: '동네 헬스장 및 피트니스 등록' },
  { icon: '🧘', en: 'Wellness, Spa & Mental Relaxation', ur: 'صحت، سکون اور ذہنی تندرستی پر بات', hi: 'स्वास्थ्य, योग और मानसिक शांति', ar: 'العافية والاسترخاء والصحة النفسية', fa: 'سلامت، آرامش ذهنی و تندرستی', fr: 'Bien-être, spa et relaxation', es: 'Bienestar, spa y relajación', de: 'Wellness, Entspannung & Gesundheit', tr: 'Sağlıklı Yaşam ve Dinlenme', ru: 'Здоровье, отдых и релаксация', zh: '身心健康、水疗与放松', ja: '健康管理・スパ・リフレッシュ', ko: '웰니스, 스파 및 심신 휴식' },
  { icon: '🥗', en: 'Discussing Allergies, Diet & Nutrition', ur: 'کھانے کی الرجی اور صحت مند غذا بتانا', hi: 'फूड एलर्जी और स्वस्थ आहार की जानकारी', ar: 'شرح حساسية الطعام والنظام الغذائي', fa: 'توضیح حساسیت غذایی و رژیم سالم', fr: 'Expliquer ses allergies et son alimentation', es: 'Explicar alergias y dieta saludable', de: 'Allergien & Ernährung erklären', tr: 'Gıda Alerjisi ve Beslenme Tercihleri', ru: 'Пищевая аллергия и здоровое питание', zh: '说明食物过敏与营养饮食', ja: 'アレルギーや食事制限を伝える', ko: '음식 알레르기 및 식단 설명하기' },
  { icon: '🐾', en: 'Taking Care of Pets & Visiting the Vet', ur: 'پالتو جانوروں کی دیکھ بھال اور ڈاکٹر', hi: 'पालतू जानवरों की देखभाल और पशु चिकित्सक', ar: 'رعاية الحيوانات الأليفة وزيارة الطبيب البيطري', fa: 'نگهداری از حیوانات خانگی و دام‌پزشکی', fr: 'Soigner ses animaux et aller chez le vétérinaire', es: 'Cuidar mascotas y visitar al veterinario', de: 'Haustiere pflegen & beim Tierarzt', tr: 'Evcil Hayvan Bakımı ve Veteriner', ru: 'Уход за питомцами и ветеринар', zh: '照顾宠物与看兽医', ja: 'ペットの世話と動物病院', ko: '반려동물 돌보기 및 동물병원 방문' },
  { icon: '🚴', en: 'Renting a Bicycle or City Scooter', ur: 'سائیکل یا سٹی اسکوٹر کرائے پر لینا', hi: 'साइकिल या सिटी स्कूटर किराए पर लेना', ar: 'استئجار دراجة هوائية أو سكوتر في المدينة', fa: 'کرایه دوچرخه یا اسکوتر شهری', fr: 'Louer un vélo ou une trottinette', es: 'Alquilar una bicicleta o patinete', de: 'Fahrrad oder E-Scooter mieten', tr: 'Bisiklet veya Şehir Scooterı Kiralama', ru: 'Прокат велосипеда или самоката', zh: '租借共享单车或城市滑板车', ja: 'レンタサイクルや電動キックボード', ko: '공유 자전거 및 전동 킥보드 대여' },

  // SECTION 6 (Topics 51–60): Banking, Car, Bureaucracy, Education & Community
  { icon: '🏦', en: 'Opening a Local Bank Account', ur: 'مقامی بینک اکاؤنٹ کھولنا', hi: 'स्थानीय बैंक खाता खोलना', ar: 'فتح حساب بنكي محلي', fa: 'افتتاح حساب بانکی محلی', fr: 'Ouvrir un compte bancaire local', es: 'Abrir una cuenta bancaria local', de: 'Ein lokales Bankkonto eröffnen', tr: 'Yerel Banka Hesabı Açma', ru: 'Открытие счёта в местном банке', zh: '开设当地银行账户', ja: '現地の銀行口座を開設する', ko: '현지 은행 계좌 개설하기' },
  { icon: '💳', en: 'Credit Cards, Transfers & Mobile Banking', ur: 'کریڈٹ کارڈ، رقم کی منتقلی اور موبائل بینکنگ', hi: 'क्रेडिट कार्ड, मनी ट्रांसफर और मोबाइल बैंकिंग', ar: 'البطاقات البنكية والتحويلات وتطبيق البنك', fa: 'کارت بانکی، انتقال وجه و همراه بانک', fr: 'Cartes bancaires et virements mobiles', es: 'Tarjetas, transferencias y banca móvil', de: 'Karten, Überweisungen & Online-Banking', tr: 'Kredi Kartı, Havale ve Mobil Bankacılık', ru: 'Карты, переводы и мобильный банк', zh: '银行卡、转账与手机银行', ja: 'カード決済・送金・ネットバンキング', ko: '카드 결제, 송금 및 모바일 뱅킹' },
  { icon: '🚗', en: 'Renting a Car & Gas Station Etiquette', ur: 'گاڑی کرائے پر لینا اور پیٹرول پمپ', hi: 'कार किराए पर लेना और पेट्रोल पंप', ar: 'استئجار سيارة ومحطة الوقود', fa: 'اجاره خودرو و پمپ بنزین', fr: 'Louer une voiture et station-service', es: 'Alquilar un coche y gasolinera', de: 'Auto mieten & an der Tankstelle', tr: 'Araç Kiralama ve Akaryakıt İstasyonu', ru: 'Аренда авто и заправка', zh: '租车自驾与加油站用语', ja: 'レンタカーとガソリンスタンド', ko: '렌터카 대여 및 주유소 이용' },
  { icon: '🪪', en: 'Residence Permit, Visa Extension & City Hall', ur: 'ویزا میں توسیع، رہائشی کارڈ اور سرکاری دفتر', hi: 'वीजा विस्तार, निवास परमिट और सिटी हॉल', ar: 'تجديد الإقامة والتأشيرة ومكتب البلدية', fa: 'تمدید ویزا، کارت اقامت و شهرداری', fr: 'Titre de séjour, visa et mairie', es: 'Permiso de residencia, visa y ayuntamiento', de: 'Aufenthaltstitel, Visum & Bürgeramt', tr: 'İkamet İzni, Vize Uzatma ve Belediye', ru: 'ВНЖ, продление визы и мэрия', zh: '居留许可、签证延期与市政厅办事', ja: '在留カード・ビザ更新・市役所手続き', ko: '거주 허가증, 비자 연장 및 시청 업무' },
  { icon: '🎓', en: 'Enrolling in a University or Language School', ur: 'یونیورسٹی یا لینگویج اسکول میں داخلہ', hi: 'विश्वविद्यालय या भाषा स्कूल में नामांकन', ar: 'التسجيل في الجامعة أو معهد اللغة', fa: 'ثبت‌نام در دانشگاه یا آموزشگاه زبان', fr: 'S’inscrire à l’université ou école de langue', es: 'Matricularse en la universidad o escuela', de: 'An der Universität oder Sprachschule einschreiben', tr: 'Üniversite veya Dil Okuluna Kayıt', ru: 'Поступление в университет или языковую школу', zh: '报读大学或语言学校', ja: '大学や語学学校への入学手続き', ko: '대학교 및 어학원 등록하기' },
  { icon: '📚', en: 'Using the Public Library & Study Spaces', ur: 'پبلک لائبریری اور مطالعہ گاہ کا استعمال', hi: 'सार्वजनिक पुस्तकालय और अध्ययन कक्ष', ar: 'استخدام المكتبة العامة وأماكن الدراسة', fa: 'استفاده از کتابخانه عمومی و فضای مطالعه', fr: 'Utiliser la bibliothèque municipale', es: 'Usar la biblioteca pública', de: 'Stadtbibliothek & Lernräume nutzen', tr: 'Halk Kütüphanesi ve Çalışma Alanları', ru: 'Городская библиотека и коворкинги', zh: '使用公共图书馆与自习空间', ja: '市立図書館や自習スペースの利用', ko: '시립 도서관 및 스터디 공간 이용' },
  { icon: '🏫', en: 'Talking to Teachers & School Parent Meetings', ur: 'اساتذہ سے گفتگو اور اسکول کی میٹنگ', hi: 'शिक्षकों से बातचीत और स्कूल मीटिंग', ar: 'التحدث مع المعلمين واجتماعات المدرسة', fa: 'صحبت با معلمان و جلسات مدرسه', fr: 'Parler aux professeurs et réunions d’école', es: 'Hablar con profesores y reuniones escolares', de: 'Mit Lehrern sprechen & Elternabend', tr: 'Öğretmenlerle Görüşme ve Okul Toplantısı', ru: 'Общение с учителями и родительские собрания', zh: '与老师沟通及参加家长会', ja: '先生との会話と学校の保護者会', ko: '선생님과 상담 및 학교 학부모 모임' },
  { icon: '⚖️', en: 'Understanding Local Laws, Taxes & Insurance', ur: 'مقامی قوانین، ٹیکس اور انشورنس کو سمجھنا', hi: 'स्थानीय कानून, टैक्स और बीमा समझना', ar: 'فهم القوانين المحلية والضرائب والتأمين', fa: 'آشنایی با قوانین محلی، مالیات و بیمه', fr: 'Comprendre les lois, impôts et assurances', es: 'Entender leyes locales, impuestos y seguros', de: 'Gesetze, Steuern & Versicherungen verstehen', tr: 'Yerel Yasalar, Vergi ve Sigorta İşlemleri', ru: 'Местные законы, налоги и страховка', zh: '了解当地法规、税务与保险', ja: '現地の法律・税金・保険の理解', ko: '현지 법률, 세금 및 보험 이해하기' },
  { icon: '🌱', en: 'Volunteering & Joining Community Events', ur: 'رضاکارانہ کام اور محلے کی تقریبات میں شرکت', hi: 'स्वयंसेवा और सामुदायिक कार्यक्रमों में भाग लेना', ar: 'التطوع والمشاركة في فعاليات الحي', fa: 'کار داوطلبانه و شرکت در رویدادهای محله', fr: 'Bénévolat et événements de quartier', es: 'Voluntariado y eventos comunitarios', de: 'Ehrenamt & Nachbarschaftsfeste', tr: 'Gönüllülük ve Mahalle Etkinlikleri', ru: 'Волонтёрство и районные праздники', zh: '参与志愿服务与社区活动', ja: 'ボランティアと地域イベントへの参加', ko: '자원봉사 및 지역 사회 행사 참여' },
  { icon: '🎭', en: 'Attending Concerts, Theater & Local Festivals', ur: 'کانسرٹ، تھیٹر اور مقامی تہواروں میں جانا', hi: 'संगीत कार्यक्रम, थिएटर और स्थानीय त्योहार', ar: 'حضور الحفلات والمسرح والمهرجانات المحلية', fa: 'رفتن به کنর্ষرت، تئاتر و جشنواره‌های محلی', fr: 'Assister à des concerts et festivals locaux', es: 'Asistir a conciertos, teatro y festivales', de: 'Konzerte, Theater & Volksfeste besuchen', tr: 'Konser, Tiyatro ve Yerel Festivaller', ru: 'Концерты, театры и местные фестивали', zh: '参加音乐会、剧院演出与当地节庆', ja: 'コンサート・劇場・地域のお祭り', ko: '콘서트, 연극 및 지역 축제 즐기기' },

  // SECTION 7 (Topics 61–70): Professional Life — Job Interviews, Office & Business
  { icon: '💼', en: 'Job Interview & Introducing Your Experience', ur: 'ملازمت کا انٹرویو اور اپنے تجربے کا تعارف', hi: 'नौकरी का इंटरव्यू और अपने अनुभव का परिचय', ar: 'مقابلة العمل وتقديم خبرتك المهنية', fa: 'مصاحبه شغلی و معرفی سوابق کاری', fr: 'Entretien d’embauche et expérience', es: 'Entrevista de trabajo y experiencia', de: 'Vorstellungsgespräch & Berufserfahrung', tr: 'İş Görüşmesi ve Deneyimleri Anlatma', ru: 'Собеседование и рассказ об опыте', zh: '求职面试与介绍工作经验', ja: '採用面接と職務経歴の自己紹介', ko: '취업 면접 및 경력 소개하기' },
  { icon: '🤝', en: 'First Day at the Office & Meeting Colleagues', ur: 'دفتر میں پہلا دن اور ساتھیوں سے ملاقات', hi: 'ऑफिस में पहला दिन और सहकर्मियों से मिलना', ar: 'اليوم الأول في العمل والتعرف على الزملاء', fa: 'اولین روز کاری در شرکت و آشنایی با همکاران', fr: 'Premier jour au bureau et collègues', es: 'Primer día en la oficina y colegas', de: 'Erster Arbeitstag & Kollegen kennenlernen', tr: 'Ofiste İlk Gün ve İş Arkadaşlarıyla Tanışma', ru: 'Первый день в офисе и знакомство с коллегами', zh: '入职第一天与认识同事', ja: 'オフィスでの初日と同僚への挨拶', ko: '첫 출근 및 직장 동료들과 인사' },
  { icon: '☕', en: 'Office Small Talk & Coffee Break Chats', ur: 'دفتر کے وقفے میں خوشگوار گفتگو', hi: 'ऑफिस कॉफी ब्रेक में अनौपचारिक बातचीत', ar: 'الأحاديث الودية في استراحة القهوة بالعمل', fa: 'گپ‌وگفت دوستانه در وقت استراحت شرکت', fr: 'Discussions informelles à la pause-café', es: 'Charla informal en la pausa del café', de: 'Smalltalk in der Kaffeepause', tr: 'Ofiste Kahve Molası Sohbetleri', ru: 'Светская беседа на кофе-брейке', zh: '办公室茶水间闲聊', ja: '休憩時間の雑談とスモールトーク', ko: '사무실 커피 타임 스몰토크' },
  { icon: '📊', en: 'Sharing Ideas in Team Meetings', ur: 'ٹیم میٹنگ میں اپنی رائے اور تجاویز دینا', hi: 'टीम मीटिंग में अपने विचार साझा करना', ar: 'طرح الأفكار والآراء في اجتماعات الفريق', fa: 'ارائه ایده و نظر در جلسات تیمی', fr: 'Partager ses idées en réunion d’équipe', es: 'Compartir ideas en reuniones de equipo', de: 'Ideen in Team-Meetings einbringen', tr: 'Ekip Toplantısında Fikir Sunma', ru: 'Высказывание идей на планерках', zh: '在团队会议上发表意见', ja: 'チーム会議でアイデアを提案する', ko: '팀 회의에서 아이디어 발표하기' },
  { icon: '📧', en: 'Phone Calls, Video Conferences & Emails', ur: 'فون کالز، ویڈیو میٹنگ اور دفتری پیغامات', hi: 'फोन कॉल, वीडियो कॉन्फ्रेंस और ईमेल', ar: 'المكالمات الهاتفية واجتماعات الفيديو المهنية', fa: 'تماس‌های تلفنی، جلسات آنلاین و ایمیل کاری', fr: 'Appels pro, visioconférences et e-mails', es: 'Llamadas, videoconferencias y correos', de: 'Telefonate, Videokonferenzen & E-Mails', tr: 'İş Telefonları ve Video Konferanslar', ru: 'Деловые звонки, видеовстречи и письма', zh: '商务电话、视频会议与邮件沟通', ja: 'ビジネス電話・オンライン会議・メール', ko: '업무 전화, 화상 회의 및 이메일' },
  { icon: '📈', en: 'Giving a Presentation & Answering Questions', ur: 'پریزنٹیشن دینا اور سوالات کے جواب دینا', hi: 'प्रेजेंटेशन देना और सवालों के जवाब देना', ar: 'تقديم عرض عمل والإجابة عن الأسئلة', fa: 'ارائه کنفرانس کاری و پاسخ به پرسش‌ها', fr: 'Faire une présentation et répondre aux questions', es: 'Hacer una presentación y responder preguntas', de: 'Präsentation halten & Fragen beantworten', tr: 'Sunum Yapma ve Soruları Yanıtlama', ru: 'Проведение презентации и ответы на вопросы', zh: '进行工作演讲与回答提问', ja: 'プレゼンテーションと質疑応答', ko: '프레젠테이션 진행 및 질의응답' },
  { icon: '⏳', en: 'Negotiating Deadlines & Project Schedules', ur: 'پروجیکٹ کے وقت اور ڈیڈ لائن پر بات چیت', hi: 'प्रोजेक्ट की समय-सीमा और शेड्यूल तय करना', ar: 'التفاوض على المواعيد النهائية وجدول المشاريع', fa: 'هماهنگی زمان‌بندی و مهلت پروژه‌ها', fr: 'Négocier les délais et le planning', es: 'Negociar plazos y cronogramas', de: 'Fristen & Projektpläne abstimmen', tr: 'Proje Teslim Tarihlerini Planlama', ru: 'Согласование сроков и графика проекта', zh: '协商项目截止日期与进度', ja: '納期やスケジュールの調整・交渉', ko: '프로젝트 마감일 및 일정 조율' },
  { icon: '🛠️', en: 'Solving Workplace Problems Diplomatically', ur: 'دفتر کے مسائل کو حکمت اور نرمی سے حل کرنا', hi: 'कार्यस्थल की समस्याओं को कुशलता से सुलझाना', ar: 'حل مشكلات العمل بلباقة ودبلوماسية', fa: 'حل محترمانه چالش‌ها و مسائل کاری', fr: 'Résoudre les problèmes avec diplomatie', es: 'Resolver problemas laborales con tacto', de: 'Probleme am Arbeitsplatz diplomatisch lösen', tr: 'İş Yerinde Sorunları Nazikçe Çözme', ru: 'Дипломатичное решение рабочих вопросов', zh: '得体地解决职场问题', ja: '職場のトラブルを円満に解決する', ko: '직장 내 문제를 원만하게 해결하기' },
  { icon: '🌐', en: 'Networking at Conferences & Career Fairs', ur: 'کانفرنس اور کاروباری تقریبات میں نیٹ ورکنگ', hi: 'सम्मेलनों और करियर मेलों में नेटवर्किंग', ar: 'بناء العلاقات المهنية في المؤتمرات', fa: 'شبکه‌سازی حرفه‌ای در همایش‌ها و نمایشگاه‌ها', fr: 'Réseauter lors de conférences', es: 'Hacer contactos en conferencias', de: 'Networking auf Konferenzen & Messen', tr: 'Konferans ve Fuarlarda Tanışma', ru: 'Нетворкинг на конференциях и выставках', zh: '在行业会议与展会上拓展人脉', ja: 'カンファレンスや展示会での人脈作り', ko: '컨퍼런스 및 박람회에서 네트워킹' },
  { icon: '🥂', en: 'Celebrating Promotions & Team Success', ur: 'ترقی اور ٹیم کی کامیابی کا جشن منانا', hi: 'प्रमोशन और टीम की सफलता का जश्न मनाना', ar: 'الاحتفال بالترقيات ونجاح الفريق', fa: 'جشن گرفتن ترفیع و موفقیت تیم', fr: 'Célébrer une promotion et le succès', es: 'Celebrar ascensos y éxitos del equipo', de: 'Beförderungen & Teamerfolge feiern', tr: 'Terfi ve Ekip Başarısını Kutlama', ru: 'Празднование повышения и успехов команды', zh: '庆祝晋升与团队成果', ja: '昇進やチームの成功を祝う', ko: '승진 및 팀 프로젝트 성공 축하' },

  // SECTION 8 (Topics 71–80): Deep Connections — Feelings, Storytelling & Humor
  { icon: '❤️', en: 'Expressing Deep Emotions & Empathy', ur: 'جذبات، ہمدردی اور دلی احساسات کا اظہار', hi: 'गहरी भावनाओं और सहानुभूति को व्यक्त करना', ar: 'التعبير عن المشاعر العميقة والتعاطف', fa: 'ابراز احساسات صمیمانه و همدلی', fr: 'Exprimer ses émotions profondes et l’empathie', es: 'Expresar emociones profundas y empatía', de: 'Tiefe Gefühle & Mitgefühl ausdrücken', tr: 'Derin Duyguları ve Empatiyi İfade Etme', ru: 'Выражение глубоких чувств и сопереживания', zh: '表达内心情感与同理心', ja: '深い感情や共感を言葉にする', ko: '깊은 감정과 공감 표현하기' },
  { icon: '📖', en: 'Telling Funny Childhood & Travel Stories', ur: 'بچپن اور سفر کے دلچسپ واقعات سنانا', hi: 'बचपन और यात्रा की मजेदार कहानियां सुनाना', ar: 'رواية قصص الطفولة والمواقف الطريفة', fa: 'تعریف کردن خاطرات شیرین کودکی و سفر', fr: 'Raconter des anecdotes d’enfance et de voyage', es: 'Contar anécdotas divertidas de viajes', de: 'Lustige Kindheits- & Reisegeschichten erzählen', tr: 'Eğlenceli Çocukluk ve Seyahat Anıları', ru: 'Забавные истории из детства и путешествий', zh: '分享童年趣事与旅行故事', ja: '子供時代や旅の面白い思い出話', ko: '어린 시절과 여행의 재미있는 일화' },
  { icon: '🎬', en: 'Discussing Movies, Books & Series Like a Critic', ur: 'فلموں، کتابوں اور ڈراموں پر تبصرہ کرنا', hi: 'फिल्मों, کتابوں और सीरीज पर चर्चा करना', ar: 'مناقشة الأفلام والكتب والمسلسلات بعمق', fa: 'نقد و گفتگو درباره فیلم‌ها و کتاب‌ها', fr: 'Discuter de films, livres et séries', es: 'Debatir sobre películas, libros y series', de: 'Über Filme, Bücher & Serien diskutieren', tr: 'Film, Kitap ve Diziler Üzerine Sohbet', ru: 'Обсуждение фильмов, книг и сериалов', zh: '深度畅聊电影、书籍与剧集', ja: '映画や本・ドラマの感想を語り合う', ko: '영화, 책, 드라마 깊이 있게 토론하기' },
  { icon: '📰', en: 'Talking About Current Events & World News', ur: 'حالاتِ حاضرہ اور دنیا کی خبروں پر گفتگو', hi: 'समसामयिक घटनाओं और विश्व समाचारों पर चर्चा', ar: 'التحدث عن الأحداث الجارية وأخبار العالم', fa: 'گفتگو درباره اخبار روز و رویدادهای جهان', fr: 'Parler de l’actualité et du monde', es: 'Hablar de actualidad y noticias', de: 'Über aktuelle Ereignisse & Nachrichten sprechen', tr: 'Güncel Olaylar ve Dünya Haberleri', ru: 'Обсуждение текущих событий и новостей', zh: '谈论时事热点与国际新闻', ja: '時事問題や世界のニュースを話す', ko: '시사 현안 및 세계 뉴스 이야기하기' },
  { icon: '💬', en: 'Polite Disagreement & Sharing Opinions', ur: 'شائستگی سے اختلاف کرنا اور اپنی رائے دینا', hi: 'विनम्रता से असहमति जताना और राय रखना', ar: 'الاختلاف في الرأي بلطف وتقديم الحجج', fa: 'مخالفت محترمانه و بیان دیدگاه شخصی', fr: 'Exprimer un désaccord poli et son avis', es: 'Discrepar con cortesía y dar opiniones', de: 'Höflich widersprechen & Meinungen teilen', tr: 'Nazikçe Farklı Düşünce Belirtme', ru: 'Вежливое несогласие и обмен мнениями', zh: '礼貌表达不同意见与个人观点', ja: '丁寧に反対意見を述べ議論する', ko: '정중하게 반대 의견 말하기' },
  { icon: '🕊️', en: 'Apologizing Sincerely & Resolving Misunderstandings', ur: 'خلوص سے معذرت کرنا اور غلط فہمی دور کرنا', hi: 'सच्चे मन से माफी मांगना और गलतफहमी दूर करना', ar: 'الاعتذار الصادق وإزالة سوء الفهم', fa: 'عذرخواهی صمیمانه و رفع سوءتفاهم', fr: 'S’excuser sincèrement et dissiper un malentendu', es: 'Disculparse sinceramente y aclarar malentendidos', de: 'Aufrichtig entschuldigen & Missverständnisse klären', tr: 'İçtenlikle Özür Dileme ve Tatlıya Bağlama', ru: 'Искренние извинения и устранение недопонимания', zh: '真诚道歉与化解误会', ja: '誠実に謝罪し誤解を解く', ko: '진심으로 사과하고 오해 풀기' },
  { icon: '🌟', en: 'Giving Encouragement & Life Advice to Friends', ur: 'دوستوں کا حوصلہ بڑھانا اور مشورہ دینا', hi: 'दोस्तों का हौसला बढ़ाना और सलाह देना', ar: 'تشجيع الأصدقاء وتقديم النصائح الصادقة', fa: 'دلگرمی دادن و راهنمایی دوستانه', fr: 'Encourager ses amis et donner des conseils', es: 'Dar ánimo y consejos a los amigos', de: 'Freunde ermutigen & Ratschläge geben', tr: 'Arkadaşlara Moral ve Tavsiye Verme', ru: 'Поддержка друзей и жизненные советы', zh: '鼓励朋友与提供人生建议', ja: '友人を励ましアドバイスを送る', ko: '친구에게 격려와 인생 조언 건네기' },
  { icon: '😄', en: 'Understanding Local Humor, Wit & Irony', ur: 'مقامی مزاح، لطیفوں اور اندازِ بیان کو سمجھنا', hi: 'स्थानीय हास्य और चुटकुलों को समझना', ar: 'فهم الفكاهة المحلية والطرائف الذكية', fa: 'درک طنز، شوخ‌طبعی و کنایه‌های بومی', fr: 'Comprendre l’humour local et le second degré', es: 'Entender el humor local y las bromas', de: 'Lokalen Humor, Witz & Ironie verstehen', tr: 'Yerel Mizahı ve Esprileri Anlama', ru: 'Понимание местного юмора и иронии', zh: '听懂当地幽默、笑话与双关语', ja: '現地のユーモアやジョークを楽しむ', ko: '현지 유머와 재치 있는 농담 이해하기' },
  { icon: '🚀', en: 'Talking About Future Dreams & Life Goals', ur: 'مستقبل کے خوابوں اور زندگی کے مقاصد پر بات', hi: 'भविष्य के सपनों और लक्ष्यों पर बातचीत', ar: 'التحدث عن أحلام المستقبل وأهداف الحياة', fa: 'صحبت درباره رویاهای آینده و اهداف زندگی', fr: 'Parler de ses rêves d’avenir et objectifs', es: 'Hablar de sueños futuros y metas de vida', de: 'Über Zukunftsträume & Lebensziele sprechen', tr: 'Gelecek Hayalleri ve Yaşam Hedefleri', ru: 'Разговор о мечтах и жизненных целях', zh: '畅谈未来梦想与人生目标', ja: '将来の夢や人生の目標を語る', ko: '미래의 꿈과 인생 목표 이야기하기' },
  { icon: '🏡', en: 'Hosting Local Friends at Your Own Home', ur: 'اپنے گھر پر مقامی دوستوں کی میزبانی کرنا', hi: 'अपने घर पर स्थानीय दोस्तों की मेजबानी करना', ar: 'استضافة الأصدقاء المحليين في منزلك', fa: 'میزبانی از دوستان بومی در خانه خودتان', fr: 'Recevoir ses amis locaux chez soi', es: 'Recibir a amigos locales en tu casa', de: 'Einheimische Freunde zu Hause bewirten', tr: 'Yerel Arkadaşları Kendi Evinde Ağırlama', ru: 'Приём местных друзей у себя дома', zh: '在自己家里招待当地朋友', ja: '自宅に現地の友人を招いておもてなし', ko: '우리 집에 현지 친구들 초대해 대접하기' },

  // SECTION 9 (Topics 81–90): True Native Fluency — Idioms, Slang & Living Like a Local
  { icon: '🗣️', en: 'Everyday Native Idioms & Proverbs', ur: 'روزمرہ کے مقامی محاورے اور ضرب الامثال', hi: 'रोजमर्रा के स्थानीय मुहावरे और कहावतें', ar: 'الأمثال الشعبية والتعبيرات الاصطلاحية اليومية', fa: 'اصطلاحات و ضرب‌المثل‌های روزمره بومی', fr: 'Expressions idiomatiques et proverbes', es: 'Modismos cotidianos y refranes', de: 'Alltägliche Redewendungen & Sprichwörter', tr: 'Günlük Deyimler ve Atasözleri', ru: 'Повседневные идиомы и пословицы', zh: '地道日常习语与谚语', ja: '日常の慣用句とことわざを使いこなす', ko: '일상적인 현지 관용구와 속담' },
  { icon: '🔥', en: 'Modern Street Slang & Casual Expressions', ur: 'نوجوانوں کی بول چال اور بے تکلف جملے', hi: 'आधुनिक बोलचाल और कैजुअल एक्सप्रेशंस', ar: 'العامية الحديثة وتعبيرات الشارع العفوية', fa: 'اصطلاحات عامیانه و گفتار خودمانی روز', fr: 'Argot moderne et expressions familières', es: 'Jerga moderna y expresiones coloquiales', de: 'Moderne Umgangssprache & Slang', tr: 'Modern Sokak Dili ve Samimi İfadeler', ru: 'Современный сленг и разговорные фразы', zh: '现代流行俚语与口语表达', ja: '自然な若者言葉とカジュアル表現', ko: '현대적인 현지 슬랭과 자연스러운 구어체' },
  { icon: '🧭', en: 'Regional Accents & Dialect Nuances', ur: 'مختلف علاقوں کے لہجے اور الفاظ کی پہچان', hi: 'क्षेत्रीय लहजे और बोलियों की बारीकियां', ar: 'تمييز اللهجات الإقليمية والفروق الدقيقة', fa: 'آشنایی با لهجه‌ها و گویش‌های مختلف کشور', fr: 'Accents régionaux et nuances locales', es: 'Acentos regionales y matices locales', de: 'Regionale Akzente & Dialekte verstehen', tr: 'Bölgesel Ağızlar ve Şive Farkları', ru: 'Региональные акценты и тонкости речи', zh: '听懂地方口音与方言特色', ja: '地域ごとの方言やイントネーション', ko: '지역별 억양과 사투리 뉘앙스 이해' },
  { icon: '🏛️', en: 'History, Heritage & National Pride', ur: 'ملکی تاریخ، ورثے اور ثقافتی فخر پر گفتگو', hi: 'इतिहास, विरासत और राष्ट्रीय गौरव पर चर्चा', ar: 'التحدث عن التاريخ والتراث والهوية الوطنية', fa: 'گفتگو درباره تاریخ، میراث و مفاخر ملی', fr: 'Histoire, patrimoine et culture nationale', es: 'Historia, patrimonio y orgullo cultural', de: 'Geschichte, Kulturerbe & Traditionen', tr: 'Tarih, Kültürel Miras ve Gelenekler', ru: 'История, наследие и национальная культура', zh: '探讨历史传承与文化底蕴', ja: '歴史・伝統遺産・文化への誇り', ko: '역사, 문화유산 및 전통 이야기' },
  { icon: '🍲', en: 'Cooking Traditional Recipes & Food Heritage', ur: 'روایتی کھانوں کی ترکیب اور ذائقوں پر بات', hi: 'पारंपरिक व्यंजनों की विधि और पाक विरासत', ar: 'طبخ الوصفات التقليدية وتراث المطبخ المحلي', fa: 'پختن غذاهای سنتی و فرهنگ آشپزی', fr: 'Cuisiner des recettes traditionnelles', es: 'Cocinar recetas tradicionales', de: 'Traditionelle Rezepte kochen & Esskultur', tr: 'Geleneksel Tarifler ve Mutfak Kültürü', ru: 'Приготовление традиционных блюд', zh: '烹饪传统名菜与饮食文化', ja: '伝統料理のレシピと食文化を語る', ko: '전통 요리 레시피와 식문화 나누기' },
  { icon: '🤖', en: 'Science, AI, Innovation & The Future', ur: 'سائنس، ٹیکنالوجی اور جدید ایجادات پر بحث', hi: 'विज्ञान, एआई, नवाचार और भविष्य पर चर्चा', ar: 'مناقشة العلوم والذكاء الاصطناعي والمستقبل', fa: 'گفتگو درباره علم، هوش مصنوعی و آینده', fr: 'Science, IA, innovation et futur', es: 'Ciencia, IA, innovación y el futuro', de: 'Wissenschaft, KI, Innovation & Zukunft', tr: 'Bilim, Yapay Zeka ve Gelecek Teknolojileri', ru: 'Наука, ИИ, инновации и будущее', zh: '探讨科技、人工智能与未来创新', ja: '科学・AI・イノベーションと未来', ko: '과학, AI, 혁신 및 미래 기술 토론' },
  { icon: '🌍', en: 'Environment, Sustainability & Green Living', ur: 'ماحولیات، قدرت کا تحفظ اور پائیدار زندگی', hi: 'पर्यावरण, स्थिरता और हरित जीवनशैली', ar: 'البيئة والاستدامة والحياة الخضراء', fa: 'محیط زیست، پایداری و زندگی سبز', fr: 'Environnement, écologie et vie durable', es: 'Medio ambiente y vida sostenible', de: 'Umwelt, Nachhaltigkeit & grünes Leben', tr: 'Çevre Koruma ve Sürdürülebilir Yaşam', ru: 'Экология, устойчивое развитие и природа', zh: '环境保护与可持续绿色生活', ja: '環境保護とサステナブルな暮らし', ko: '환경 보호와 지속 가능한 삶' },
  { icon: '🎙️', en: 'Public Speaking, Storytelling & Persuasion', ur: 'پراعتماد تقریر اور دل جیتنے والی گفتگو', hi: 'प्रभावी सार्वजनिक भाषण और संवाद कला', ar: 'الخطابة الواثقة وفن الإقناع والتأثير', fa: 'سخنرانی عمومی، فن بیان و متقاعدسازی', fr: 'Prise de parole en public et persuasion', es: 'Oratoria, narración y persuasión', de: 'Freies Reden, Storytelling & Überzeugungskraft', tr: 'Topluluk Önünde Akıcı Konuşma ve İkna', ru: 'Публичные выступления и искусство убеждения', zh: '公众演讲、故事感染力与说服力', ja: '人前でのスピーチと説得力のある話し方', ko: '대중 연설, 스토리텔링 및 설득의 기술' },
  { icon: '🧭', en: 'Helping New Travelers as a Seasoned Local', ur: 'ایک تجربہ کار مقامی کی طرح نئے مسافروں کی مدد کرنا', hi: 'एक अनुभवी स्थानीय की तरह नए यात्रियों की मदद करना', ar: 'إرشاد المسافرين الجدد كأنك من أهل البلد', fa: 'راهنمایی مسافران تازه مثل یک شهروند قدیمی', fr: 'Guider les nouveaux voyageurs comme un local', es: 'Guiar a nuevos viajeros como un residente', de: 'Neuen Reisenden helfen wie ein Einheimischer', tr: 'Yeni Gezginlere Yerli Gibi Rehberlik Etme', ru: 'Помощь новым туристам как коренной житель', zh: '像老居民一样为新游客指路解答', ja: '地元の先輩として新しい旅行者を案内', ko: '현지 주민처럼 새 여행객 도와주기' },
  { icon: '👑', en: 'Speaking & Living Like a True Local Resident', ur: 'بالکل مقامی شہری کی طرح روانی سے بولنا اور رہنا', hi: 'सच्चे स्थानीय निवासी की तरह धाराप्रवाह बोलना', ar: 'التحدث والعيش بطلاقة تامة كابن البلد', fa: 'زندگی و صحبت کاملاً روان مثل یک بومی واقعی', fr: 'Parler et vivre comme un vrai résident local', es: 'Hablar y vivir como un verdadero residente', de: 'Fließend sprechen & leben wie ein Einheimischer', tr: 'Gerçek Bir Yerli Gibi Akıcı Konuşma ve Yaşama', ru: 'Свободная речь и жизнь как настоящий местный', zh: '像真正的当地居民一样流利交流与生活', ja: '本物の現地住民のように自然に話し暮らす', ko: '진정한 현지인처럼 유창하게 말하고 생활하기' },
];

const TOPIC_COLORS = [
  '#C084FC', // Duolingo Soft Purple
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald Green
  '#FBBF24', // Warm Gold
  '#FB7185', // Coral Pink
  '#818CF8', // Indigo
];

export const NINETY_CONVERSATION_TOPICS: ConversationTopicNode[] =
  RAW_NINETY_TOPICS.map((item, idx) => ({
    id: idx + 1,
    sectionNumber: Math.floor(idx / 10) + 1,
    unitNumber: Math.floor(idx / 5) + 1,
    icon: item.icon,
    accentColor: TOPIC_COLORS[Math.floor(idx / 5) % TOPIC_COLORS.length],
    titleEn: item.en,
    titleUr: item.ur,
    titleHi: item.hi,
    titleAr: item.ar,
    titleFa: item.fa,
    titleFr: item.fr,
    titleEs: item.es,
    titleDe: item.de,
    titleTr: item.tr,
    titleRu: item.ru,
    titleZh: item.zh,
    titleJa: item.ja,
    titleKo: item.ko,
  }));

export function getTopicTitleForLang(
  topic: ConversationTopicNode,
  lang: LanguageInfo
): string {
  switch (lang.code) {
    case 'ur':
    case 'pa':
    case 'sd':
    case 'ps':
      return topic.titleUr;
    case 'hi':
    case 'bn':
    case 'mr':
    case 'gu':
    case 'ne':
      return topic.titleHi;
    case 'ar':
      return topic.titleAr;
    case 'fa':
    case 'ku':
      return topic.titleFa;
    case 'fr':
      return topic.titleFr;
    case 'es':
    case 'pt':
    case 'it':
      return topic.titleEs;
    case 'de':
    case 'nl':
      return topic.titleDe;
    case 'tr':
    case 'az':
    case 'uz':
      return topic.titleTr;
    case 'ru':
    case 'uk':
      return topic.titleRu;
    case 'zh':
      return topic.titleZh;
    case 'ja':
      return topic.titleJa;
    case 'ko':
      return topic.titleKo;
    default:
      return topic.titleEn;
  }
}

export function getTopicSubtitleForLang(
  topic: ConversationTopicNode,
  lang: LanguageInfo
): string {
  return getTopicTitleForLang(topic, lang);
}

export function getNinetyPlusConversationsForLang(
  targetLang: LanguageInfo,
  baseConversations: ConversationItem[]
): ConversationItem[] {
  const result: ConversationItem[] = [...baseConversations];
  let idx = 0;

  while (result.length < 95) {
    const topic = NINETY_CONVERSATION_TOPICS[idx % NINETY_CONVERSATION_TOPICS.length];
    const templateItem =
      baseConversations[idx % Math.max(1, baseConversations.length)];
    const targetTopicTitle = getTopicTitleForLang(topic, targetLang);

    result.push({
      situation: `${topic.icon} ${topic.titleEn}`,
      phrase: templateItem?.phrase || targetTopicTitle,
      pronunciation:
        templateItem?.pronunciation || templateItem?.phrase || targetTopicTitle,
      englishMeaning: `${topic.titleEn} — ${
        templateItem?.englishMeaning || 'Practical real-life conversation'
      }`,
      urduMeaning: `${topic.titleUr} — ${
        templateItem?.urduMeaning || 'عملی روزمرہ گفتگو'
      }`,
      replyHint: templateItem?.replyHint || topic.titleEn,
      icon: topic.icon,
      color: topic.accentColor,
      acceptedMatches: templateItem?.acceptedMatches || [
        templateItem?.phrase || targetTopicTitle,
      ],
      translations: {
        ...(templateItem?.translations || {}),
        en: `${topic.titleEn}: ${
          templateItem?.translations?.en || templateItem?.englishMeaning || ''
        }`,
        ur: `${topic.titleUr}: ${
          templateItem?.translations?.ur || templateItem?.urduMeaning || ''
        }`,
        hi: `${topic.titleHi}: ${
          templateItem?.translations?.hi || templateItem?.englishMeaning || ''
        }`,
        ar: `${topic.titleAr}: ${
          templateItem?.translations?.ar || templateItem?.englishMeaning || ''
        }`,
        fa: `${topic.titleFa}: ${
          templateItem?.translations?.fa || templateItem?.englishMeaning || ''
        }`,
        fr: `${topic.titleFr}: ${
          templateItem?.translations?.fr || templateItem?.englishMeaning || ''
        }`,
        es: `${topic.titleEs}: ${
          templateItem?.translations?.es || templateItem?.englishMeaning || ''
        }`,
        de: `${topic.titleDe}: ${
          templateItem?.translations?.de || templateItem?.englishMeaning || ''
        }`,
        tr: `${topic.titleTr}: ${
          templateItem?.translations?.tr || templateItem?.englishMeaning || ''
        }`,
        ru: `${topic.titleRu}: ${
          templateItem?.translations?.ru || templateItem?.englishMeaning || ''
        }`,
        zh: `${topic.titleZh}: ${
          templateItem?.translations?.zh || templateItem?.englishMeaning || ''
        }`,
        ja: `${topic.titleJa}: ${
          templateItem?.translations?.ja || templateItem?.englishMeaning || ''
        }`,
        ko: `${topic.titleKo}: ${
          templateItem?.translations?.ko || templateItem?.englishMeaning || ''
        }`,
      },
    });
    idx++;
  }

  return result;
}

export const ROUNDS_PER_TOPIC = 15;

export function getSentencesForTopicRound(
  allConversations: ConversationItem[],
  topicIndex: number,
  roundNumber: number,
  nativeLang?: LanguageInfo
): ConversationItem[] {
  if (!allConversations || allConversations.length === 0) return [];
  const topic =
    NINETY_CONVERSATION_TOPICS[
      Math.max(0, Math.min(NINETY_CONVERSATION_TOPICS.length - 1, topicIndex))
    ];
  const localizedTopicTitle = nativeLang
    ? getTopicTitleForLang(topic, nativeLang)
    : topic.titleEn;
  const startOffset =
    (topicIndex * ROUNDS_PER_TOPIC + (Math.max(1, roundNumber) - 1) * 3) %
    allConversations.length;

  const roundItems: ConversationItem[] = [];
  for (let i = 0; i < 5; i++) {
    const base = allConversations[(startOffset + i) % allConversations.length];
    roundItems.push({
      ...base,
      icon: topic.icon || base.icon,
      color: topic.accentColor || base.color,
      situation: `${topic.icon} ${localizedTopicTitle} · ${roundNumber}/${ROUNDS_PER_TOPIC}`,
    });
  }
  return roundItems;
}

export interface TopicPathUICopy {
  rtl: boolean;
  sectionUnitHeader: (section: number, unit: number) => string;
  guidebookBtn: string;
  startLabel: string;
  continueRoundLabel: (round: number, total: number) => string;
  completedTopicLabel: string;
  roundBadge: (round: number, total: number) => string;
  topicsProgressSummary: (completedTopics: number, totalTopics: number, totalSentences: number) => string;
  chestRewardTitle: string;
  chestOpenedLabel: string;
  searchTopicsPlaceholder: string;
  backToPathBtn: string;
  roundCompletedBanner: (topicNum: number, roundNum: number) => string;
  topicWord: string;
  lockedTopicLabel: string;
  lockedTopicToast: (prevTopicNum: number) => string;
  usernameBadgeLabel: string;
  editUsernamePlaceholder: string;
  speakUsernameBtn: string;
  saveUsernameBtn: string;
}

export function getTopicPathUICopy(nativeLang: LanguageInfo): TopicPathUICopy {
  const code = nativeLang.code;
  const rtl = Boolean(nativeLang.rtl);

  if (code === 'ur' || code === 'pa' || code === 'sd' || code === 'ps') {
    return {
      rtl: true,
      sectionUnitHeader: (s, u) => `سیکشن ${s}، یونٹ ${u}`,
      guidebookBtn: 'گائیڈ بک',
      startLabel: 'شروع کریں',
      continueRoundLabel: (r, t) => `راؤنڈ ${r}/${t} شروع کریں`,
      completedTopicLabel: 'مکمل شدہ (دوبارہ مشق)',
      roundBadge: (r, t) => `راؤنڈ ${r} از ${t}`,
      topicsProgressSummary: (c, t, s) =>
        `90 ٹاپکس (${c}/${t} مکمل) · ${s}+ جملے · ہر دائرے میں 15 راؤنڈ`,
      chestRewardTitle: 'بونس اسٹار باکس (+10 ⭐)',
      chestOpenedLabel: 'انعام مل گیا ✓',
      searchTopicsPlaceholder: '90 ٹاپکس میں تلاش کریں (مسافر سے مقامی تک)...',
      backToPathBtn: 'واپس 90 ٹاپکس پر جائیں',
      roundCompletedBanner: (tNum, rNum) =>
        `🎉 شاباش! ٹاپک ${tNum} کا راؤنڈ ${rNum}/15 مکمل ہو گیا! اگلے راؤنڈ کے لیے دائرے پر کلک کریں۔`,
      topicWord: 'ٹاپک',
      lockedTopicLabel: 'مقفل ٹاپک 🔒',
      lockedTopicToast: (prev) =>
        `🔒 پہلے ٹاپک ${prev} کے تمام 15 راؤنڈ مکمل کریں تاکہ یہ ٹاپک کھل جائے!`,
      usernameBadgeLabel: 'یوزر نیم:',
      editUsernamePlaceholder: 'اپنا یوزر نیم کسی بھی زبان میں لکھیں یا بولیں...',
      speakUsernameBtn: '🎤 بول کر نام لکھیں',
      saveUsernameBtn: 'محفوظ کریں ✓',
    };
  }

  if (code === 'hi' || code === 'mr' || code === 'ne' || code === 'bn' || code === 'gu') {
    return {
      rtl: false,
      sectionUnitHeader: (s, u) => `सेक्शन ${s}, यूनिट ${u}`,
      guidebookBtn: 'गाइडबुक',
      startLabel: 'शुरू करें',
      continueRoundLabel: (r, t) => `राउंड ${r}/${t} शुरू करें`,
      completedTopicLabel: 'पूरा हुआ (फिर से अभ्यास)',
      roundBadge: (r, t) => `राउंड ${r} / ${t}`,
      topicsProgressSummary: (c, t, s) =>
        `90 टॉपिक्स (${c}/${t} पूरे) · ${s}+ वाक्य · हर सर्कल में 15 राउंड`,
      chestRewardTitle: 'बोनस स्टार बॉक्स (+10 ⭐)',
      chestOpenedLabel: 'इनाम मिल गया ✓',
      searchTopicsPlaceholder: '90 टॉपिक्स खोजें (यात्री से स्थानीय निवासी तक)...',
      backToPathBtn: '90 टॉपिक्स पथ पर वापस जाएं',
      roundCompletedBanner: (tNum, rNum) =>
        `🎉 शाबाश! टॉपिक ${tNum} का राउंड ${rNum}/15 पूरा हुआ! अगले राउंड के लिए सर्कल पर क्लिक करें।`,
      topicWord: 'टॉपिक',
      lockedTopicLabel: 'लॉक किया गया टॉपिक 🔒',
      lockedTopicToast: (prev) =>
        `🔒 अगला टॉपिक अनलॉक करने के लिए पहले टॉपिक ${prev} के सभी 15 राउंड पूरे करें!`,
      usernameBadgeLabel: 'यूज़रनेम:',
      editUsernamePlaceholder: 'अपना यूज़रनेम किसी भी भाषा में लिखें या बोलें...',
      speakUsernameBtn: '🎤 बोलकर नाम लिखें',
      saveUsernameBtn: 'सेव करें ✓',
    };
  }

  if (code === 'ar') {
    return {
      rtl: true,
      sectionUnitHeader: (s, u) => `القسم ${s}، الوحدة ${u}`,
      guidebookBtn: 'دليل المحادثة',
      startLabel: 'ابدأ',
      continueRoundLabel: (r, t) => `ابدأ الجولة ${r}/${t}`,
      completedTopicLabel: 'مكتمل (مراجعة)',
      roundBadge: (r, t) => `الجولة ${r} من ${t}`,
      topicsProgressSummary: (c, t, s) =>
        `90 موضوعاً (${c}/${t} مكتمل) · ${s}+ جملة · 15 جولة في كل دائرة`,
      chestRewardTitle: 'صندوق نجوم إضافي (+10 ⭐)',
      chestOpenedLabel: 'تم الاستلام ✓',
      searchTopicsPlaceholder: 'ابحث في 90 موضوعاً (من مسافر إلى مقيم)...',
      backToPathBtn: 'العودة إلى مسار 90 موضوعاً',
      roundCompletedBanner: (tNum, rNum) =>
        `🎉 أحسنت! اكتملت الجولة ${rNum}/15 من الموضوع ${tNum}! اضغط على الدائرة للجولة التالية.`,
      topicWord: 'موضوع',
      lockedTopicLabel: 'موضوع مقفل 🔒',
      lockedTopicToast: (prev) =>
        `🔒 أكمل جميع الجولات الـ 15 للموضوع ${prev} أولاً لفتح هذا الموضوع!`,
      usernameBadgeLabel: 'اسم المستخدم:',
      editUsernamePlaceholder: 'اكتب أو انطق اسم المستخدم بأي لغة...',
      speakUsernameBtn: '🎤 انطق الاسم',
      saveUsernameBtn: 'حفظ ✓',
    };
  }

  if (code === 'fa' || code === 'ku') {
    return {
      rtl: true,
      sectionUnitHeader: (s, u) => `بخش ${s}، واحد ${u}`,
      guidebookBtn: 'کتابچه راهنما',
      startLabel: 'شروع کنید',
      continueRoundLabel: (r, t) => `شروع دور ${r}/${t}`,
      completedTopicLabel: 'تکمیل شد (مرور دوباره)',
      roundBadge: (r, t) => `دور ${r} از ${t}`,
      topicsProgressSummary: (c, t, s) =>
        `90 موضوع (${c}/${t} کامل) · ${s}+ جمله · ۱۵ دور در هر دایره`,
      chestRewardTitle: 'جعبه ستاره پاداش (+10 ⭐)',
      chestOpenedLabel: 'دریافت شد ✓',
      searchTopicsPlaceholder: 'جستجو در ۹۰ موضوع (از مسافر تا شهروند بومی)...',
      backToPathBtn: 'بازگشت به مسیر ۹۰ موضوع',
      roundCompletedBanner: (tNum, rNum) =>
        `🎉 آفرین! دور ${rNum}/15 از موضوع ${tNum} کامل شد! برای دور بعدی دوباره کلیک کنید.`,
      topicWord: 'موضوع',
      lockedTopicLabel: 'موضوع قفل‌شده 🔒',
      lockedTopicToast: (prev) =>
        `🔒 ابتدا هر ۱۵ دور موضوع ${prev} را کامل کنید تا این موضوع باز شود!`,
      usernameBadgeLabel: 'نام کاربری:',
      editUsernamePlaceholder: 'نام کاربری خود را به هر زبانی بنویسید یا بگویید...',
      speakUsernameBtn: '🎤 گفتن نام با صدا',
      saveUsernameBtn: 'ذخیره ✓',
    };
  }

  if (code === 'fr') {
    return {
      rtl: false,
      sectionUnitHeader: (s, u) => `Section ${s}, Unité ${u}`,
      guidebookBtn: 'Guide',
      startLabel: 'Commencer',
      continueRoundLabel: (r, t) => `Manche ${r}/${t}`,
      completedTopicLabel: 'Terminé (Réviser)',
      roundBadge: (r, t) => `Manche ${r}/${t}`,
      topicsProgressSummary: (c, t, s) =>
        `90 Sujets (${c}/${t}) · ${s}+ Phrases · 15 manches par cercle`,
      chestRewardTitle: 'Coffre Bonus (+10 ⭐)',
      chestOpenedLabel: 'Réclamé ✓',
      searchTopicsPlaceholder: 'Rechercher parmi les 90 sujets...',
      backToPathBtn: 'Retour aux 90 sujets',
      roundCompletedBanner: (tNum, rNum) =>
        `🎉 Bravo ! Sujet ${tNum} Manche ${rNum}/15 terminée ! Cliquez pour la manche suivante.`,
      topicWord: 'Sujet',
      lockedTopicLabel: 'Sujet verrouillé 🔒',
      lockedTopicToast: (prev) =>
        `🔒 Terminez les 15 manches du sujet ${prev} pour débloquer ce sujet !`,
      usernameBadgeLabel: 'Pseudo :',
      editUsernamePlaceholder: 'Écrivez ou dites votre nom dans votre langue...',
      speakUsernameBtn: '🎤 Dire le nom',
      saveUsernameBtn: 'Enregistrer ✓',
    };
  }

  return {
    rtl,
    sectionUnitHeader: (s, u) => `Section ${s}, Unit ${u}`,
    guidebookBtn: 'Guidebook',
    startLabel: 'START',
    continueRoundLabel: (r, t) => `ROUND ${r}/${t}`,
    completedTopicLabel: 'COMPLETED (PRACTICE)',
    roundBadge: (r, t) => `Round ${r} of ${t}`,
    topicsProgressSummary: (c, t, s) =>
      `90 Topics (${c}/${t} Completed) · ${s}+ Sentences · 15 Rounds per Circle`,
    chestRewardTitle: 'Bonus Star Chest (+10 ⭐)',
    chestOpenedLabel: 'Claimed ✓',
    searchTopicsPlaceholder: 'Search 90 topics (Traveler arrival to Local resident)...',
    backToPathBtn: 'Back to 90 Topics Path',
    roundCompletedBanner: (tNum, rNum) =>
      `🎉 Awesome! Topic ${tNum} Round ${rNum}/15 complete! Click the circle for the next round.`,
    topicWord: 'Topic',
    lockedTopicLabel: 'Locked Topic 🔒',
    lockedTopicToast: (prev) =>
      `🔒 Complete all 15 rounds of Topic ${prev} first to unlock this topic!`,
    usernameBadgeLabel: 'Username:',
    editUsernamePlaceholder: 'Type or speak your username in any language...',
    speakUsernameBtn: '🎤 Speak Name',
    saveUsernameBtn: 'Save ✓',
  };
}

const KNOWN_WORD_TRANSLITERATIONS: Record<
  string,
  { ur: string; fa: string; ar: string; hi: string; ru: string; en: string }
> = {
  tiktok: {
    ur: 'ٹک ٹاک',
    fa: 'تیک تاک',
    ar: 'تيك توك',
    hi: 'टिकटॉक',
    ru: 'ТикТок',
    en: 'TikTok',
  },
  automation: {
    ur: 'آٹومیشن',
    fa: 'اتوماسیون',
    ar: 'أوتوميشن',
    hi: 'ऑटोमेशन',
    ru: 'Автоматизация',
    en: 'Automation',
  },
  mustafa: {
    ur: 'مصطفیٰ',
    fa: 'مصطفی',
    ar: 'مصطفى',
    hi: 'मुस्तफ़ा',
    ru: 'Мустафа',
    en: 'Mustafa',
  },
  ali: {
    ur: 'علی',
    fa: 'علی',
    ar: 'علي',
    hi: 'अली',
    ru: 'Али',
    en: 'Ali',
  },
  ahmed: {
    ur: 'احمد',
    fa: 'احمد',
    ar: 'أحمد',
    hi: 'अहमद',
    ru: 'Ахмед',
    en: 'Ahmed',
  },
  ahmad: {
    ur: 'احمد',
    fa: 'احمد',
    ar: 'أحمد',
    hi: 'अहमद',
    ru: 'Ахмад',
    en: 'Ahmad',
  },
  muhammad: {
    ur: 'محمد',
    fa: 'محمد',
    ar: 'محمد',
    hi: 'मुहम्मद',
    ru: 'Мухаммад',
    en: 'Muhammad',
  },
  mohammad: {
    ur: 'محمد',
    fa: 'محمد',
    ar: 'محمد',
    hi: 'मोहम्मद',
    ru: 'Мохаммад',
    en: 'Mohammad',
  },
  hassan: {
    ur: 'حسن',
    fa: 'حسن',
    ar: 'حسن',
    hi: 'हसन',
    ru: 'Хасан',
    en: 'Hassan',
  },
  hussain: {
    ur: 'حسین',
    fa: 'حسین',
    ar: 'حسين',
    hi: 'हुसैन',
    ru: 'Хусейн',
    en: 'Hussain',
  },
  khan: {
    ur: 'خان',
    fa: 'خان',
    ar: 'خان',
    hi: 'खान',
    ru: 'Хан',
    en: 'Khan',
  },
  malik: {
    ur: 'ملک',
    fa: 'ملک',
    ar: 'ملك',
    hi: 'मलिक',
    ru: 'Малик',
    en: 'Malik',
  },
  sara: {
    ur: 'سارہ',
    fa: 'سارا',
    ar: 'سارة',
    hi: 'सारा',
    ru: 'Сара',
    en: 'Sara',
  },
  fatima: {
    ur: 'فاطمہ',
    fa: 'فاطمه',
    ar: 'فاطمة',
    hi: 'फ़ातिमा',
    ru: 'Фатима',
    en: 'Fatima',
  },
  zain: {
    ur: 'زین',
    fa: 'زین',
    ar: 'زين',
    hi: 'ज़ैन',
    ru: 'Зейн',
    en: 'Zain',
  },
  umar: {
    ur: 'عمر',
    fa: 'عمر',
    ar: 'عمر',
    hi: 'उमर',
    ru: 'Умар',
    en: 'Umar',
  },
  usman: {
    ur: 'عثمان',
    fa: 'عثمان',
    ar: 'عثمان',
    hi: 'उस्मान',
    ru: 'Усман',
    en: 'Usman',
  },
  bilal: {
    ur: 'بلال',
    fa: 'بلال',
    ar: 'بلال',
    hi: 'बिलाल',
    ru: 'Биلال',
    en: 'Bilal',
  },
  hamza: {
    ur: 'حمزہ',
    fa: 'حمزه',
    ar: 'حمزة',
    hi: 'हमज़ा',
    ru: 'Хамза',
    en: 'Hamza',
  },
  imran: {
    ur: 'عمران',
    fa: 'عمران',
    ar: 'عمران',
    hi: 'इमरान',
    ru: 'Имран',
    en: 'Imran',
  },
  salman: {
    ur: 'سلمان',
    fa: 'سلمان',
    ar: 'سلمان',
    hi: 'सलमान',
    ru: 'Салман',
    en: 'Salman',
  },
};

function transliterateLatinWordToArabicScript(word: string): string {
  const lower = word.toLowerCase();
  let out = '';
  let i = 0;
  while (i < lower.length) {
    const two = lower.slice(i, i + 2);
    if (two === 'sh') {
      out += 'ش';
      i += 2;
      continue;
    }
    if (two === 'ch') {
      out += 'چ';
      i += 2;
      continue;
    }
    if (two === 'kh') {
      out += 'خ';
      i += 2;
      continue;
    }
    if (two === 'gh') {
      out += 'غ';
      i += 2;
      continue;
    }
    if (two === 'ph') {
      out += 'ف';
      i += 2;
      continue;
    }
    if (two === 'th') {
      out += 'تھ';
      i += 2;
      continue;
    }
    if (two === 'aa') {
      out += i === 0 ? 'آ' : 'ا';
      i += 2;
      continue;
    }
    if (two === 'ee') {
      out += 'ی';
      i += 2;
      continue;
    }
    if (two === 'oo') {
      out += 'و';
      i += 2;
      continue;
    }
    const ch = lower[i];
    const map: Record<string, string> = {
      a: i === 0 ? 'ا' : 'ا',
      b: 'ب',
      c: 'ک',
      d: 'د',
      e: 'ی',
      f: 'ف',
      g: 'گ',
      h: 'ہ',
      i: 'ی',
      j: 'ج',
      k: 'ک',
      l: 'ل',
      m: 'م',
      n: 'ن',
      o: 'و',
      p: 'پ',
      q: 'ق',
      r: 'ر',
      s: 'س',
      t: 'ٹ',
      u: 'و',
      v: 'و',
      w: 'و',
      x: 'کس',
      y: 'ی',
      z: 'ز',
    };
    out += map[ch] ?? ch;
    i++;
  }
  return out;
}

function transliterateLatinWordToDevanagari(word: string): string {
  const lower = word.toLowerCase();
  let out = '';
  let i = 0;
  while (i < lower.length) {
    const two = lower.slice(i, i + 2);
    if (two === 'sh') {
      out += 'श';
      i += 2;
      continue;
    }
    if (two === 'ch') {
      out += 'च';
      i += 2;
      continue;
    }
    if (two === 'kh') {
      out += 'ख';
      i += 2;
      continue;
    }
    if (two === 'gh') {
      out += 'घ';
      i += 2;
      continue;
    }
    if (two === 'ph') {
      out += 'फ';
      i += 2;
      continue;
    }
    if (two === 'th') {
      out += 'थ';
      i += 2;
      continue;
    }
    if (two === 'aa') {
      out += i === 0 ? 'आ' : 'ा';
      i += 2;
      continue;
    }
    if (two === 'ee') {
      out += i === 0 ? 'ई' : 'ी';
      i += 2;
      continue;
    }
    if (two === 'oo') {
      out += i === 0 ? 'ऊ' : 'ू';
      i += 2;
      continue;
    }
    const ch = lower[i];
    const vowelStart: Record<string, string> = {
      a: 'अ',
      e: 'ए',
      i: 'इ',
      o: 'ओ',
      u: 'उ',
    };
    const vowelMatra: Record<string, string> = {
      a: 'ा',
      e: 'े',
      i: 'ि',
      o: 'ो',
      u: 'ु',
    };
    if (vowelStart[ch]) {
      out += i === 0 ? vowelStart[ch] : vowelMatra[ch];
      i++;
      continue;
    }
    const map: Record<string, string> = {
      b: 'ब',
      c: 'क',
      d: 'द',
      f: 'फ़',
      g: 'ग',
      h: 'ह',
      j: 'ज',
      k: 'क',
      l: 'ल',
      m: 'म',
      n: 'न',
      p: 'प',
      q: 'क़',
      r: 'र',
      s: 'स',
      t: 'ट',
      v: 'व',
      w: 'व',
      x: 'क्स',
      y: 'य',
      z: 'ज़',
    };
    out += map[ch] ?? ch;
    i++;
  }
  return out;
}

function transliterateArabicOrDevanagariToLatin(input: string): string {
  let text = input
    .replace(/ٹک ٹاک/g, 'TikTok')
    .replace(/آٹومیشن/g, 'Automation')
    .replace(/مصطفیٰ|مصطفی|مصطفى|मुस्तफ़ा|मुस्तफा/g, 'Mustafa')
    .replace(/علی|علي|अली/g, 'Ali')
    .replace(/احمد|أحمد|अहमद/g, 'Ahmed')
    .replace(/محمد|मुहम्मद|मोहम्मद/g, 'Muhammad')
    .replace(/حسن|हसन/g, 'Hassan')
    .replace(/حسین|حسين|हुसैन/g, 'Hussain')
    .replace(/خان|खान/g, 'Khan')
    .replace(/سارہ|سارا|سارة|सारा/g, 'Sara')
    .replace(/فاطمہ|فاطمه|فاطمة|फ़ातिमा/g, 'Fatima');

  if (!/[\u0600-\u06FF\u0900-\u097F]/.test(text)) {
    return text;
  }

  const charMap: Record<string, string> = {
    آ: 'Aa',
    ا: 'a',
    أ: 'a',
    إ: 'i',
    ب: 'b',
    پ: 'p',
    ت: 't',
    ٹ: 't',
    ث: 's',
    ج: 'j',
    چ: 'ch',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ڈ: 'd',
    ذ: 'z',
    ر: 'r',
    ڑ: 'r',
    ز: 'z',
    ژ: 'zh',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'z',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ک: 'k',
    ك: 'k',
    گ: 'g',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ں: 'n',
    و: 'o',
    ہ: 'h',
    ه: 'h',
    ھ: 'h',
    ء: '',
    ی: 'i',
    ے: 'e',
    ى: 'a',
    'ٰ': 'a',
    अ: 'a',
    आ: 'aa',
    इ: 'i',
    ई: 'ee',
    उ: 'u',
    ऊ: 'oo',
    ए: 'e',
    ओ: 'o',
    क: 'k',
    ख: 'kh',
    ग: 'g',
    घ: 'gh',
    च: 'ch',
    छ: 'chh',
    ज: 'j',
    झ: 'jh',
    ट: 't',
    ड: 'd',
    त: 't',
    थ: 'th',
    द: 'd',
    ध: 'dh',
    न: 'n',
    प: 'p',
    फ: 'ph',
    ब: 'b',
    भ: 'bh',
    म: 'm',
    य: 'y',
    र: 'r',
    ल: 'l',
    व: 'v',
    श: 'sh',
    स: 's',
    ह: 'h',
    'ा': 'a',
    'ि': 'i',
    'ी': 'ee',
    'ु': 'u',
    'ू': 'oo',
    'े': 'e',
    'ै': 'ai',
    'ो': 'o',
    'ौ': 'au',
  };

  let out = '';
  for (const ch of text) {
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return out
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Converts or preserves the user's entered username so it is always written in
 * the user's spoken language (`nativeLang`) while respecting any custom script.
 */
export function localizeUsernameForSpokenLanguage(
  rawName: string,
  nativeLang: LanguageInfo,
  fallbackDefaultName = ''
): string {
  const trimmed = (rawName || '').trim();
  const GenericDefaults = [
    'طالب علم',
    'Alex',
    'Learner',
    'विद्यार्थी',
    'دانش‌آموز',
    'متعلم',
    'Étudiant',
  ];
  if (!trimmed || GenericDefaults.includes(trimmed)) {
    return fallbackDefaultName || trimmed || 'Learner';
  }

  const code = nativeLang.code;
  const isArabicScriptLang = ['ur', 'fa', 'ar', 'ps', 'sd', 'ku', 'ug'].includes(
    code
  );
  const isDevanagariLang = ['hi', 'mr', 'ne'].includes(code);
  const isCyrillicLang = ['ru', 'uk', 'bg', 'sr', 'kk', 'uz'].includes(code);

  // If user typed in Latin or another script and selected an Arabic/Urdu/Persian language:
  if (isArabicScriptLang) {
    if (/[\u0600-\u06FF]/.test(trimmed)) {
      return trimmed;
    }
    const latinBase = /[\u0900-\u097F]/.test(trimmed)
      ? transliterateArabicOrDevanagariToLatin(trimmed)
      : trimmed;

    return latinBase
      .split(/\s+/)
      .map((part) => {
        const cleanKey = part.toLowerCase().replace(/[^a-z]/g, '');
        const known = KNOWN_WORD_TRANSLITERATIONS[cleanKey];
        if (known) {
          if (code === 'fa' || code === 'ku') return known.fa;
          if (code === 'ar') return known.ar;
          return known.ur;
        }
        if (/^[a-zA-Z]+$/.test(part)) {
          return transliterateLatinWordToArabicScript(part);
        }
        return part;
      })
      .join(' ');
  }

  // If user selected Hindi / Marathi / Nepali (Devanagari):
  if (isDevanagariLang) {
    if (/[\u0900-\u097F]/.test(trimmed)) {
      return trimmed;
    }
    const latinBase = /[\u0600-\u06FF]/.test(trimmed)
      ? transliterateArabicOrDevanagariToLatin(trimmed)
      : trimmed;

    return latinBase
      .split(/\s+/)
      .map((part) => {
        const cleanKey = part.toLowerCase().replace(/[^a-z]/g, '');
        const known = KNOWN_WORD_TRANSLITERATIONS[cleanKey];
        if (known) return known.hi;
        if (/^[a-zA-Z]+$/.test(part)) {
          return transliterateLatinWordToDevanagari(part);
        }
        return part;
      })
      .join(' ');
  }

  // If user selected Russian / Cyrillic:
  if (isCyrillicLang) {
    if (/[\u0400-\u04FF]/.test(trimmed)) {
      return trimmed;
    }
    const latinBase = /[\u0600-\u06FF\u0900-\u097F]/.test(trimmed)
      ? transliterateArabicOrDevanagariToLatin(trimmed)
      : trimmed;

    return latinBase
      .split(/\s+/)
      .map((part) => {
        const cleanKey = part.toLowerCase().replace(/[^a-z]/g, '');
        const known = KNOWN_WORD_TRANSLITERATIONS[cleanKey];
        if (known) return known.ru;
        return part;
      })
      .join(' ');
  }

  // If user selected a Latin-script language (en, fr, es, de, tr, etc.) and their username was written in Urdu/Arabic/Devanagari:
  if (/[\u0600-\u06FF\u0900-\u097F]/.test(trimmed)) {
    return transliterateArabicOrDevanagariToLatin(trimmed);
  }

  return trimmed;
}

