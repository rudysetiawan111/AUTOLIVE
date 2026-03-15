/**
 * AI Short Video Generator
 * Menghasilkan ide dan skrip untuk video pendek (YouTube Shorts, TikTok, Reels)
 * Dengan 50+ kategori konten untuk berbagai niche
 */

class ShortGenerator {
    constructor() {
        this.modelVersion = '2.0.0';
        
        // ========================================
        // TEMPLATE KATEGORI (56 Kategori Lengkap)
        // ========================================
        
        this.templates = {
            // ========================================
            // KATEGORI TUTORIAL & EDUKASI (12)
            // ========================================
            
            tutorial: {
                name: 'Tutorial & How-To',
                description: 'Video panduan langkah demi langkah',
                icon: '📚',
                structure: [
                    "Hook: [HOOK] dalam [TIME] detik",
                    "Problem: [PROBLEM] yang sering terjadi",
                    "Solution: Cara [SOLUTION] dengan cepat",
                    "Tip: [TIP] yang jarang diketahui",
                    "CTA: [CTA] untuk konten selanjutnya"
                ],
                duration: '15-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Cara membuat kue dalam 5 menit', 'Tutorial makeup natural', 'Cara belajar coding cepat']
            },
            
            educational: {
                name: 'Edukasi & Fakta',
                description: 'Video berbagi pengetahuan dan fakta menarik',
                icon: '🎓',
                structure: [
                    "Question: [PERTANYAAN] menarik",
                    "Fact: [FAKTA] mengejutkan",
                    "Explanation: Penjelasan [TOPIK] dalam [TIME] detik",
                    "Summary: [KESIMPULAN] penting",
                    "Challenge: [TANTANGAN] untuk viewer"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Fakta unik tentang luar angkasa', 'Sejarah singkat internet', 'Cara kerja AI']
            },
            
            tipsAndTricks: {
                name: 'Tips & Trik',
                description: 'Video berbagi tips dan trik bermanfaat',
                icon: '💡',
                structure: [
                    "Hook: [HOOK] tentang masalah umum",
                    "Tip 1: [TIP] pertama dalam [TIME]",
                    "Tip 2: [TIP] kedua yang efektif",
                    "Tip 3: [TIP] ketiga yang jarang diketahui",
                    "Result: [HASIL] setelah menerapkan tips"
                ],
                duration: '15-45 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['5 tips produktivitas', 'Rahasia public speaking', 'Tips menghemat uang']
            },
            
            lifeHacks: {
                name: 'Life Hacks',
                description: 'Video trik sederhana untuk memudahkan hidup',
                icon: '🔧',
                structure: [
                    "Situation: [SITUASI] yang merepotkan",
                    "Hack 1: [HACK] pertama",
                    "Hack 2: [HACK] kedua",
                    "Hack 3: [HACK] ketiga",
                    "Result: [HASIL] yang mengejutkan"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Memasak tanpa panci', 'Membersihkan rumah dengan cepat', 'Hacks dengan barang bekas']
            },
            
            studyTips: {
                name: 'Tips Belajar',
                description: 'Video tentang cara belajar efektif',
                icon: '📝',
                structure: [
                    "Problem: [MASALAH] saat belajar",
                    "Method: Metode [METODE] belajar",
                    "Practice: Praktek [CARA] belajar",
                    "Result: [HASIL] yang dicapai",
                    "Bonus: [BONUS] tips tambahan"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Metode pomodoro untuk belajar', 'Cara menghafal cepat', 'Tips konsentrasi belajar']
            },
            
            languageLearning: {
                name: 'Belajar Bahasa',
                description: 'Video pembelajaran bahasa asing',
                icon: '🗣️',
                structure: [
                    "Intro: Kata [KATA] hari ini",
                    "Meaning: Arti [KATA] dalam [BAHASA]",
                    "Usage: Contoh penggunaan [KALIMAT]",
                    "Pronunciation: Cara pengucapan [KATA]",
                    "Practice: Ayo [PRAKTEK] bersama"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Bahasa Inggris sehari-hari', 'Korea untuk pemula', 'Slang bahasa Jepang']
            },
            
            mathTricks: {
                name: 'Trik Matematika',
                description: 'Video trik cepat berhitung',
                icon: '🧮',
                structure: [
                    "Problem: Soal [SOAL] matematika",
                    "Trick: Trik [CARA] cepat",
                    "Step 1: Langkah [PERTAMA]",
                    "Step 2: Langkah [KEDUA]",
                    "Result: [JAWABAN] dalam hitungan detik"
                ],
                duration: '15-30 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Perkalian cepat', 'Trik menghitung persen', 'Akar kuadrat instan']
            },
            
            scienceExperiments: {
                name: 'Eksperimen Sains',
                description: 'Video eksperimen sains sederhana',
                icon: '🔬',
                structure: [
                    "Intro: Eksperimen [NAMA] hari ini",
                    "Materials: Bahan-bahan [BAHAN]",
                    "Step: Langkah [CARA] membuat",
                    "Result: Hasil [HASIL] eksperimen",
                    "Explanation: Penjelasan [SAINS] dibaliknya"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Membuat lava lamp', 'Telur melayang', 'Pelangi buatan sendiri']
            },
            
            diyProjects: {
                name: 'DIY Projects',
                description: 'Video proyek kerajinan tangan',
                icon: '🛠️',
                structure: [
                    "Intro: Proyek [PROYEK] DIY",
                    "Materials: Bahan [BAHAN] yang diperlukan",
                    "Step 1: Langkah [PERTAMA]",
                    "Step 2: Langkah [KEDUA]",
                    "Result: Hasil [AKHIR] yang keren"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Membuat rak buku dari kardus', 'Dekorasi kamar DIY', 'Hadiah handmade unik']
            },
            
            cookingBasics: {
                name: 'Dasar Memasak',
                description: 'Video teknik dasar memasak',
                icon: '🍳',
                structure: [
                    "Intro: Teknik [TEKNIK] memasak",
                    "Ingredient: Bahan [BAHAN] yang diperlukan",
                    "Step 1: Cara [PERTAMA]",
                    "Step 2: Cara [KEDUA]",
                    "Result: Hidangan [HASIL] siap disajikan"
                ],
                duration: '30-60 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Cara memotong bawang', 'Teknik menumis yang benar', 'Dasar membuat saus']
            },
            
            quickRecipes: {
                name: 'Resep Cepat',
                description: 'Video resep masakan cepat',
                icon: '⏱️',
                structure: [
                    "Hook: Masakan [NAMA] dalam [WAKTU] menit",
                    "Ingredients: Bahan [BAHAN] sederhana",
                    "Step 1: Langkah [PERTAMA]",
                    "Step 2: Langkah [KEDUA]",
                    "Serving: [PENYAJIAN] dan siap dimakan"
                ],
                duration: '15-45 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Resep mie instan kekinian', 'Sarapan 5 menit', 'Camilan simple']
            },
            
            bakingTutorial: {
                name: 'Tutorial Baking',
                description: 'Video panduan membuat kue dan roti',
                icon: '🥐',
                structure: [
                    "Intro: Kue [NAMA] yang lembut",
                    "Ingredients: Takaran [BAHAN] tepat",
                    "Mixing: Cara [MENCAMPUR] adonan",
                    "Baking: Suhu [PANAS] dan waktu",
                    "Result: Kue [HASIL] matang sempurna"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'Instagram Reels'],
                examples: ['Brownies lembut', 'Roti sobek empuk', 'Cookies crunchy']
            },

            // ========================================
            // KATEGORI HIBURAN & KOMEDI (10)
            // ========================================
            
            comedy: {
                name: 'Komedi & Sketsa',
                description: 'Video lucu dan menghibur',
                icon: '😂',
                structure: [
                    "Setup: [SITUASI] yang relatable",
                    "Punchline: [TWIST] yang tidak terduga",
                    "Reaction: [REAKSI] lucu",
                    "Tag: [TAG] untuk engage audience"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Kesalahan pas kencan', 'Momen canggung di kantor', 'Dialog lucu keluarga']
            },
            
            parody: {
                name: 'Parodi',
                description: 'Video parodi dari konten viral atau selebriti',
                icon: '🎭',
                structure: [
                    "Intro: Meniru [KARAKTER]",
                    "Scene 1: [ADEGAN] pertama",
                    "Scene 2: [ADEGAN] kedua",
                    "Punchline: [LELUCOD] yang kocak",
                    "Outro: Kembali ke [DIRI] sendiri"
                ],
                duration: '30-60 detik',
                bestFor: ['TikTok', 'YouTube Shorts'],
                examples: ['Parodi artis terkenal', 'Spoof film viral', 'Parodi iklan TV']
            },
            
            sketchComedy: {
                name: 'Sketsa Komedi',
                description: 'Video sketsa komedi dengan karakter',
                icon: '🎬',
                structure: [
                    "Intro: Memperkenalkan [KARAKTER]",
                    "Scene 1: [SITUASI] kocak",
                    "Scene 2: [KONFLIK] lucu",
                    "Scene 3: [RESOLUSI] tidak terduga",
                    "Outro: [PESAN] moral lucu"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Sketsa kehidupan kos', 'Komedi situasi kantor', 'Drama keluarga lucu']
            },
            
            standUp: {
                name: 'Stand Up Comedy',
                description: 'Video stand up comedy mini',
                icon: '🎤',
                structure: [
                    "Intro: [TOPIC] yang mau dibahas",
                    "Setup: [SITUASI] yang dialami",
                    "Punchline 1: [LELUCON] pertama",
                    "Punchline 2: [LELUCON] kedua",
                    "Closing: [PENUTUP] lucu"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Komedi tentang pacar', 'Observasi lucu sehari-hari', 'Cerita kocak liburan']
            },
            
            fails: {
                name: 'Funny Fails',
                description: 'Video kompilasi momen gagal lucu',
                icon: '🤦',
                structure: [
                    "Intro: Momen [MOMEN] gagal",
                    "Fail 1: [KEGAGALAN] pertama",
                    "Fail 2: [KEGAGALAN] kedua",
                    "Fail 3: [KEGAGALAN] ketiga",
                    "Outro: Jangan ditiru ya!"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Gagal olahraga', 'Momen kocak hewan peliharaan', 'Kesalahan saat masak']
            },
            
            prank: {
                name: 'Prank',
                description: 'Video prank lucu dan kreatif',
                icon: '🎭',
                structure: [
                    "Setup: Persiapan [PRANK]",
                    "Target: [KORBAN] yang akan diprank",
                    "Execution: [AKSI] prank",
                    "Reaction: [REAKSI] korban",
                    "Reveal: Ngaku [PRANK]"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube', 'TikTok'],
                examples: ['Prank teman kantor', 'Prank keluarga', 'Prank horror ringan']
            },
            
            roasts: {
                name: 'Roasts Komedi',
                description: 'Video roasting lucu tapi bersahabat',
                icon: '🔥',
                structure: [
                    "Intro: Target [ORANG] di-roast",
                    "Roast 1: [ROAST] pertama",
                    "Roast 2: [ROAST] kedua",
                    "Roast 3: [ROAST] ketiga",
                    "Peace: Semua [BAIK] baik saja"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Roast teman dekat', 'Roast diri sendiri', 'Roast artis dengan sportif']
            },
            
            satire: {
                name: 'Satir Sosial',
                description: 'Video sindiran lucu tentang fenomena sosial',
                icon: '🎪',
                structure: [
                    "Phenomenon: Fenomena [SOSIAL]",
                    "Observation: Pengamatan [LUCU]",
                    "Critique: Sindiran [HALUS]",
                    "Humor: [LELUCON] yang cerdas",
                    "Message: [PESAN] tersirat"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Satir tentang media sosial', 'Komedi kehidupan modern', 'Sindiran budaya pop']
            },
            
            improv: {
                name: 'Improvisasi',
                description: 'Video komedi improvisasi tanpa skrip',
                icon: '🎲',
                structure: [
                    "Prompt: Tantangan [TOPIK]",
                    "Scene 1: Improv [ADEgan] pertama",
                    "Scene 2: Improv [ADEgan] kedua",
                    "Reaction: [REAKSI] penonton",
                    "Wrap up: [KESIMPULAN] lucu"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Improv dengan kata random', 'Sketsa dadakan', 'Challenge improvisasi']
            },
            
            memeReview: {
                name: 'Review Meme',
                description: 'Video review dan reaksi terhadap meme terbaru',
                icon: '🖼️',
                structure: [
                    "Intro: Meme [NAMA] lagi viral",
                    "Explanation: Arti [MEME]",
                    "Reaction: [REAKSI] lucu",
                    "Rating: Skor [ANGKA]/10",
                    "Outro: Meme selanjutnya"
                ],
                duration: '30-60 detik',
                bestFor: ['TikTok', 'YouTube Shorts', 'Instagram Reels'],
                examples: ['Meme terbaru minggu ini', 'Sejarah meme terkenal', 'Reaksi meme kocak']
            },

            // ========================================
            // KATEGORI CHALLENGE & TREN (8)
            // ========================================
            
            challenge: {
                name: 'Challenge',
                description: 'Video mengikuti tantangan viral',
                icon: '🏆',
                structure: [
                    "Intro: Memperkenalkan [CHALLENGE]",
                    "Rules: [ATURAN] challenge",
                    "Attempt: Mencoba [AKSI]",
                    "Result: [HASIL] lucu/mengejutkan",
                    "Nominate: Menantang [ORANG] lain"
                ],
                duration: '30-60 detik',
                bestFor: ['TikTok', 'Instagram Reels'],
                examples: ['Ice bucket challenge', 'Dance challenge', 'Eat challenge']
            },
            
            danceChallenge: {
                name: 'Dance Challenge',
                description: 'Video mengikuti tren dance',
                icon: '💃',
                structure: [
                    "Intro: Tren dance [NAMA]",
                    "Tutorial: Gerakan [DANCE] step by step",
                    "Practice: Latihan [GERAKAN]",
                    "Performance: Tampil [DANCE] full",
                    "Challenge: Ayo [TIRU] dan tag aku"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels'],
                examples: ['Tren dance terbaru', 'Tutorial dance mudah', 'Duet dance challenge']
            },
            
            viralTrend: {
                name: 'Viral Trend',
                description: 'Video mengikuti tren viral terkini',
                icon: '📈',
                structure: [
                    "Intro: Tren [TREN] lagi viral",
                    "Concept: Konsep [VIDEO] yang hits",
                    "Creation: Membuat [KONTEN] versiku",
                    "Result: Hasil [VIDEO] ala aku",
                    "CTA: Coba [BUAT] juga!"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Tren filter terbaru', 'Challenge audio viral', 'Format video hits']
            },
            
            fitnessChallenge: {
                name: 'Fitness Challenge',
                description: 'Video tantangan olahraga dan kebugaran',
                icon: '💪',
                structure: [
                    "Intro: Challenge [NAMA] hari ini",
                    "Exercise 1: Gerakan [PERTAMA]",
                    "Exercise 2: Gerakan [KEDUA]",
                    "Exercise 3: Gerakan [KETIGA]",
                    "Result: [HASIL] setelah challenge"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['30 day plank challenge', 'Push up challenge', 'Squat challenge']
            },
            
            eatingChallenge: {
                name: 'Eating Challenge',
                description: 'Video tantangan makan',
                icon: '🍔',
                structure: [
                    "Intro: Makanan [MAKANAN] challenge",
                    "Rules: [ATURAN] dalam waktu [WAKTU]",
                    "Start: Mulai [MAKAN]",
                    "Progress: Perjuangan [MAKAN]",
                    "Result: Berhasil/gagal [HASIL]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube', 'TikTok'],
                examples: ['Makan pedas challenge', 'Makan banyak challenge', 'Makan cepat challenge']
            },
            
            gamingChallenge: {
                name: 'Gaming Challenge',
                description: 'Video tantangan dalam game',
                icon: '🎮',
                structure: [
                    "Intro: Game [GAME] challenge",
                    "Rule: [ATURAN] tantangan",
                    "Attempt 1: Percobaan [PERTAMA]",
                    "Attempt 2: Percobaan [KEDUA]",
                    "Result: [HASIL] akhir"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['No scope challenge', 'Speedrun challenge', 'Hard mode challenge']
            },
            
            artChallenge: {
                name: 'Art Challenge',
                description: 'Video tantangan menggambar/melukis',
                icon: '🎨',
                structure: [
                    "Intro: Challenge [NAMA] art",
                    "Theme: Tema [GAMBAR]",
                    "Process: Proses [MEMBUAT]",
                    "Time: [WAKTU] terbatas",
                    "Result: Karya [SENI] jadi"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Drawing with eyes closed', 'One line drawing', 'Speed painting']
            },
            
            photoChallenge: {
                name: 'Photo Challenge',
                description: 'Video tantangan fotografi',
                icon: '📸',
                structure: [
                    "Intro: Foto [TEMA] challenge",
                    "Setup: Alat [KAMERA] sederhana",
                    "Shoot: Proses [MEMOTRET]",
                    "Edit: Editing [FOTO]",
                    "Result: Hasil [FOTO] keren"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Foto produk challenge', 'Selfie challenge', 'Golden hour challenge']
            },

            // ========================================
            // KATEGORI OLAHRAGA & KEBUGARAN (8)
            // ========================================
            
            sport: {
                name: 'Olahraga',
                description: 'Video tentang berbagai olahraga',
                icon: '⚽',
                structure: [
                    "Intro: Olahraga [OLAHRAGA] hari ini",
                    "Technique: Teknik [GERAKAN]",
                    "Practice: Latihan [CARA]",
                    "Match: Pertandingan [SERU]",
                    "Tip: Tips [OLAHRAGA]"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Tips sepak bola', 'Teknik basket dasar', 'Cara servis tenis']
            },
            
            football: {
                name: 'Sepak Bola',
                description: 'Video khusus sepak bola',
                icon: '⚽',
                structure: [
                    "Intro: Skill [SKILL] hari ini",
                    "Tutorial: Cara [MELAKUKAN]",
                    "Practice: Latihan [GERAKAN]",
                    "Match: Momen [PERTANDINGAN]",
                    "Pro tip: Tips dari [PEMAIN]"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Trik dribble Messi', 'Teknik shooting CR7', 'Latihan passing akurat']
            },
            
            basketball: {
                name: 'Basket',
                description: 'Video khusus bola basket',
                icon: '🏀',
                structure: [
                    "Intro: Gerakan [GERAKAN] basket",
                    "Technique: Cara [MELAKUKAN]",
                    "Drill: Latihan [DRILL]",
                    "Game: Aksi [PEMAIN]",
                    "Tip: Tips [BASKET]"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Teknik dribble NBA', 'Cara shooting akurat', 'Latihan defense']
            },
            
            workout: {
                name: 'Workout',
                description: 'Video latihan kebugaran',
                icon: '🏋️',
                structure: [
                    "Intro: Workout [NAMA] hari ini",
                    "Warm up: Pemanasan [GERAKAN]",
                    "Main: Latihan [INTI]",
                    "Cool down: Pendinginan [GERAKAN]",
                    "Result: Manfaat [LATIHAN]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Full body workout', 'Abs workout 10 menit', 'Leg day workout']
            },
            
            yoga: {
                name: 'Yoga',
                description: 'Video latihan yoga',
                icon: '🧘',
                structure: [
                    "Intro: Pose [YOGA] hari ini",
                    "Breathing: Teknik [NAPAS]",
                    "Pose 1: [POSE] pertama",
                    "Pose 2: [POSE] kedua",
                    "Benefits: Manfaat [YOGA]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'Instagram Reels'],
                examples: ['Yoga untuk pemula', 'Morning yoga flow', 'Yoga untuk relaksasi']
            },
            
            meditation: {
                name: 'Meditasi',
                description: 'Video panduan meditasi',
                icon: '🧠',
                structure: [
                    "Intro: Meditasi [TUJUAN]",
                    "Position: Posisi [DUDUK]",
                    "Breath: Tarik [NAPAS]...",
                    "Focus: Fokus pada [SESUATU]",
                    "Closing: Kembali [SADAR]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'Instagram Reels'],
                examples: ['Meditasi 5 menit', 'Meditasi untuk tidur', 'Meditasi pengurang stres']
            },
            
            running: {
                name: 'Lari',
                description: 'Video tentang lari',
                icon: '🏃',
                structure: [
                    "Intro: Tips lari [TIPS]",
                    "Technique: Teknik [LARI] benar",
                    "Pacing: Atur [KECEPATAN]",
                    "Breathing: Cara [NAPAS]",
                    "Route: Rute [LARI] seru"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Cara lari jarak jauh', 'Tips napas saat lari', 'Pemanasan sebelum lari']
            },
            
            martialArts: {
                name: 'Bela Diri',
                description: 'Video teknik bela diri',
                icon: '🥋',
                structure: [
                    "Intro: Teknik [BELADIRI]",
                    "Stance: Kuda-kuda [POSISI]",
                    "Strike: Pukulan [TEKNIK]",
                    "Block: Tangkisan [GERAKAN]",
                    "Practice: Latihan [CARA]"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Teknik dasar karate', 'Jurus silat pemula', 'Boxing untuk pemula']
            },

            // ========================================
            // KATEGORI GAMING (6)
            // ========================================
            
            gaming: {
                name: 'Gaming',
                description: 'Video konten game',
                icon: '🎮',
                structure: [
                    "Intro: Game [GAME] hari ini",
                    "Gameplay: Momen [SERU]",
                    "Strategy: Strategi [MENANG]",
                    "Highlight: [MOMEN] terbaik",
                    "Outro: Next [GAME]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Gameplay Mobile Legends', 'Tips and tricks PUBG', 'Review game terbaru']
            },
            
            gamingMoments: {
                name: 'Gaming Moments',
                description: 'Video momen-momen epik dalam game',
                icon: '🎯',
                structure: [
                    "Intro: Momen [MOMEN] di game",
                    "Clip 1: [KLIP] pertama",
                    "Clip 2: [KLIP] kedua",
                    "Clip 3: [KLIP] ketiga",
                    "Reaction: [REAKSI] gamer"
                ],
                duration: '15-30 detik',
                bestFor: ['TikTok', 'YouTube Shorts'],
                examples: ['Headshot compilation', 'Epic win moments', 'Funny gaming fails']
            },
            
            gameReview: {
                name: 'Game Review',
                description: 'Video review game singkat',
                icon: '⭐',
                structure: [
                    "Intro: Game [GAME] review",
                    "Graphics: Grafis [NILAI]/10",
                    "Gameplay: [SERU]/10",
                    "Story: Cerita [NILAI]/10",
                    "Verdict: Worth it? [YA/TIDAK]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Review game mobile', 'Review game PC', 'Review game konsol']
            },
            
            gamingTips: {
                name: 'Gaming Tips',
                description: 'Video tips dan trik bermain game',
                icon: '📊',
                structure: [
                    "Intro: Tips [GAME]",
                    "Tip 1: [TIPS] pertama",
                    "Tip 2: [TIPS] kedua",
                    "Tip 3: [TIPS] ketiga",
                    "Result: [HASIL] setelah tips"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Tips ranked ML', 'Cara jadi pro PUBG', 'Rahasia game tersembunyi']
            },
            
            esports: {
                name: 'Esports',
                description: 'Video tentang dunia esports',
                icon: '🏆',
                structure: [
                    "Intro: Turnamen [NAMA]",
                    "Teams: Tim [TIM] bertanding",
                    "Highlights: Momen [SERU]",
                    "Result: Pemenang [JUARA]",
                    "News: Berita [ESPORT]"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts'],
                examples: ['Highlights MPL', 'Turnamen esports terbaru', 'Pro player moments']
            },
            
            gameEasterEggs: {
                name: 'Easter Eggs Game',
                description: 'Video rahasia tersembunyi dalam game',
                icon: '🥚',
                structure: [
                    "Intro: Rahasia [GAME]",
                    "Location: Lokasi [RAHASIA]",
                    "How to: Cara [MENGAKSES]",
                    "Secret: [RAHASIA] tersembunyi",
                    "Mind blown: [REAKSI] kaget"
                ],
                duration: '30-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok'],
                examples: ['Rahasia GTA V', 'Easter eggs Minecraft', 'Hidden secrets PUBG']
            },

            // ========================================
            // KATEGORI BEAUTY & FASHION (6)
            // ========================================
            
            beauty: {
                name: 'Beauty',
                description: 'Video tutorial kecantikan',
                icon: '💄',
                structure: [
                    "Intro: Tutorial [MAKEUP]",
                    "Step 1: [LANGKAH] pertama",
                    "Step 2: [LANGKAH] kedua",
                    "Step 3: [LANGKAH] ketiga",
                    "Result: Hasil [MAKEUP] jadi"
                ],
                duration: '45-60 detik',
                bestFor: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
                examples: ['Natural makeup tutorial', 'Glowing skin routine', 'Makeup untuk pemula']
            },
            
            skincare: {
                name: 'Skincare',
                description: 'Video rutinitas perawatan kulit',
                icon: '🧴',
                structure: [
                    "Intro: Skincare [RUTIN]",
                    "Cleanse: Cuci [MUKA]",
                    "Tone: [TONER]",
                    "Moisturize: [PELEMBAB]",
                    "Protect: [SUNSCREEN]"
                ],
                duration: '30-60 detik',
                bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
                examples: ['Night skincare routine', 'Skincare untuk jerawat', '10 step Korean skincare']
            },
            
            makeupTutorial: {
                name: 'Makeup Tutorial',
                description: 'Video tutorial makeup spesifik',
                icon: '💋',
                structure: [
                    "Intro: Look [MAKEUP] hari ini",
                    "Base: [FOUNDATION]",
                    "Eyes: [EYES
