export interface DhikrItem {
  id: string;
  arabic?: string;
  arabicImg?: string;
  transliteration: string;
  full_transliteration?: string;
  translation?: string;
  defaultTarget: number;
}

export const GENERAL_ADHKAR: DhikrItem[] = [
  {
    "id": "free_count",
    "transliteration": "Free Count",
    "defaultTarget": 999999
  },
  {
    "id": "subhanallah",
    "arabic": "\u0633\u064f\u0628\u0652\u062d\u064e\u0627\u0646\u064e \u0627\u0644\u0644\u064e\u0651\u0647\u0650",
    "transliteration": "SubhanAllah",
    "translation": "Glory be to Allah",
    "defaultTarget": 33
  },
  {
    "id": "alhamdulillah",
    "arabic": "\u0627\u0644\u0652\u062d\u064e\u0645\u0652\u062f\u064f \u0644\u0650\u0644\u064e\u0651\u0647\u0650",
    "transliteration": "Alhamdulillah",
    "translation": "All praise is due to Allah",
    "defaultTarget": 33
  },
  {
    "id": "allahuakbar",
    "arabic": "\u0627\u0644\u0644\u064e\u0651\u0647\u064f \u0623\u064e\u0643\u0652\u0628\u064e\u0631\u064f",
    "transliteration": "Allahu Akbar",
    "translation": "Allah is the Greatest",
    "defaultTarget": 34
  },
  {
    "id": "istighfar",
    "arabic": "\u0623\u064e\u0633\u0652\u062a\u064e\u063a\u0652\u0641\u0650\u0631\u064f \u0627\u0644\u0644\u064e\u0651\u0647\u064e",
    "transliteration": "Astaghfirullah",
    "translation": "I seek forgiveness from Allah",
    "defaultTarget": 100
  },
  {
    "id": "sayyidul_istighfar",
    "arabic": "\u0627\u0644\u0644\u064e\u0651\u0647\u064f\u0645\u064e\u0651 \u0623\u064e\u0646\u0652\u062a\u064e \u0631\u064e\u0628\u0650\u0651\u064a \u0644\u0627 \u0625\u0650\u0644\u064e\u0647\u064e \u0625\u0650\u0644\u0627 \u0623\u064e\u0646\u0652\u062a\u064e\u060c \u062e\u064e\u0644\u064e\u0642\u0652\u062a\u064e\u0646\u0650\u064a \u0648\u064e\u0623\u064e\u0646\u064e\u0627 \u0639\u064e\u0628\u0652\u062f\u064f\u0643\u064e\u060c \u0648\u064e\u0623\u064e\u0646\u064e\u0627 \u0639\u064e\u0644\u064e\u0649 \u0639\u064e\u0647\u0652\u062f\u0650\u0643\u064e \u0648\u064e\u0648\u064e\u0639\u0652\u062f\u0650\u0643\u064e \u0645\u064e\u0627 \u0627\u0633\u0652\u062a\u064e\u0637\u064e\u0639\u0652\u062a\u064f",
    "transliteration": "Sayyidul Istighfar",
    "translation": "O Allah, You are my Lord, none has the right to be worshipped except You...",
    "defaultTarget": 1
  },
  {
    "id": "la_ilaha_illallah",
    "arabic": "\u0644\u064e\u0627 \u0625\u0650\u0644\u064e\u0647\u064e \u0625\u0650\u0644\u064e\u0651\u0627 \u0627\u0644\u0644\u0647\u064f \u0648\u064e\u062d\u0652\u062f\u064e\u0647\u064f \u0644\u064e\u0627 \u0634\u064e\u0631\u0650\u064a\u0643\u064e \u0644\u064e\u0647\u064f",
    "transliteration": "La ilaha illallah",
    "translation": "None has the right to be worshipped except Allah, alone, without partner",
    "defaultTarget": 100
  },
  {
    "id": "subhanallahi_wa_bihamdihi",
    "arabic": "\u0633\u064f\u0628\u0652\u062d\u064e\u0627\u0646\u064e \u0627\u0644\u0644\u064e\u0651\u0647\u0650 \u0648\u064e\u0628\u0650\u062d\u064e\u0645\u0652\u062f\u0650\u0647\u0650",
    "transliteration": "SubhanAllahi wa bihamdihi",
    "translation": "Glory is to Allah and praise is to Him",
    "defaultTarget": 100
  }
];

