/**
 * AI Title Generator
 * Menghasilkan judul video yang menarik dan optimasi SEO
 */

class TitleGenerator {
    constructor() {
        this.modelVersion = '1.5.0';
        
        // Template judul berdasarkan kategori
        this.templates = {
            tutorial: [
                "Cara [ACTION] [TOPIC] dalam [TIME] Menit",
                "Tutorial [TOPIC] untuk Pemula - [YEAR]",
                "[ACTION] [TOPIC] dengan Mudah dan Cepat",
                "Belajar [TOPIC] dari Nol Sampai Mahir",
                "Tips [ACTION] [TOPIC] yang Jarang Diketahui"
            ],
            
            review: [
                "Review [PRODUCT] - Apakah Worth It? [YEAR]",
                "[PRODUCT] vs [COMPETITOR] - Mana yang Lebih Baik?",
                "Jujur Review [PRODUCT] Setelah [TIME] Bulan Pemakaian",
                "Unboxing dan Review [PRODUCT] Lengkap",
                "[PRODUCT] Review: Kelebihan dan Kekurangan"
            ],
            
            comparison: [
                "[TOPIC1] vs [TOPIC2] - Perbandingan Lengkap",
                "Mana yang Lebih Baik? [TOPIC1] atau [TOPIC2]",
                "[TOPIC1] vs [TOPIC2] - [ASPECT] Test",
                "Perbedaan [TOPIC1] dan [TOPIC2] yang Wajib Diketahui",
                "[TOPIC1] atau [TOPIC2]? Pilih yang Mana?"
            ],
            
            list: [
                "[NUMBER] [TOPIC] Terbaik [YEAR]",
                "[NUMBER] Tips [TOPIC] yang Wajib Dicoba",
                "Top [NUMBER] [TOPIC] Paling Populer",
                "[NUMBER] Cara [ACTION] [TOPIC] dengan Cepat",
                "[NUMBER] Rahasia [TOPIC] yang Jarang Diketahui"
            ],
            
            news: [
                "BREAKING: [NEWS] Terbaru [YEAR]",
                "Update Terbaru [TOPIC] - [NEWS]",
                "[NEWS] - Yang Perlu Kamu Tahu",
                "Viral! [NEWS] Bikin Geger [PLATFORM]",
                "Terbaru! [NEWS] Langsung dari Sumbernya"
            ],
            
            entertainment: [
                "MOMEN [EMOTION] [TOPIC] Bikin [REACTION]",
                "Compilation [TOPIC] Terlucu [YEAR]",
                "[TOPIC] Challenge - Bikin [REACTION]",
                "Reaksi [TOPIC] yang Gak Disangka-sangka",
                "[NUMBER] Momen [TOPIC] Paling [EMOTION]"
            ]
        };

        // Power words untuk meningkatkan engagement
        this.powerWords = {
            urgency: ['Sekarang', 'Hari Ini', 'Terbaru', 'Update', 'Langsung'],
            curiosity: ['Rahasia', 'Tersembunyi', 'Gak Disangka', 'Fakta', 'Mengejutkan'],
            emotion: ['Luar Biasa', 'Gila', 'Keren', 'Ngenes', 'Haru'],
            value: ['Gratis', 'Mudah', 'Cepat', 'Efektif', 'Ampuh'],
            numbers: ['1', '3', '5', '7', '10', '15', '20', '50', '100']
        };

        // Kata kunci untuk SEO
        this.seoKeywords = {
            tutorial: ['cara', 'tutorial', 'belajar', 'tips', 'panduan'],
            review: ['review', 'unboxing', 'test', 'coba', 'jujur'],
            comparison: ['vs', 'versus', 'perbandingan', 'vs', 'better'],
            trending: ['viral', 'trending', 'fyp', 'foryou', 'populer']
        };

        // Emoji untuk judul
        this.emoji = {
            popular: ['🔥', '⚡', '💥', '✨', '🚀'],
            question: ['❓', '🤔', '⁉️', '❔', '❓'],
            alert: ['⚠️', '📢', '🔔', '❗', '📌'],
            happy: ['😊', '😂', '🤣', '😍', '🥳'],
            sad: ['😢', '😭', '😱', '😨', '😰'],
            cool: ['👌', '👍', '💯', '✅', '🔥']
        };
    }

    /**
     * Generate judul berdasarkan parameter
     */
    async generateTitles(params) {
        const {
            category = 'tutorial',
            topic = '',
            keywords = [],
            targetAudience = 'general',
            platform = 'youtube',
            count = 5,
            includeEmoji = true,
            includeNumbers = true,
            language = 'id'
        } = params;

        const titles = [];
        const usedTitles = new Set();

        // Pilih template berdasarkan kategori
        const templates = this.templates[category] || this.templates.tutorial;

        for (let i = 0; i < count * 2; i++) {
            if (titles.length >= count) break;

            // Pilih template acak
            let template = templates[Math.floor(Math.random() * templates.length)];
            
            // Generate judul dari template
            let title = await this.generateFromTemplate(template, {
                topic,
                keywords,
                targetAudience,
                platform,
                includeNumbers,
                language
            });

            // Tambahkan emoji jika diinginkan
            if (includeEmoji) {
                title = this.addEmoji(title, category);
            }

            // Optimasi SEO
            title = this.optimizeSEO(title, category, platform);

            // Validasi panjang judul
            if (this.validateTitle(title, platform) && !usedTitles.has(title)) {
                titles.push({
                    title: title,
                    score: this.scoreTitle(title, category),
                    category: category,
                    platform: platform,
                    characterCount: title.length,
                    wordCount: title.split(' ').length
                });
                usedTitles.add(title);
            }
        }

        // Urutkan berdasarkan skor
        titles.sort((a, b) => b.score - a.score);

        // Tambahkan analisis untuk setiap judul
        return titles.map(title => ({
            ...title,
            analysis: this.analyzeTitle(title.title, platform)
        }));
    }

    /**
     * Generate judul dari template
     */
    async generateFromTemplate(template, params) {
        const {
            topic,
            keywords,
            targetAudience,
            platform,
            includeNumbers,
            language
        } = params;

        let title = template;

        // Replace placeholder [TOPIC]
        if (title.includes('[TOPIC]')) {
            const topicVariations = this.generateTopicVariations(topic, keywords);
            title = title.replace('[TOPIC]', this.randomChoice(topicVariations));
        }

        // Replace [TOPIC1] dan [TOPIC2] untuk comparison
        if (title.includes('[TOPIC1]') && title.includes('[TOPIC2]')) {
            const topics = this.generateComparisonTopics(topic, keywords);
            title = title.replace('[TOPIC1]', topics[0]);
            title = title.replace('[TOPIC2]', topics[1]);
        }

        // Replace [ACTION]
        if (title.includes('[ACTION]')) {
            const actions = this.getActionsForTopic(topic);
            title = title.replace('[ACTION]', this.randomChoice(actions));
        }

        // Replace [NUMBER]
        if (title.includes('[NUMBER]') && includeNumbers) {
            const number = this.randomChoice(this.powerWords.numbers);
            title = title.replace('[NUMBER]', number);
        }

        // Replace [TIME]
        if (title.includes('[TIME]')) {
            const times = ['5', '10', '15', '30', '60'];
            title = title.replace('[TIME]', this.randomChoice(times));
        }

        // Replace [YEAR]
        if (title.includes('[YEAR]')) {
            title = title.replace('[YEAR]', new Date().getFullYear().toString());
        }

        // Replace [PRODUCT]
        if (title.includes('[PRODUCT]')) {
            title = title.replace('[PRODUCT]', this.formatTopic(topic));
        }

        // Replace [COMPETITOR]
        if (title.includes('[COMPETITOR]')) {
            const competitors = this.getCompetitors(topic);
            title = title.replace('[COMPETITOR]', this.randomChoice(competitors));
        }

        // Replace [ASPECT]
        if (title.includes('[ASPECT]')) {
            const aspects = ['Performance', 'Harga', 'Kualitas', 'Fitur', 'Daya Tahan'];
            title = title.replace('[ASPECT]', this.randomChoice(aspects));
        }

        // Replace [EMOTION]
        if (title.includes('[EMOTION]')) {
            const emotions = ['Lucu', 'Gokil', 'Haru', 'Seru', 'Menegangkan'];
            title = title.replace('[EMOTION]', this.randomChoice(emotions));
        }

        // Replace [REACTION]
        if (title.includes('[REACTION]')) {
            const reactions = ['Tertawa', 'Nangis', 'Gercep', 'Kaget'];
            title = title.replace('[REACTION]', this.randomChoice(reactions));
        }

        // Replace [PLATFORM]
        if (title.includes('[PLATFORM]')) {
            title = title.replace('[PLATFORM]', this.formatPlatform(platform));
        }

        // Replace [NEWS]
        if (title.includes('[NEWS]')) {
            const news = this.generateNews(topic);
            title = title.replace('[NEWS]', news);
        }

        return title;
    }