export const MORNING_ADHKAR: DhikrItem[] = [
  {
    "id": "morning_2",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Fatiha.png",
    "transliteration": "1:1 Bismillaahir rahmaa-nir raheem....",
    "full_transliteration": "1:1 Bismillaahir rahmaa-nir raheem. 1:2 Alhamdu lillaahi rabbil aa\u2019lameen.1:3 Ar-rahmaa-nir-raheem.1:4 Maaliki yawmid-deen.1:5 Iyyaaka na\u2019budu wa lyyaaka nasta\u2019een.1:6 Ihdinas siraa\u2019tal mustaqeem.1:7 Siraatal-lazeena an\u2019amta \u2018alaihim ghayril maghdoo bi\u2019alai\u2019him wa lad-daalleen.",
    "translation": "1:1 In the name of Allah, the Entirely Merciful, the Especially Merciful. 1:2 [All] praise is [due] to Allah, Lord of the worlds.1:3 The Entirely Merciful, the Especially Merciful.1:4 Sovereign of the Day of Recompense.1:5 It is You we worship and You we ask for help.1:6 Guide us to the straight path.1:7 The path of those upon whom You have bestowed favour, not of those who have evoked [Your] anger or of those who are astray.",
    "defaultTarget": 1
  },
  {
    "id": "morning_3",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Baqara-1-7.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 2:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 2:1 Alif Laam Meem.2:2 Zaalikal kitaabu-laa raiba : feeh : hudal-lil muttaqeen.2:3 Allazeena yu\u2019minoona bilghaibi wa yu\u2019qee-moonas salata wa mim\u2019maa razaqna\u2019hum yun\u2019fiqoon.2:4 Wal\u2019lazena yu\u2019minoona bimaa un\u2019zila ilaika wa-maa unzila min qablika wa bil aa\u2019khirati hum yu\u2019qinoon.2:5 Ulaa\u2019ika aa\u2019laa hudam-mir rabbihim; wa ulaa\u2019ika humul muflihoon.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:1 Alif-Lam-Mim.[These letters are one of the miracles of the Qur\u2019an and none but Allah (Alone) knows their meanings].2:2 This is the Book about which there is no doubt, a guidance for those conscious of Allah.2:3 Who believe in the unseen, establish prayer, and spend out of what We have provided for them.2:4 And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].2:5 Those are upon [right] guidance from their Lord, and it is those who are the successful.",
    "defaultTarget": 1
  },
  {
    "id": "morning_4",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/ayatul-kursi.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 255:...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 255: Allahu laa ilaaha illaa\u2019hu wal haiyul qai-yoom;Laa taa\u2019khuzuhoo sinatu\u2019oo walaa na\u2019woom;Lahoo maa fis\u2019samaawaati wa-maa fil ard;Man zal\u2019lazee yashfa\u2019oo in\u2019dahoo illa be iznih;Ya\u2019lamu maa baina ai\u2019deehim wa\u2019maa khal-fahum;Wa\u2019laa yuhee\u2019toona bee\u2019shai-im\u2019min il\u2019mihee illa be-maa shaa;Wasi\u2019aa kursi\u2019yuhus samaa-waati wal arda;Wa\u2019laa yaoo\u2019duhoo hif\u2019zuhumaa wa huwal ali\u2019yyul azeem.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:255 Allah \u2013 there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
    "defaultTarget": 1
  },
  {
    "id": "morning_5",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e4.png",
    "transliteration": "2:256 Laa ik\u2019raaha fid-deen;Qat-tabiya\u2019nar...",
    "full_transliteration": "2:256 Laa ik\u2019raaha fid-deen;Qat-tabiya\u2019nar rushdu minal ghayy;Famai \u2018yakfur bit taa\u2019ghooti wa yu\u2019mim billaahi faqadis tamsaka bil\u2019urwatil wusqaa lan-fisaama lahaa;Wallaahu samee\u2019un aleem.",
    "translation": "2:256 There shall be no compulsion in [acceptance of] the religion. The right course has become clear from the wrong. So whoever disbelieves in Taghut and believes in Allah has grasped the most trustworthy handhold with no break in it. And Allah is Hearing and Knowing.",
    "defaultTarget": 1
  },
  {
    "id": "morning_6",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e5.png",
    "transliteration": "2:257 Allaahu waliyyul lazeena...",
    "full_transliteration": "2:257 Allaahu waliyyul lazeena aa\u2019manoo yukh\u2019rijuhum minaz-zulumaati ilan noor;Wal\u2019lazee na-kafaroo awliyaa uo\u2019humut taa\u2019ghootu yukh\u2019rijoo-nahum minan noori ilaz-zulumaat;Ulaa\u2019ika as\u2019haabun naari hum fee\u2019haa khaa\u2019lidoon.",
    "translation": "2:257 Allah is the ally of those who believe. He brings them out from darknesses into the light. And those who disbelieve \u2013 their allies are Taghut. They take them out of the light into darknesses. Those are the companions of the Fire; they will abide eternally therein.",
    "defaultTarget": 1
  },
  {
    "id": "morning_7",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e6-new.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 2:284...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 2:284 Lillaahi maa fis-samaawaati wa-maa fil ard;Wa in\u2019tubdoo maa feee an\u2019fusikum aw tukh-foohu yuhaa-sibkum bihil-laa;Fayagh\u2019firuli maiya-shaa\u2019u wa yu\u2019azzibu maiya-shaa;Wallaahu aa\u2019laa kulli shai in qadeer.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:284 To Allah belongs whatever is in the heavens and whatever is in the earth. Whether you show what is within yourselves or conceal it, Allah will bring you to account for it. Then He will forgive whom He wills and punish whom He wills, and Allah is over all things competent.",
    "defaultTarget": 1
  },
  {
    "id": "morning_8",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e7.png",
    "transliteration": "2:285 Aa\u2019manar-rasoolu bimaa un\u2019zila...",
    "full_transliteration": "2:285 Aa\u2019manar-rasoolu bimaa un\u2019zila ilaihi mir-Rabbihee walmu\u2019minoon;Kul\u2019lun aa\u2019mana billaahi wa malaa\u2019ikathihee wa kutubhihee wa rusulihee,Laa nufar\u2019riqu baina ahadim-mir-rusulih;Wa qaaloo sami\u2019naa wa aata\u2019naa;Ghufra-naka rabbana wa ilaikal maser.",
    "translation": "2:285 The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], We make no distinction between any of His messengers. And they say, We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination.",
    "defaultTarget": 1
  },
  {
    "id": "morning_9",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e8.png",
    "transliteration": "2:286 Laa yukalliful-laahu nafsan...",
    "full_transliteration": "2:286 Laa yukalliful-laahu nafsan illaa wus\u2019ahaa;Lahaa maa kasabat wa aa\u2019laihaa mak-tasabat;Rabbana laa tu\u2019aakhiznaa in\u2019naa-seenaa aw-akhtaa\u2019naa;Rabbana wa laa tahmil-alainaa isran kamaa hamaltahoo alal-lazeena min qablinaa;Rabbana wa laa tuham-milnaa maa laa taa\u2019qata lanaa bih;Wa\u2019fu annaa waghfir lanaa war\u2019hamnaa;Anta mawlana fansur-naa alal qawmil kaafireen.",
    "translation": "2:286 Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.",
    "defaultTarget": 1
  },
  {
    "id": "morning_10",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Ikhlas.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 112:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 112:1 Qul hu\u2019wallaa-hu ahad.112:2 Allah hus-samad.112:3 Lam yalid wa-lam yoou\u2019lad.112:4 Wa lam\u2019ya kul-lahu kufu\u2019wan ahad.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 112:1 Say, He is Allah, [who is] One.112:2 Allah, the Eternal Refuge.112:3 He neither begets nor is born.112:4 Nor is there to Him any equivalent.",
    "defaultTarget": 3
  },
  {
    "id": "morning_11",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Falaq.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 113:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 113:1 Qul a\u2019uzoo-bi rabbil-falaq.113:2 Min sharri ma khalaq.113:3 Wa min sharri gha\u2019siqin iza waqab.113:4 Wa min shar\u2019rin naf\u2019faa saati\u2019fil uqad.113:5 Wa min shar\u2019ri haa\u2019sidin iza hasad.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 113.1 Say, I seek refuge in the Lord of daybreak.113.2 From the evil of that which He created.113.3 And from the evil of darkness when it settles.113.4 And from the evil of the blowers in knots.113:5 And from the evil of an envier when he envies.",
    "defaultTarget": 3
  },
  {
    "id": "morning_12",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/An-Naas.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 114:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 114:1 Qul a\u2019uzu-bi rab\u2019binn naas.114:2 Malik\u2019inn naas.114:3 Ilaa hin\u2019naas.114:5 Min shar\u2019ril waas-wa-asil khan\u2019naas.114:6 Al lazee yu\u2019was wi\u2019su fee sudoo-rin naas.114:7 Minal jin\u2019nati wan naas.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 114.1 Say, I seek refuge in the Lord of mankind.114.2 He Sovereign of mankind.114.3 The God of mankind.114.4 From the evil of the retreating whisperer.114.5 Who whispers [evil] into the breasts of mankind.114.6 From among the jinn and mankind.",
    "defaultTarget": 3
  },
  {
    "id": "morning_13",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m12.png",
    "transliteration": "Asbahna wa-asbahal mulku lillah;Wal-hamdu...",
    "full_transliteration": "Asbahna wa-asbahal mulku lillah;Wal-hamdu lillah;La ilaha illal-lah;Wah-da\u2019hoo la-sharee kalah;Lahul-mulku wa\u2019lahul-hamd;Yuh-ee wa yu\u2019meeto wa\u2019huwa ala kulli shayin qadeer;Rabbi ass-aaluka khay\u2019ra mafee haa-zaal yaw\u2019m;Wa-khayra ma ba\u2019daha;Wa- aa\u2019ozu-bika min sharri ma fee haa-zaal yaw\u2019m;Wa sharri ma ba\u2019daha;Rabbi aa\u2019ozu-bika minal-kasali, wa-soo-il kibar;Rabbi aa\u2019ozubika min aa\u2019zaa-bin fin\u2019nari wa aa\u2019zaa-bin fil\u2019qabr.",
    "translation": "We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshiped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
    "defaultTarget": 1
  },
  {
    "id": "morning_14",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m13.png",
    "transliteration": "Asbahna ala fitratil-islam;Wa\u2019ala kalimatil-ikhlas;Wa\u2019ala...",
    "full_transliteration": "Asbahna ala fitratil-islam;Wa\u2019ala kalimatil-ikhlas;Wa\u2019ala deeni nabi\u2019yyina Muhammadin sallalla-hu alai\u2019hi wasallam;Wa\u2019ala millati abeena Ibrahima hanee\u2019faan muslimah;Waama kana minal-mushrikeen.",
    "translation": "We have risen the morning upon the fitrah of al-Islam, and the word of pure faith, and upon the religion of our Prophet Muhammad and the religion of our forefather Ibrahim, who was a Muslim and of true faith and was not of those who associate others with Allah.",
    "defaultTarget": 1
  },
  {
    "id": "morning_15",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m14.png",
    "transliteration": "Allahumma bika asbahna;Wa\u2019bika amsaina;Wa\u2019bika...",
    "full_transliteration": "Allahumma bika asbahna;Wa\u2019bika amsaina;Wa\u2019bika nahya;Wa\u2019bika namooth;Wa\u2019ilay\u2019kaal nushoor.",
    "translation": "O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our return.",
    "defaultTarget": 1
  },
  {
    "id": "morning_16",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m15.png",
    "transliteration": "Allahumma inni asbahtu minka...",
    "full_transliteration": "Allahumma inni asbahtu minka fee-ni\u2019matee\u2019ou wa\u2019aa fee-yatee\u2019ou wa sitr;Fa aa\u2019timma alayya ni\u2019matak;Wa\u2019aa fee\u2019yatak;Wa sit\u2019raka fid-dunya wal akhira.",
    "translation": "O Allah, I have reached the morning with blessings, strength and concealment of my shortcomings, all of which are from You. So complete all the blessings and strength from You and the concealment for me in this life and the hereafter.",
    "defaultTarget": 3
  },
  {
    "id": "morning_17",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m16.png",
    "transliteration": "Allahumma ma asbahah bee\u2019min...",
    "full_transliteration": "Allahumma ma asbahah bee\u2019min nia\u2019mah;Aw\u2019bee a\u2019haa-deem min khal\u2019qik;Fa\u2019minka wah-dhaka la-sharee kalak;Fa-lakal hamdu wa-lakash shukr.",
    "translation": "O Allah, what blessing I or any of Your creation have risen upon, is from You alone, without partner, so for You is all praise and unto You all thanks.",
    "defaultTarget": 1
  },
  {
    "id": "morning_18",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e17.png",
    "transliteration": "Ya Rabbi lakal hamdu...",
    "full_transliteration": "Ya Rabbi lakal hamdu kama yam-baghi\u2019li jalali waj\u2019hika wa\u2019azimi sultanik.",
    "translation": "O my Lord, all praises be to You as it should be due to Your Might and the Greatness of Your Power.",
    "defaultTarget": 1
  },
  {
    "id": "morning_19",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e18.png",
    "transliteration": "Radeetu billahi Rabbah;Wa\u2019bil-islami dee\u2019nah;Wa\u2019bee...",
    "full_transliteration": "Radeetu billahi Rabbah;Wa\u2019bil-islami dee\u2019nah;Wa\u2019bee Muhammadin sal-lallahu alai\u2019hi wa\u2019sallama nabiy\u2019ya wa rasulaah.",
    "translation": "I have accepted Allah as my Lord; and Islam as my way of life; and Muhammad \ufdfa As Allah\u2019s Prophet and the Messenger.",
    "defaultTarget": 3
  },
  {
    "id": "morning_20",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e19.png",
    "transliteration": "Allahumma innee as-aalukal aaf\u2019wa...",
    "full_transliteration": "Allahumma innee as-aalukal aaf\u2019wa wal-aa\u2019fiyah;Fid-dunya wal-akhirah;Allahumma innee as\u2019alukal aa\u2019fwa wal-aa\u2019fiyah;Fee dee\u2019nee wa\u2019dunya-ya;Wa\u2019ahlee wama-lee;Allah hummas-tur aaw-ra\u2019tee;Wa aa\u2019mir raw-aa\u2019tee;Wah fiz\u2019nee min bai\u2019nee ya-dai\u2019yaa;Wa-min khal\u2019fee;Wa\u2019aai ya\u2019mee-nee;Wa\u2019aai shee\u2019malee,Wa-min faw\u2019qee;Wa\u2019aa-oozubi aa\u2019zaa-matika aan oogh-tala min tahtee.",
    "translation": "O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, veil my weaknesses and set at ease my dismay, and preserve me from the front and from behind and on my right and on my left and from above, and I take refuge with You lest I be swallowed up by the earth.",
    "defaultTarget": 1
  },
  {
    "id": "morning_21",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e20.png",
    "transliteration": "SubhanAllahi wa-bihamdih;Aa\u2019dada khal\u2019qi;Wa\u2019rida nafsih;Wa\u2019zinata...",
    "full_transliteration": "SubhanAllahi wa-bihamdih;Aa\u2019dada khal\u2019qi;Wa\u2019rida nafsih;Wa\u2019zinata aa\u2019rshih;Wa\u2019midada kalimatih.",
    "translation": "How perfect Allah is; and I praise Him by the number of His creation and His pleasure, and by the weight of His throne, and the ink of His words.",
    "defaultTarget": 3
  },
  {
    "id": "morning_22",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e21.png",
    "transliteration": "Bismillah hil\u2019lazee la yadur\u2019oo...",
    "full_transliteration": "Bismillah hil\u2019lazee la yadur\u2019oo ma\u2019aas-mihi shai-oon fil-ardi wa\u2019laa fis-samaa;Wa\u2019hu\u2019waas samee\u2019ool aa\u2019leem.",
    "translation": "In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is The All-Seeing, The All-Knowing.",
    "defaultTarget": 3
  },
  {
    "id": "morning_23",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e22.png",
    "transliteration": "Allahumma inni a\u2019oozu-bika min...",
    "full_transliteration": "Allahumma inni a\u2019oozu-bika min aan ush\u2019rika bika shai\u2019an aa\u2019lam;Wa aas\u2019tagfiruka le ma la a\u2019alam.",
    "translation": "O Allah, I take refuge in You lest I should commit shirk with You knowingly and I seek Your forgiveness for what I do unknowingly.",
    "defaultTarget": 3
  },
  {
    "id": "morning_24",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e23.png",
    "transliteration": "Aa\u2019oozu-bi kalima-tillah heet-taam\u2019mati min...",
    "full_transliteration": "Aa\u2019oozu-bi kalima-tillah heet-taam\u2019mati min sharri ma khalaq.",
    "translation": "I seek protection in the perfect words of Allah from every evil that He has created.",
    "defaultTarget": 3
  },
  {
    "id": "morning_25",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e24.png",
    "transliteration": "Allahumma aa\u2019limal-ghaybi wash-shahadah;Fati\u2019ras samawati...",
    "full_transliteration": "Allahumma aa\u2019limal-ghaybi wash-shahadah;Fati\u2019ras samawati wal\u2019ard;Rabba kulli shay\u2019in wa\u2019ma leekah;Ash\u2019hadu al\u2019laa ilaha illa anth;Aa\u2019ozu-bika min shar\u2019ri nafsee;Wa\u2019min shar\u2019rish shay\u2019tani wa-shirki;Wa\u2019an aq-tarifa ala nafsee soo\u2019an aw aa\u2019joor-rahoo ila Muslim.",
    "translation": "O Allah, knower of the unseen and the seen, creator of the heavens and the earth, Lord and sovereign of all things, I bear witness that none has the right to be worshipped except You. I take refuge in You from the evil of my soul and from the evil and shirk of the devil, and from committing wrong against my soul or bringing such upon another Muslim.",
    "defaultTarget": 1
  },
  {
    "id": "morning_26",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e25.png",
    "transliteration": "Ya hayyu ya qay\u2019yum;Bi-rah\u2019matika...",
    "full_transliteration": "Ya hayyu ya qay\u2019yum;Bi-rah\u2019matika asta\u2019gis;As\u2019lih li sha\u2019ni kullah;Wa\u2019la takil\u2019ni ila nafsi tarfata ayn.",
    "translation": "O Ever Living, O self-subsisting and supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.",
    "defaultTarget": 1
  },
  {
    "id": "morning_27",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e26.png",
    "transliteration": "Allahumma anta rab\u2019bee la...",
    "full_transliteration": "Allahumma anta rab\u2019bee la ilaha illa anta Khalaq-tanee;Wa\u2019ana aab\u2019duk;Wa\u2019ana ala aah\u2019dika wa-wa\u2019dika mas\u2019ta-taat;Aa\u2019ozu-bika min sharri ma\u2019sanath;Aa\u2019boo\u2019u laka bini\u2019matika aalai\u2019yaa;Wa\u2019aboo\u2019u bi-zan\u2019bee;Fagh\u2019fir lee;Fa-inna\u2019hu la yagh\u2019firuz zunu\u2019ba illa ant.",
    "translation": "O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil of which I have committed. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.",
    "defaultTarget": 1
  },
  {
    "id": "morning_28",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m27.png",
    "transliteration": "Allahumma innee asbah\u2019at;Osh\u2019hiduka wa-oshhidu...",
    "full_transliteration": "Allahumma innee asbah\u2019at;Osh\u2019hiduka wa-oshhidu hamalata aar\u2019shik;Wa\u2019malaa ika\u2019tak;Wa-jamee\u2019aa khalqik;Ann\u2019naka antal-lahu;La ilaha illa ant;Wah\u2019daka laa sharee kalak;Wa\u2019anna Muhammadan aabdu\u2019ka wa\u2019rasooluk.",
    "translation": "O Allah, verily I have reached the morning and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner and that Muhammad \ufdfa is Your servant and Messenger.",
    "defaultTarget": 4
  },
  {
    "id": "morning_29",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e28.png",
    "transliteration": "Allahumma aa\u2019fi-nee fee bada\u2019nee;Allahumma...",
    "full_transliteration": "Allahumma aa\u2019fi-nee fee bada\u2019nee;Allahumma aa\u2019fi-nee fee sam\u2019ee;Allahumma aa\u2019fi-nee fee basa\u2019ree;La ilaha illa-ant;Allahumma innee aa\u2019oozu-bika minal-kufri wal-faqr;Wa\u2019aa\u2019oo-zu-bika min aa\u2019zaa-bil-qabr;La ilaha illa-ant.",
    "translation": "O Allah, grant my body health, O Allah, grant my hearing health, O Allah, grant my sight health. None has the right to be worshipped except You, O Allah, I take refuge with You from disbelief and poverty, and I take refuge with You from the punishment of the grave. None has the right to be worshipped except You.",
    "defaultTarget": 3
  },
  {
    "id": "morning_30",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e29.png",
    "transliteration": "Hasbi-yallahu la ilaha illa...",
    "full_transliteration": "Hasbi-yallahu la ilaha illa huwa aa\u2019layhi tawak-kalth;Wa\u2019huwa rabbul aar\u2019shil aa\u2019zeem.",
    "translation": "Allah is sufficient for me, none has the right to be worshipped except Him, upon Him I rely and He is Lord of the exalted throne.",
    "defaultTarget": 7
  },
  {
    "id": "morning_31",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/m30.png",
    "transliteration": "Asbahna wa-asbahal mulku lillahi,...",
    "full_transliteration": "Asbahna wa-asbahal mulku lillahi, rabbil aa\u2019la-meen;Allahumma innee as-aluka khayra ha\u2019zal-yawm;Fath\u2019hahoo wa nas\u2019rahoo;Wa noo\u2019-rahoo,, wa baraka\u2019tahoo, ,wa hudah;Wa aa\u2019oozu-bika min shar-ri\u2019ma feeh;Wa shar-ri\u2019ma baa\u2019dah.",
    "translation": "We have reached the morning and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day, its triumphs and its victories, its light & its blessings and its guidance, and I take refuge in You from the evil of this day and the evil that follows it.",
    "defaultTarget": 1
  },
  {
    "id": "morning_32",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e30.png",
    "transliteration": "Laa ilaaha illallaahu wahdahu...",
    "full_transliteration": "Laa ilaaha illallaahu wahdahu laa sha\u2019ree kalah;Lahul-mulku wa lahul-hamd;Wa\u2019huwa aa\u2019laa kulli shay\u2019in qadeer.",
    "translation": "None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent.",
    "defaultTarget": 100
  },
  {
    "id": "morning_33",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e31.png",
    "transliteration": "SubhanAllahi wa bi\u2019hamdihi;SubhanAllah-hil aa\u2019zim",
    "full_transliteration": "SubhanAllahi wa bi\u2019hamdihi;SubhanAllah-hil aa\u2019zim",
    "translation": "All Glory is to Allah and all praise to Him, glorified is Allah the Great.",
    "defaultTarget": 100
  }
];