    /**
     * Generate variasi topik
     */
    generateTopicVariations(topic, keywords) {
        const variations = [topic];
        
        // Tambahkan dengan kata kunci
        keywords.forEach(keyword => {
            variations.push(`${topic} ${keyword}`);
            variations.push(`${keyword} ${topic}`);
        });

        // Variasi format
        variations.push(topic.toUpperCase());
        variations.push(this.capitalizeWords(topic));
        
        return [...new Set(variations)];
    }

    /**
     * Generate topik untuk comparison
     */
    generateComparisonTopics(topic, keywords) {
        const competitors = this.getCompetitors(topic);
        return [topic, this.randomChoice(competitors)];
    }

    /**
     * Get actions berdasarkan topik
     */
    getActionsForTopic(topic) {
        const commonActions = [
            'Membuat', 'Menggunakan', 'Memilih', 'Memasak', 'Menggambar',
            'Menulis', 'Membaca', 'Belajar', 'Praktek', 'Coba'
        ];

        const techActions = [
            'Coding', 'Programming', 'Membangun', 'Mendeploy', 'Testing'
        ];

        const foodActions = [
            'Masak', 'Goreng', 'Rebus', 'Bakar', 'Campur'
        ];

        // Deteksi kategori dari topik
        if (topic.toLowerCase().includes('coding') || 
            topic.toLowerCase().includes('program')) {
            return techActions;
        } else if (topic.toLowerCase().includes('masak') ||
                   topic.toLowerCase().includes('resep')) {
            return foodActions;
        }

        return commonActions;
    }

    /**
     * Get competitors untuk topik
     */
    getCompetitors(topic) {
        const competitors = {
            'iphone': ['Samsung', 'Xiaomi', 'Google Pixel'],
            'samsung': ['iPhone', 'Xiaomi', 'Oppo'],
            'react': ['Vue', 'Angular', 'Svelte'],
            'vue': ['React', 'Angular', 'Svelte'],
            'javascript': ['Python', 'Java', 'TypeScript'],
            'python': ['JavaScript', 'Java', 'Go']
        };

        const lowerTopic = topic.toLowerCase();
        for (const [key, values] of Object.entries(competitors)) {
            if (lowerTopic.includes(key)) {
                return values;
            }
        }

        return ['Kompetitor A', 'Kompetitor B', 'Kompetitor C'];
    }

    /**
     * Generate news
     */
    generateNews(topic) {
        const newsTemplates = [
            `Update Terbaru ${topic}`,
            `Fitur Baru ${topic}`,
            `${topic} Resmi Dirilis`,
            `${topic} Jadi Trending`,
            `Viral! ${topic} Hebohkan Media Sosial`
        ];

        return this.randomChoice(newsTemplates);
    }

    /**
     * Format topic
     */
    formatTopic(topic) {
        return this.capitalizeWords(topic);
    }

    /**
     * Format platform
     */
    formatPlatform(platform) {
        const platforms = {
            'youtube': 'YouTube',
            'tiktok': 'TikTok',
            'instagram': 'Instagram',
            'facebook': 'Facebook'
        };

        return platforms[platform] || platform;
    }

    /**
     * Tambahkan emoji ke judul
     */
    addEmoji(title, category) {
        // Pilih kategori emoji berdasarkan tipe judul
        let emojiCategory = 'popular';
        
        if (title.includes('?')) {
            emojiCategory = 'question';
        } else if (title.includes('!')) {
            emojiCategory = 'alert';
        } else if (category === 'entertainment') {
            emojiCategory = 'happy';
        }

        const emojiList = this.emoji[emojiCategory];
        const emoji = this.randomChoice(emojiList);

        // Tambah emoji di awal atau akhir
        if (Math.random() > 0.5) {
            return `${emoji} ${title}`;
        } else {
            return `${title} ${emoji}`;
        }
    }

    /**
     * Optimasi SEO judul
     */
    optimizeSEO(title, category, platform) {
        let optimized = title;

        // Tambahkan kata kunci SEO
        const seoWords = this.seoKeywords[category] || [];
        if (seoWords.length > 0 && Math.random() > 0.7) {
            const seoWord = this.randomChoice(seoWords);
            if (!optimized.toLowerCase().includes(seoWord)) {
                optimized = `${seoWord} ${optimized}`;
            }
        }

        // Kapitalisasi yang benar
        optimized = this.capitalizeTitle(optimized);

        return optimized;
    }

    /**
     * Kapitalisasi judul (Title Case)
     */
    capitalizeTitle(title) {
        const smallWords = ['dan', 'atau', 'yang', 'di', 'ke', 'dari', 'dengan', 'untuk'];
        
        return title.split(' ').map((word, index) => {
            if (index === 0 || !smallWords.includes(word.toLowerCase())) {
                return this.capitalizeWord(word);
            }
            return word.toLowerCase();
        }).join(' ');
    }