export const EVENING_ADHKAR: DhikrItem[] = [
  {
    "id": "evening_2",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Fatiha.png",
    "transliteration": "1:1 Bismillaahir rahmaa-nir raheem....",
    "full_transliteration": "1:1 Bismillaahir rahmaa-nir raheem. 1:2 Alhamdu lillaahi rabbil aa\u2019lameen.1:3 Ar-rahmaa-nir-raheem.1:4 Maaliki yawmid-deen.1:5 Iyyaaka na\u2019budu wa lyyaaka nasta\u2019een.1:6 Ihdinas siraa\u2019tal mustaqeem.1:7 Siraatal-lazeena an\u2019amta \u2018alaihim ghayril maghdoo bi\u2019alai\u2019him wa lad-daalleen.",
    "translation": "1:1 In the name of Allah, the Entirely Merciful, the Especially Merciful. 1:2 [All] praise is [due] to Allah, Lord of the worlds.1:3 The Entirely Merciful, the Especially Merciful.1:4 Sovereign of the Day of Recompense.1:5 It is You we worship and You we ask for help.1:6 Guide us to the straight path.1:7 The path of those upon whom You have bestowed favour, not of those who have evoked [Your] anger or of those who are astray.",
    "defaultTarget": 1
  },
  {
    "id": "evening_3",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Baqara-1-7.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 2:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 2:1 Alif Laam Meem.2:2 Zaalikal kitaabu-laa raiba : feeh : hudal-lil muttaqeen.2:3 Allazeena yu\u2019minoona bilghaibi wa yu\u2019qee-moonas salata wa mim\u2019maa razaqna\u2019hum yun\u2019fiqoon.2:4 Wal\u2019lazena yu\u2019minoona bimaa un\u2019zila ilaika wa-maa unzila min qablika wa bil aa\u2019khirati hum yu\u2019qinoon.2:5 Ulaa\u2019ika aa\u2019laa hudam-mir rabbihim; wa ulaa\u2019ika humul muflihoon.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:1 Alif-Lam-Mim.[These letters are one of the miracles of the Qur\u2019an and none but Allah (Alone) knows their meanings].2:2 This is the Book about which there is no doubt, a guidance for those conscious of Allah.2:3 Who believe in the unseen, establish prayer, and spend out of what We have provided for them.2:4 And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].2:5 Those are upon [right] guidance from their Lord, and it is those who are the successful.",
    "defaultTarget": 1
  },
  {
    "id": "evening_4",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/ayatul-kursi.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 255:...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 255: Allahu laa ilaaha illaa\u2019hu wal haiyul qai-yoom;Laa taa\u2019khuzuhoo sinatu\u2019oo walaa na\u2019woom;Lahoo maa fis\u2019samaawaati wa-maa fil ard;Man zal\u2019lazee yashfa\u2019oo in\u2019dahoo illa be iznih;Ya\u2019lamu maa baina ai\u2019deehim wa\u2019maa khal-fahum;Wa\u2019laa yuhee\u2019toona bee\u2019shai-im\u2019min il\u2019mihee illa be-maa shaa;Wasi\u2019aa kursi\u2019yuhus samaa-waati wal arda;Wa\u2019laa yaoo\u2019duhoo hif\u2019zuhumaa wa huwal ali\u2019yyul azeem.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:255 Allah \u2013 there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
    "defaultTarget": 1
  },
  {
    "id": "evening_5",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e4.png",
    "transliteration": "2:256 Laa ik\u2019raaha fid-deen;Qat-tabiya\u2019nar...",
    "full_transliteration": "2:256 Laa ik\u2019raaha fid-deen;Qat-tabiya\u2019nar rushdu minal ghayy;Famai \u2018yakfur bit taa\u2019ghooti wa yu\u2019mim billaahi faqadis tamsaka bil\u2019urwatil wusqaa lan-fisaama lahaa;Wallaahu samee\u2019un aleem.",
    "translation": "2:256 There shall be no compulsion in [acceptance of] the religion. The right course has become clear from the wrong. So whoever disbelieves in Taghut and believes in Allah has grasped the most trustworthy handhold with no break in it. And Allah is Hearing and Knowing.",
    "defaultTarget": 1
  },
  {
    "id": "evening_6",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e5.png",
    "transliteration": "2:257 Allaahu waliyyul lazeena...",
    "full_transliteration": "2:257 Allaahu waliyyul lazeena aa\u2019manoo yukh\u2019rijuhum minaz-zulumaati ilan noor;Wal\u2019lazee na-kafaroo awliyaa uo\u2019humut taa\u2019ghootu yukh\u2019rijoo-nahum minan noori ilaz-zulumaat;Ulaa\u2019ika as\u2019haabun naari hum fee\u2019haa khaa\u2019lidoon.",
    "translation": "2:257 Allah is the ally of those who believe. He brings them out from darknesses into the light. And those who disbelieve \u2013 their allies are Taghut. They take them out of the light into darknesses. Those are the companions of the Fire; they will abide eternally therein.",
    "defaultTarget": 1
  },
  {
    "id": "evening_7",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e6-new.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 2:284...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 2:284 Lillaahi maa fis-samaawaati wa-maa fil ard;Wa in\u2019tubdoo maa feee an\u2019fusikum aw tukh-foohu yuhaa-sibkum bihil-laa;Fayagh\u2019firuli maiya-shaa\u2019u wa yu\u2019azzibu maiya-shaa;Wallaahu aa\u2019laa kulli shai in qadeer.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 2:284 To Allah belongs whatever is in the heavens and whatever is in the earth. Whether you show what is within yourselves or conceal it, Allah will bring you to account for it. Then He will forgive whom He wills and punish whom He wills, and Allah is over all things competent.",
    "defaultTarget": 1
  },
  {
    "id": "evening_8",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e7.png",
    "transliteration": "2:285 Aa\u2019manar-rasoolu bimaa un\u2019zila...",
    "full_transliteration": "2:285 Aa\u2019manar-rasoolu bimaa un\u2019zila ilaihi mir-Rabbihee walmu\u2019minoon;Kul\u2019lun aa\u2019mana billaahi wa malaa\u2019ikathihee wa kutubhihee wa rusulihee,Laa nufar\u2019riqu baina ahadim-mir-rusulih;Wa qaaloo sami\u2019naa wa aata\u2019naa;Ghufra-naka rabbana wa ilaikal maser.",
    "translation": "2:285 The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], We make no distinction between any of His messengers. And they say, We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination.",
    "defaultTarget": 1
  },
  {
    "id": "evening_9",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e8.png",
    "transliteration": "2:286 Laa yukalliful-laahu nafsan...",
    "full_transliteration": "2:286 Laa yukalliful-laahu nafsan illaa wus\u2019ahaa;Lahaa maa kasabat wa aa\u2019laihaa mak-tasabat;Rabbana laa tu\u2019aakhiznaa in\u2019naa-seenaa aw-akhtaa\u2019naa;Rabbana wa laa tahmil-alainaa isran kamaa hamaltahoo alal-lazeena min qablinaa;Rabbana wa laa tuham-milnaa maa laa taa\u2019qata lanaa bih;Wa\u2019fu annaa waghfir lanaa war\u2019hamnaa;Anta mawlana fansur-naa alal qawmil kaafireen.",
    "translation": "2:286 Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.",
    "defaultTarget": 1
  },
  {
    "id": "evening_10",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Ikhlas.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 112:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 112:1 Qul hu\u2019wallaa-hu ahad.112:2 Allah hus-samad.112:3 Lam yalid wa-lam yoou\u2019lad.112:4 Wa lam\u2019ya kul-lahu kufu\u2019wan ahad.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 112:1 Say, He is Allah, [who is] One.112:2 Allah, the Eternal Refuge.112:3 He neither begets nor is born.112:4 Nor is there to Him any equivalent.",
    "defaultTarget": 3
  },
  {
    "id": "evening_11",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/Al-Falaq.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 113:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 113:1 Qul a\u2019uzoo-bi rabbil-falaq.113:2 Min sharri ma khalaq.113:3 Wa min sharri gha\u2019siqin iza waqab.113:4 Wa min shar\u2019rin naf\u2019faa saati\u2019fil uqad.113:5 Wa min shar\u2019ri haa\u2019sidin iza hasad.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 113.1 Say, I seek refuge in the Lord of daybreak.113.2 From the evil of that which He created.113.3 And from the evil of darkness when it settles.113.4 And from the evil of the blowers in knots.113:5 And from the evil of an envier when he envies.",
    "defaultTarget": 3
  },
  {
    "id": "evening_12",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/An-Naas.png",
    "transliteration": "Bismillaahir Rahmaanir Raheem 114:1...",
    "full_transliteration": "Bismillaahir Rahmaanir Raheem 114:1 Qul a\u2019uzu-bi rab\u2019binn naas.114:2 Malik\u2019inn naas.114:3 Ilaa hin\u2019naas.114:5 Min shar\u2019ril waas-wa-asil khan\u2019naas.114:6 Al lazee yu\u2019was wi\u2019su fee sudoo-rin naas.114:7 Minal jin\u2019nati wan naas.",
    "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful 114.1 Say, I seek refuge in the Lord of mankind.114.2 He Sovereign of mankind.114.3 The God of mankind.114.4 From the evil of the retreating whisperer.114.5 Who whispers [evil] into the breasts of mankind.114.6 From among the jinn and mankind.",
    "defaultTarget": 3
  },
  {
    "id": "evening_13",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e12.png",
    "transliteration": "Amsaina wa-amsal mulku lillah;Wal-hamdu...",
    "full_transliteration": "Amsaina wa-amsal mulku lillah;Wal-hamdu lillah;La ilaha illal-lah;Wah-da\u2019hoo la-sharee kalah;Lahul-mulku wa\u2019lahul-hamd;Yuh-ee wa yu\u2019meeto wa\u2019huwa ala kulli shayin qadeer;Rabbi ass-aaluka khay\u2019ra mafee haa-zee\u2019hil lai\u2019lah;Wa-khayra ma ba\u2019daha;Wa- aa\u2019ozu-bika min sharri ma fee haa-zee\u2019hil lai\u2019lah;Wa sharri ma ba\u2019daha;Rabbi aa\u2019ozu-bika minal-kasali, wa-soo-il kibar;Rabbi aa\u2019ozubika min aa\u2019zaa-bin fin\u2019nari wa aa\u2019zaa-bin fil\u2019qabr.",
    "translation": "We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
    "defaultTarget": 1
  },
  {
    "id": "evening_14",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e13.png",
    "transliteration": "Aamsaina ala fitratil-islam;Wa\u2019ala kalimatil-ikhlas;Wa\u2019ala...",
    "full_transliteration": "Aamsaina ala fitratil-islam;Wa\u2019ala kalimatil-ikhlas;Wa\u2019ala deeni nabi\u2019yyina Muhammadin sallalla-hu alai\u2019hi wasallam;Wa\u2019ala millati abeena Ibrahima hanee\u2019faan muslimah;Waama kana minal-mushrikeen.",
    "translation": "We have reached the evening upon the fitrah of Al-Islam, and the word of pure faith, and upon the religion of our Prophet Muhammad and the religion of our forefather Ibrahim, who was a Muslim and of true faith and was not of those who associate others with Allah.",
    "defaultTarget": 1
  },
  {
    "id": "evening_15",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e14.png",
    "transliteration": "Allahumma bika amsaina;Wa\u2019bika asbahna;Wa\u2019bika...",
    "full_transliteration": "Allahumma bika amsaina;Wa\u2019bika asbahna;Wa\u2019bika nahya;Wa\u2019bika namooth;Wa\u2019ilay\u2019kaal maser.",
    "translation": "O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.",
    "defaultTarget": 1
  },
  {
    "id": "evening_16",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e15.png",
    "transliteration": "Allahumma inni aam\u2019saitu minka...",
    "full_transliteration": "Allahumma inni aam\u2019saitu minka fee-ni\u2019matee\u2019ou wa\u2019aa fee-yatee\u2019ou wa sitr;Fa aa\u2019timma alayya ni\u2019matak;Wa\u2019aa fee\u2019yatak;Wa sit\u2019raka fid-dunya wal akhira",
    "translation": "O Allah, I have reached the evening with blessings, strength and concealment of my shortcomings, all of which are from You. So complete all the blessings and strength from You and the concealment for me in this life and the hereafter.",
    "defaultTarget": 3
  },
  {
    "id": "evening_17",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e16.png",
    "transliteration": "Allahumma ma aamsa bee\u2019min...",
    "full_transliteration": "Allahumma ma aamsa bee\u2019min nia\u2019mah;Aw\u2019bee a\u2019haa-deem min khal\u2019qik;Fa\u2019minka wah-dhaka la-sharee kalak;Fa-lakal hamdu wa-lakash shukr.",
    "translation": "O Allah, what blessing I or any of Your creation have risen upon, is from You alone, without partner, so for You is all praise and unto You all thanks.",
    "defaultTarget": 1
  },
  {
    "id": "evening_18",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e17.png",
    "transliteration": "Ya Rabbi lakal hamdu...",
    "full_transliteration": "Ya Rabbi lakal hamdu kama yam-baghi\u2019li jalali waj\u2019hika wa\u2019azimi sultanik.",
    "translation": "O my Lord, all praises be to You as it should be due to Your Might and the Greatness of Your Power.",
    "defaultTarget": 1
  },
  {
    "id": "evening_19",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e18.png",
    "transliteration": "Radeetu billahi Rabbah;Wa\u2019bil-islami dee\u2019nah;Wa\u2019bee...",
    "full_transliteration": "Radeetu billahi Rabbah;Wa\u2019bil-islami dee\u2019nah;Wa\u2019bee Muhammadin sal-lallahu alai\u2019hi wa\u2019sallama nabiy\u2019ya wa rasulaah.",
    "translation": "I have accepted Allah as my Lord; and Islam as my way of life; and Muhammad \ufdfa As Allah\u2019s Prophet and the Messenger.",
    "defaultTarget": 3
  },
  {
    "id": "evening_20",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e19.png",
    "transliteration": "Allahumma innee as-aalukal aaf\u2019wa...",
    "full_transliteration": "Allahumma innee as-aalukal aaf\u2019wa wal-aa\u2019fiyah;Fid-dunya wal-akhirah;Allahumma innee as\u2019alukal aa\u2019fwa wal-aa\u2019fiyah;Fee dee\u2019nee wa\u2019dunya-ya;Wa\u2019ahlee wama-lee;Allah hummas-tur aaw-ra\u2019tee;Wa aa\u2019mir raw-aa\u2019tee;Wah fiz\u2019nee min bai\u2019nee ya-dai\u2019yaa;Wa-min khal\u2019fee;Wa\u2019aai ya\u2019mee-nee;Wa\u2019aai shee\u2019malee,Wa-min faw\u2019qee;Wa\u2019aa-oozubi aa\u2019zaa-matika aan oogh-tala min tahtee.",
    "translation": "O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, veil my weaknesses and set at ease my dismay, and preserve me from the front and from behind and on my right and on my left and from above, and I take refuge with You lest I be swallowed up by the earth.",
    "defaultTarget": 1
  },
  {
    "id": "evening_21",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e20.png",
    "transliteration": "SubhanAllahi wa-bihamdih;Aa\u2019dada khal\u2019qi;Wa\u2019rida nafsih;Wa\u2019zinata...",
    "full_transliteration": "SubhanAllahi wa-bihamdih;Aa\u2019dada khal\u2019qi;Wa\u2019rida nafsih;Wa\u2019zinata aa\u2019rshih;Wa\u2019midada kalimatih.",
    "translation": "How perfect Allah is; and I praise Him by the number of His creation and His pleasure, and by the weight of His throne, and the ink of His words.",
    "defaultTarget": 3
  },
  {
    "id": "evening_22",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e21.png",
    "transliteration": "Bismillah hil\u2019lazee la yadur\u2019oo...",
    "full_transliteration": "Bismillah hil\u2019lazee la yadur\u2019oo ma\u2019aas-mihi shai-oon fil-ardi wa\u2019laa fis-samaa;Wa\u2019hu\u2019waas samee\u2019ool aa\u2019leem.",
    "translation": "In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is The All-Seeing, The All-Knowing.",
    "defaultTarget": 3
  },
  {
    "id": "evening_23",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e22.png",
    "transliteration": "Allahumma inni a\u2019oozu-bika min...",
    "full_transliteration": "Allahumma inni a\u2019oozu-bika min aan ush\u2019rika bika shai\u2019an aa\u2019lam;Wa aas\u2019tagfiruka le ma la a\u2019alam.",
    "translation": "O Allah, I take refuge in You lest I should commit shirk with You knowingly and I seek Your forgiveness for what I do unknowingly.",
    "defaultTarget": 3
  },
  {
    "id": "evening_24",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e23.png",
    "transliteration": "Aa\u2019oozu-bi kalima-tillah heet-taam\u2019mati min...",
    "full_transliteration": "Aa\u2019oozu-bi kalima-tillah heet-taam\u2019mati min sharri ma khalaq.",
    "translation": "I seek protection in the perfect words of Allah from every evil that He has created.",
    "defaultTarget": 3
  },
  {
    "id": "evening_25",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e24.png",
    "transliteration": "Allahumma aa\u2019limal-ghaybi wash-shahadah;Fati\u2019ras samawati...",
    "full_transliteration": "Allahumma aa\u2019limal-ghaybi wash-shahadah;Fati\u2019ras samawati wal\u2019ard;Rabba kulli shay\u2019in wa\u2019ma leekah;Ash\u2019hadu al\u2019laa ilaha illa anth;Aa\u2019ozu-bika min shar\u2019ri nafsee;Wa\u2019min shar\u2019rish shay\u2019tani wa-shirki;Wa\u2019an aq-tarifa ala nafsee soo\u2019an aw aa\u2019joor-rahoo ila Muslim.",
    "translation": "O Allah, knower of the unseen and the seen, creator of the heavens and the earth, Lord and sovereign of all things, I bear witness that none has the right to be worshipped except You. I take refuge in You from the evil of my soul and from the evil and shirk of the devil, and from committing wrong against my soul or bringing such upon another Muslim.",
    "defaultTarget": 1
  },
  {
    "id": "evening_26",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e25.png",
    "transliteration": "Ya hayyu ya qay\u2019yum;Bi-rah\u2019matika...",
    "full_transliteration": "Ya hayyu ya qay\u2019yum;Bi-rah\u2019matika asta\u2019gis;As\u2019lih li sha\u2019ni kullah;Wa\u2019la takil\u2019ni ila nafsi tarfata ayn.",
    "translation": "O Ever Living, O self-subsisting and supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.",
    "defaultTarget": 1
  },
  {
    "id": "evening_27",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e26.png",
    "transliteration": "Allahumma anta rab\u2019bee la...",
    "full_transliteration": "Allahumma anta rab\u2019bee la ilaha illa anta Khalaq-tanee;Wa\u2019ana aab\u2019duk;Wa\u2019ana ala aah\u2019dika wa-wa\u2019dika mas\u2019ta-taat;Aa\u2019ozu-bika min sharri ma\u2019sanath;Aa\u2019boo\u2019u laka bini\u2019matika aalai\u2019yaa;Wa\u2019aboo\u2019u bi-zan\u2019bee;Fagh\u2019fir lee;Fa-inna\u2019hu la yagh\u2019firuz zunu\u2019ba illa ant.",
    "translation": "O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil of which I have committed. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.",
    "defaultTarget": 1
  },
  {
    "id": "evening_28",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e27.png",
    "transliteration": "Allahumma innee aam\u2019sait;Osh\u2019hiduka wa-oshhidu...",
    "full_transliteration": "Allahumma innee aam\u2019sait;Osh\u2019hiduka wa-oshhidu hamalata aar\u2019shik;Wa\u2019malaa ika\u2019tak;Wa-jamee\u2019aa khalqik;Ann\u2019naka antal-lahu;La ilaha illa ant;Wah\u2019daka laa sharee kalak;Wa\u2019anna Muhammadan aabdu\u2019ka wa\u2019rasooluk.",
    "translation": "O Allah, verily I have reached the evening and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshiped except You, alone, without partner and that Muhammad \ufdfa is Your servant and Messenger.",
    "defaultTarget": 4
  },
  {
    "id": "evening_29",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e28.png",
    "transliteration": "Allahumma aa\u2019fi-nee fee bada\u2019nee;Allahumma...",
    "full_transliteration": "Allahumma aa\u2019fi-nee fee bada\u2019nee;Allahumma aa\u2019fi-nee fee sam\u2019ee;Allahumma aa\u2019fi-nee fee basa\u2019ree;La ilaha illa-ant;Allahumma innee aa\u2019oozu-bika minal-kufri wal-faqr;Wa\u2019aa\u2019oo-zu-bika min aa\u2019zaa-bil-qabr;La ilaha illa-ant.",
    "translation": "O Allah, grant my body health, O Allah, grant my hearing health, O Allah, grant my sight health. None has the right to be worshipped except You, O Allah, I take refuge with You from disbelief and poverty, and I take refuge with You from the punishment of the grave. None has the right to be worshipped except You.",
    "defaultTarget": 3
  },
  {
    "id": "evening_30",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e29.png",
    "transliteration": "Hasbi-yallahu la ilaha illa...",
    "full_transliteration": "Hasbi-yallahu la ilaha illa huwa aa\u2019layhi tawak-kalth;Wa\u2019huwa rabbul aar\u2019shil aa\u2019zeem.",
    "translation": "Allah is sufficient for me, none has the right to be worshipped except Him, upon Him I rely and He is Lord of the exalted throne.",
    "defaultTarget": 7
  },
  {
    "id": "evening_31",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e30.png",
    "transliteration": "Laa ilaaha illallaahu wahdahu...",
    "full_transliteration": "Laa ilaaha illallaahu wahdahu laa sha\u2019ree kalah;Lahul-mulku wa lahul-hamd;Wa\u2019huwa aa\u2019laa kulli shay\u2019in qadeer.",
    "translation": "None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent.",
    "defaultTarget": 100
  },
  {
    "id": "evening_32",
    "arabic": "",
    "arabicImg": "https://www.duaandazkar.com/wp-content/uploads/e31.png",
    "transliteration": "SubhanAllahi wa bi\u2019hamdihi;SubhanAllah-hil aa\u2019zim",
    "full_transliteration": "SubhanAllahi wa bi\u2019hamdihi;SubhanAllah-hil aa\u2019zim",
    "translation": "All Glory is to Allah and all praise to Him, glorified is Allah the Great.",
    "defaultTarget": 100
  }
];