    /**
     * Kapitalisasi kata
     */
    capitalizeWord(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    /**
     * Kapitalisasi semua kata
     */
    capitalizeWords(str) {
        return str.split(' ').map(word => 
            this.capitalizeWord(word)
        ).join(' ');
    }

    /**
     * Validasi judul untuk platform
     */
    validateTitle(title, platform) {
        const limits = {
            'youtube': { min: 20, max: 100 },
            'tiktok': { min: 10, max: 150 },
            'instagram': { min: 5, max: 2200 },
            'facebook': { min: 5, max: 255 }
        };

        const limit = limits[platform] || limits.youtube;
        const length = title.length;

        return length >= limit.min && length <= limit.max;
    }

    /**
     * Score judul berdasarkan berbagai faktor
     */
    scoreTitle(title, category) {
        let score = 70; // Base score

        // Panjang judul ideal (40-70 karakter)
        const length = title.length;
        if (length >= 40 && length <= 70) {
            score += 15;
        } else if (length >= 20 && length <= 100) {
            score += 5;
        } else {
            score -= 10;
        }

        // Power words
        for (const words of Object.values(this.powerWords)) {
            for (const word of words) {
                if (title.includes(word)) {
                    score += 3;
                }
            }
        }

        // Angka dalam judul
        if (/\d+/.test(title)) {
            score += 5;
        }

        // Tanda baca
        if (title.includes('?')) score += 3;
        if (title.includes('!')) score += 2;

        // Kata kunci SEO
        const seoWords = this.seoKeywords[category] || [];
        for (const word of seoWords) {
            if (title.toLowerCase().includes(word)) {
                score += 2;
            }
        }

        return Math.min(score, 100);
    }

    /**
     * Analisis judul
     */
    analyzeTitle(title, platform) {
        return {
            characterCount: title.length,
            wordCount: title.split(' ').length,
            hasNumbers: /\d+/.test(title),
            hasEmoji: /[\p{Emoji}]/u.test(title),
            hasQuestion: title.includes('?'),
            hasExclamation: title.includes('!'),
            powerWords: this.findPowerWords(title),
            ctr: this.estimateCTR(title),
            seoScore: this.calculateSEOScore(title, platform)
        };
    }

    /**
     * Cari power words dalam judul
     */
    findPowerWords(title) {
        const found = [];
        const lowerTitle = title.toLowerCase();

        for (const [category, words] of Object.entries(this.powerWords)) {
            for (const word of words) {
                if (lowerTitle.includes(word.toLowerCase())) {
                    found.push({ word, category });
                }
            }
        }

        return found;
    }

    /**
     * Estimasi CTR (Click Through Rate)
     */
    estimateCTR(title) {
        let ctr = 5; // Base CTR 5%

        // Faktor yang meningkatkan CTR
        if (/\d+/.test(title)) ctr += 2;
        if (title.includes('?')) ctr += 1.5;
        if (title.includes('!')) ctr += 1;
        if (this.findPowerWords(title).length > 0) ctr += 3;

        // Faktor panjang judul
        const length = title.length;
        if (length >= 40 && length <= 70) {
            ctr += 2;
        } else if (length < 20) {
            ctr -= 2;
        } else if (length > 100) {
            ctr -= 3;
        }

        return Math.min(Math.max(ctr, 1), 20);
    }

    /**
     * Hitung SEO score
     */
    calculateSEOScore(title, platform) {
        let score = 70;

        // Faktor SEO
        const words = title.toLowerCase().split(' ');
        const uniqueWords = new Set(words);
        
        // Keyword density
        const keywordDensity = uniqueWords.size / words.length;
        if (keywordDensity > 0.7) {
            score += 10;
        }

        // Panjang optimal untuk platform
        const optimalLength = platform === 'youtube' ? 60 : 80;
        const lengthDiff = Math.abs(title.length - optimalLength);
        if (lengthDiff < 10) {
            score += 10;
        } else if (lengthDiff > 30) {
            score -= 10;
        }

        return Math.min(score, 100);
    }

    /**
     * Generate judul berdasarkan trending topics
     */
    async generateTrendingTitles(platform) {
        // Simulasi trending topics
        const trendingTopics = [
            'AI Tools', 'React 19', 'TikTok Algorithm',
            'YouTube Shorts', 'Crypto News', 'Gaming Setup'
        ];

        const titles = [];
        
        for (const topic of trendingTopics) {
            const category = this.detectCategory(topic);
            const generated = await this.generateTitles({
                category,
                topic,
                platform,
                count: 2,
                includeEmoji: true
            });
            
            titles.push(...generated);
        }

        return titles.sort((a, b) => b.score - a.score);
    }

    /**
     * Deteksi kategori dari topik
     */
    detectCategory(topic) {
        const lowerTopic = topic.toLowerCase();
        
        if (lowerTopic.includes('tutorial') || lowerTopic.includes('cara')) {
            return 'tutorial';
        } else if (lowerTopic.includes('review') || lowerTopic.includes('unboxing')) {
            return 'review';
        } else if (lowerTopic.includes('vs') || lowerTopic.includes('versus')) {
            return 'comparison';
        } else if (lowerTopic.includes('viral') || lowerTopic.includes('trending')) {
            return 'trending';
        } else {
            return 'list';
        }
    }

    /**
     * Random choice dari array
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Get model info
     */
    getModelInfo() {
        return {
            version: this.modelVersion,
            templates: Object.keys(this.templates),
            powerWords: this.powerWords,
            emoji: this.emoji
        };
    }
}

module.exports = TitleGenerator;
