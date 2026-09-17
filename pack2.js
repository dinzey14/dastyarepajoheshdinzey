/**
 * pack2.js — v4 کامل
 * غلط‌یاب حرفه‌ای + تایپیست
 */
(function () {
  'use strict';

  // ============================================================
  // ═══════════ دیتابیس غلط‌های اختصاصی ═══════════
  // ============================================================
  var MISTAKES = {

    // ─── املاهای غلط شهرها و کشورها ───
    'طهران': 'تهران', 'طهرون': 'تهران', 'تهرون': 'تهران',
    'اسپهان': 'اصفهان', 'اصفهون': 'اصفهان',
    'شيراز': 'شیراز', 'تبريز': 'تبریز', 'كرج': 'کرج',
    'كرمانشاه': 'کرمانشاه', 'يزد': 'یزد', 'اردبيل': 'اردبیل',
    'اراك': 'اراک', 'كرمان': 'کرمان', 'قزوين': 'قزوین',
    'اروميه': 'ارومیه', 'ساري': 'ساری', 'گرگان': 'گرگان',
    'ايران': 'ایران', 'ايراني': 'ایرانی',
    'افغانستان': 'افغانستان', 'افغاني': 'افغانی',
    'پاكستان': 'پاکستان', 'پاكستاني': 'پاکستانی',
    'تركيه': 'ترکیه', 'تركي': 'ترکی',
    'عراقي': 'عراقی', 'عربستاني': 'عربستانی',
    'كويت': 'کویت', 'اماراتي': 'اماراتی',
    'چين': 'چین', 'چيني': 'چینی',
    'ژاپني': 'ژاپنی', 'كره': 'کره', 'كره‌اي': 'کره‌ای',
    'روسيه': 'روسیه', 'روسي': 'روسی',
    'آلماني': 'آلمانی', 'انگليس': 'انگلیس', 'انگليسي': 'انگلیسی',
    'فرانسوي': 'فرانسوی', 'اسپانيا': 'اسپانیا', 'اسپانيايي': 'اسپانیایی',
    'ايتاليا': 'ایتالیا', 'ايتاليايي': 'ایتالیایی',
    'يونان': 'یونان', 'يوناني': 'یونانی',
    'مصري': 'مصری', 'لبناني': 'لبنانی',
    'سوريه': 'سوریه', 'سوري': 'سوری',
    'اردني': 'اردنی', 'فلسطين': 'فلسطین', 'فلسطيني': 'فلسطینی',
    'هندي': 'هندی', 'امريكا': 'آمریکا', 'آمريكا': 'آمریکا',
    'اروپائي': 'اروپایی',

    // ─── کلمات علمی و فرهنگی با املای عربی ───
    'علمي': 'علمی', 'فرهنگي': 'فرهنگی', 'اجتماعي': 'اجتماعی',
    'اقتصادي': 'اقتصادی', 'سياسي': 'سیاسی',
    'تاريخي': 'تاریخی', 'فلسفي': 'فلسفی',
    'ديني': 'دینی', 'ادبي': 'ادبی',
    'هنري': 'هنری', 'ورزشي': 'ورزشی',
    'تحقيقي': 'تحقیقی', 'پژوهشي': 'پژوهشی',
    'دانشگاهي': 'دانشگاهی', 'دانشجويي': 'دانشجویی',
    'استادي': 'استادی', 'كتابي': 'کتابی',
    'مقالاتي': 'مقالاتی', 'كتاب': 'کتاب', 'كتاب‌ها': 'کتاب‌ها',
    'اسلامي': 'اسلامی', 'قرآني': 'قرآنی',
    'حقوقي': 'حقوقی', 'قانوني': 'قانونی',
    'رواني': 'روانی', 'روانشناسي': 'روانشناسی',
    'جامعه‌شناسي': 'جامعه‌شناسی', 'مردم‌شناسي': 'مردم‌شناسی',
    'باستان‌شناسي': 'باستان‌شناسی', 'جغرافيا': 'جغرافیا',
    'رياضي': 'ریاضی', 'فيزيك': 'فیزیک', 'شيمي': 'شیمی',
    'زيست': 'زیست', 'پزشكي': 'پزشکی', 'داروسازي': 'داروسازی',
    'مهندسي': 'مهندسی', 'كامپيوتر': 'کامپیوتر',
    'نرم‌افزار': 'نرم‌افزار', 'سخت‌افزار': 'سخت‌افزار',
    'شبكه': 'شبکه', 'امنيت': 'امنیت', 'الگوريتم': 'الگوریتم',
    'مديريت': 'مدیریت', 'بازاريابي': 'بازاریابی',
    'حسابداري': 'حسابداری', 'منابع': 'منابع',

    // ─── افعال محاوره‌ای ───
    'میخوام': 'می‌خواهم', 'میخوای': 'می‌خواهی', 'میخواد': 'می‌خواهد', 'میخوان': 'می‌خواهند',
    'نمیخوام': 'نمی‌خواهم', 'نمیخوای': 'نمی‌خواهی', 'نمیخواد': 'نمی‌خواهد', 'نمیخوان': 'نمی‌خواهند',
    'بخوام': 'بخواهم', 'بخوای': 'بخواهی', 'بخواد': 'بخواهد', 'بخوان': 'بخواهند',
    'نخوام': 'نخواهم', 'نخوای': 'نخواهی', 'نخواد': 'نخواهد', 'نخوان': 'نخواهند',
    'میگم': 'می‌گویم', 'میگی': 'می‌گویی', 'میگه': 'می‌گوید', 'میگن': 'می‌گویند',
    'نمیگم': 'نمی‌گویم', 'نمیگی': 'نمی‌گویی', 'نمیگه': 'نمی‌گوید', 'نمیگن': 'نمی‌گویند',
    'بگم': 'بگویم', 'بگی': 'بگویی', 'بگه': 'بگوید', 'بگن': 'بگویند',
    'میرم': 'می‌روم', 'میری': 'می‌روی', 'میره': 'می‌رود', 'میرن': 'می‌روند',
    'میرفتم': 'می‌رفتم', 'میرفتی': 'می‌رفتی', 'میرفت': 'می‌رفت',
    'برم': 'بروم', 'بری': 'بروی', 'بره': 'برود', 'برن': 'بروند',
    'میدم': 'می‌دهم', 'میدی': 'می‌دهی', 'میده': 'می‌دهد', 'میدن': 'می‌دهند',
    'بدم': 'بدهم', 'بدی': 'بدهی', 'بده': 'بدهد', 'بدن': 'بدهند',
    'میام': 'می‌آیم', 'میای': 'می‌آیی', 'میاد': 'می‌آید', 'میان': 'می‌آیند',
    'بیام': 'بیایم', 'بیای': 'بیایی', 'بیاد': 'بیاید', 'بیان': 'بیایند',
    'میکنم': 'می‌کنم', 'میکنی': 'می‌کنی', 'میکنه': 'می‌کند', 'میکنیم': 'می‌کنیم', 'میکنید': 'می‌کنید', 'میکنن': 'می‌کنند',
    'نمیکنم': 'نمی‌کنم', 'نمیکنی': 'نمی‌کنی', 'نمیکنه': 'نمی‌کند', 'نمیکنیم': 'نمی‌کنیم', 'نمیکنید': 'نمی‌کنید', 'نمیکنن': 'نمی‌کنند',
    'میتونم': 'می‌توانم', 'میتونی': 'می‌توانی', 'میتونه': 'می‌تواند', 'میتونیم': 'می‌توانیم', 'میتونید': 'می‌توانید', 'میتونن': 'می‌توانند',
    'نمیتونم': 'نمی‌توانم', 'نمیتونی': 'نمی‌توانی', 'نمیتونه': 'نمی‌تواند', 'نمیتونیم': 'نمی‌توانیم', 'نمیتونید': 'نمی‌توانید', 'نمیتونن': 'نمی‌توانند',
    'میشم': 'می‌شوم', 'میشی': 'می‌شوی', 'میشه': 'می‌شود', 'میشیم': 'می‌شویم', 'میشید': 'می‌شوید', 'میشن': 'می‌شوند',
    'نمیشم': 'نمی‌شوم', 'نمیشی': 'نمی‌شوی', 'نمیشه': 'نمی‌شود', 'نمیشیم': 'نمی‌شویم', 'نمیشید': 'نمی‌شوید', 'نمیشن': 'نمی‌شوند',
    'بشم': 'بشوم', 'بشی': 'بشوی', 'بشه': 'بشود', 'بشیم': 'بشویم', 'بشید': 'بشوید', 'بشن': 'بشوند',
    'نشم': 'نشوم', 'نشی': 'نشوی', 'نشه': 'نشود', 'نشیم': 'نشویم', 'نشید': 'نشوید', 'نشن': 'نشوند',
    'میخورم': 'می‌خورم', 'میخوری': 'می‌خوری', 'میخوره': 'می‌خورد', 'میخورن': 'می‌خورند',
    'میگیرم': 'می‌گیرم', 'میگیری': 'می‌گیری', 'میگیره': 'می‌گیرد', 'میگیرن': 'می‌گیرند',
    'میبینم': 'می‌بینم', 'میبینی': 'می‌بینی', 'میبینه': 'می‌بیند', 'میبینن': 'می‌بینند',
    'میفهمم': 'می‌فهمم', 'میفهمی': 'می‌فهمی', 'میفهمه': 'می‌فهمد', 'میفهمن': 'می‌فهمند',
    'نمیفهمم': 'نمی‌فهمم', 'نمیفهمه': 'نمی‌فهمد',
    'میخونم': 'می‌خوانم', 'میخونی': 'می‌خوانی', 'میخونه': 'می‌خواند', 'میخونن': 'می‌خوانند',
    'مینویسم': 'می‌نویسم', 'مینویسی': 'می‌نویسی', 'مینویسه': 'می‌نویسد', 'مینویسن': 'می‌نویسند',
    'میارم': 'می‌آورم', 'میاری': 'می‌آوری', 'میاره': 'می‌آورد', 'میارن': 'می‌آورند',
    'میبرم': 'می‌برم', 'میبری': 'می‌بری', 'میبره': 'می‌برد', 'میبرن': 'می‌برند',
    'میذارم': 'می‌گذارم', 'میذاری': 'می‌گذاری', 'میذاره': 'می‌گذارد', 'میذارن': 'می‌گذارند',
    'میندازم': 'می‌اندازم', 'میندازی': 'می‌اندازی', 'میندازه': 'می‌اندازد', 'میندازن': 'می‌اندازند',
    'میفتم': 'می‌افتم', 'میفتی': 'می‌افتی', 'میفته': 'می‌افتد', 'میفتن': 'می‌افتند',
    'میسازم': 'می‌سازم', 'میسازی': 'می‌سازی', 'میسازه': 'می‌سازد', 'میسازن': 'می‌سازند',
    'میزنم': 'می‌زنم', 'میزنی': 'می‌زنی', 'میزنه': 'می‌زند', 'میزنن': 'می‌زنند',
    'میخرم': 'می‌خرم', 'میخری': 'می‌خری', 'میخره': 'می‌خرد', 'میخرن': 'می‌خرند',
    'میفروشم': 'می‌فروشم', 'میفروشی': 'می‌فروشی', 'میفروشه': 'می‌فروشد', 'میفروشن': 'می‌فروشند',
    'میخوابم': 'می‌خوابم', 'میخوابی': 'می‌خوابی', 'میخوابه': 'می‌خوابد', 'میخوابن': 'می‌خوابند',
    'میپرسم': 'می‌پرسم', 'میپرسی': 'می‌پرسی', 'میپرسه': 'می‌پرسد', 'میپرسن': 'می‌پرسند',
    'میشمارم': 'می‌شمارم', 'میشماری': 'می‌شماری', 'میشماره': 'می‌شمارد', 'میشمارن': 'می‌شمارند',
    'میپرم': 'می‌پرم', 'میپری': 'می‌پری', 'میپره': 'می‌پرد', 'میپرن': 'می‌پرند',

    // ─── تنوین ───
    'حتما': 'حتماً', 'قطعا': 'قطعاً', 'مطمئنا': 'مطمئناً', 'لطفا': 'لطفاً',
    'مثلا': 'مثلاً', 'اصلا': 'اصلاً', 'کلا': 'کلاً', 'تقریبا': 'تقریباً',
    'احتمالا': 'احتمالاً', 'دقیقا': 'دقیقاً', 'واقعا': 'واقعاً', 'کاملا': 'کاملاً',
    'اجبارا': 'اجباراً', 'اختصارا': 'اختصاراً', 'اعتقادا': 'اعتقاداً', 'اساسا': 'اساساً',
    'اصولا': 'اصولاً', 'اضطرارا': 'اضطراراً', 'اکثرا': 'اکثراً', 'الزاما': 'الزاماً',
    'انتخابا': 'انتخاباً', 'اولا': 'اولاً', 'ثانیا': 'ثانیاً', 'ثالثا': 'ثالثاً',
    'رابعا': 'رابعاً', 'خامسا': 'خامساً', 'تقابلا': 'تقابلاً', 'تلویحا': 'تلویحاً',
    'جدا': 'جداً', 'حقیقتا': 'حقیقتاً', 'ذاتا': 'ذاتاً', 'رسمیا': 'رسمیاً',
    'رسما': 'رسماً', 'شفاها': 'شفاهاً', 'صریحا': 'صریحاً', 'ضرورتا': 'ضرورتاً',
    'ظاهرا': 'ظاهراً', 'عقلا': 'عقلاً', 'عمدا': 'عمداً', 'عینا': 'عیناً',
    'غالبا': 'غالباً', 'قهرا': 'قهراً', 'قولا': 'قولاً', 'کتبا': 'کتباً',
    'لزوما': 'لزوماً', 'مجددا': 'مجدداً', 'مخصوصا': 'مخصوصاً', 'معمولا': 'معمولاً',
    'مطابقا': 'مطابقاً', 'مطلقا': 'مطلقاً', 'مکررا': 'مکرراً', 'منجمله': 'من‌جمله',
    'نسبتا': 'نسبتاً', 'نهایتا': 'نهایتاً', 'طبقا': 'طبقاً', 'موضوعا': 'موضوعاً',
    'اجمالا': 'اجمالاً', 'تفصیلا': 'تفصیلاً', 'حسبا': 'حسباً', 'وفقا': 'وفقاً',
    'راسا': 'رأساً', 'خواهشا': 'خواهشاً',

    // ─── نیم‌فاصله ───
    'بجای': 'به‌جای', 'بجا': 'به‌جا', 'بجایی': 'به‌جایی',
    'بجز': 'به‌جز', 'بهمراه': 'به‌همراه',
    'براحتی': 'به‌راحتی', 'بهراحتی': 'به‌راحتی', 'براستی': 'به‌راستی',
    'بطور': 'به‌طور', 'بهطور': 'به‌طور', 'بطوریکه': 'به‌طوری‌که',
    'بنحوی': 'به‌نحوی', 'بنوعی': 'به‌نوعی',
    'ازاینرو': 'ازاین‌رو', 'همانطور': 'همان‌طور', 'همانطوری': 'همان‌طوری',
    'همانطوریکه': 'همان‌طوری‌که', 'بدینوسیله': 'بدین‌وسیله',
    'بدین‌گونه': 'بدین‌گونه', 'همینطور': 'همین‌طور',
    'همینطوریکه': 'همین‌طوری‌که',
    'بخاطر': 'به‌خاطر', 'بخاطرش': 'به خاطرش',
    'بهرحال': 'به‌هرحال', 'بهرصورت': 'به‌هرصورت',
    'بهدلیل': 'به‌دلیل', 'بدلیل': 'به‌دلیل',
    'بهمنظور': 'به‌منظور', 'بمنظور': 'به‌منظور',
    'بهموقع': 'به‌موقع', 'بموقع': 'به‌موقع',
    'بهاندازه': 'به‌اندازه', 'باندازه': 'به‌اندازه',
    'بهعنوان': 'به‌عنوان', 'بهشرطی': 'به‌شرطی', 'بهشرط': 'به‌شرط',
    'باتوجهبه': 'باتوجه‌به', 'باعنایتبه': 'باعنایت‌به',
    'بههمین': 'به‌همین', 'بهمین': 'به‌همین',
    'درصورتیکه': 'درصورتی‌که',

    // ─── غلط‌های املایی رایج ───
    'خاهش': 'خواهش', 'خاستم': 'خواستم', 'خاستن': 'خواستن',
    'انشاالله': 'ان‌شاءالله', 'انشا الله': 'ان‌شاءالله', 'ان شاءالله': 'ان‌شاءالله',
    'ایشالله': 'ان‌شاءالله', 'ایشالا': 'ان‌شاءالله',
    'ایشون': 'ایشان', 'ایشونو': 'ایشان را', 'ایشونا': 'ایشان را',
    'اون': 'آن', 'اونا': 'آن‌ها', 'اینا': 'این‌ها',
    'اینجوری': 'این‌جوری', 'اونجوری': 'آن‌جوری',
    'همون': 'همان', 'همونا': 'همان‌ها',
    'چقد': 'چقدر', 'چندتا': 'چند تا', 'هیچی': 'هیچ',
    'هیچکس': 'هیچ‌کس', 'هیچکدام': 'هیچ‌کدام',
    'بعضیا': 'بعضی‌ها', 'همش': 'همه‌اش',
    'خودمون': 'خودمان', 'خودتون': 'خودتان', 'خودشون': 'خودشان',
    'اینارو': 'این‌ها را', 'اونارو': 'آن‌ها را',

    // ─── جمع‌های غلط ───
    'کتابا': 'کتاب‌ها', 'کتابها': 'کتاب‌ها', 'دوستا': 'دوست‌ها', 'دوستها': 'دوست‌ها',
    'کارا': 'کارها', 'حرفا': 'حرف‌ها',
    'کلمها': 'کلمه‌ها', 'جملها': 'جمله‌ها',
    'مسئلا': 'مسئله‌ها', 'پروژها': 'پروژه‌ها',
    'مبحثا': 'مبحث‌ها', 'موضوعا': 'موضوع‌ها',
    'نکتها': 'نکته‌ها', 'بخشا': 'بخش‌ها',
    'فصلا': 'فصل‌ها', 'صفحها': 'صفحه‌ها',
    'پژوهشا': 'پژوهش‌ها', 'تحقیقا': 'تحقیق‌ها',
    'مقالا': 'مقاله‌ها', 'استادا': 'استادها',
    'نویسندها': 'نویسنده‌ها', 'فرضیها': 'فرضیه‌ها',
    'داده‌ا': 'داده‌ها', 'داده ها': 'داده‌ها',
    'متغیرا': 'متغیرها', 'نمونه‌ا': 'نمونه‌ها',

    // ─── همزه ───
    'مسله': 'مسئله', 'مسايل': 'مسائل', 'تاثیر': 'تأثیر',
    'تاثيرات': 'تأثیرات', 'متعاثر': 'متأثر',
    'مولف': 'مؤلف', 'مولفین': 'مؤلفان', 'مولفان': 'مؤلفان',
    'موثر': 'مؤثر', 'موثرترین': 'مؤثرترین',
    'مويد': 'مؤید', 'موید': 'مؤید',
    'راس': 'رأس', 'رئيس': 'رئیس',
    'متاسفانه': 'متأسفانه', 'متاسف': 'متأسف', 'متاسفم': 'متأسفم',
    'مسول': 'مسئول', 'مسولیت': 'مسئولیت', 'مسولان': 'مسئولان',
    'مسیول': 'مسئول', 'مسیولیت': 'مسئولیت',
    'جرات': 'جرئت', 'جریت': 'جرئت',
    'متمايز': 'متمایز', 'تمايز': 'تمایز',
    'جايز': 'جایز', 'جايزه': 'جایزه',
    'پايدار': 'پایدار', 'پايداري': 'پایداری',
    'درايت': 'درایت', 'هدايت': 'هدایت',
    'بهائي': 'بهایی', 'بهائی': 'بهایی',

    // ─── افعال با نیم‌فاصلهٔ جاافتاده ───
    'وجوددارد': 'وجود دارد', 'وجوددارند': 'وجود دارند', 'وجودداشت': 'وجود داشت',
    'نیازدارد': 'نیاز دارد', 'نیازدارند': 'نیاز دارند', 'نیازداشت': 'نیاز داشت',
    'اشکالدارد': 'اشکال دارد', 'اشکالداشت': 'اشکال داشت',
    'مشکلدارد': 'مشکل دارد', 'مشکلداشت': 'مشکل داشت',
    'اهمیتدارد': 'اهمیت دارد', 'اهمیتداشت': 'اهمیت داشت',
    'ارتباطدارد': 'ارتباط دارد', 'ارتباطداشت': 'ارتباط داشت',
    'نقشدارد': 'نقش دارد', 'نقشداشت': 'نقش داشت',
    'تاثیردارد': 'تأثیر دارد', 'تاثیرداشت': 'تأثیر داشت',
    'تفاوتدارد': 'تفاوت دارد', 'تفاوداشت': 'تفاوت داشت',
    'شباهتدارد': 'شباهت دارد', 'شباهتداشت': 'شباهت داشت',
    'معنیدارد': 'معنی دارد', 'معنیداشت': 'معنی داشت',
    'ارزشدارد': 'ارزش دارد', 'ارزشداشت': 'ارزش داشت',
    'ادامهدارد': 'ادامه دارد', 'ادامهداشت': 'ادامه داشت',
    'برمیگردد': 'برمی‌گردد', 'بازمیگردد': 'بازمی‌گردد',
    'فراهممیکند': 'فراهم می‌کند', 'ارائهمیدهد': 'ارائه می‌دهد',
    'بیانمیکند': 'بیان می‌کند', 'اشارهمیکند': 'اشاره می‌کند',
    'تاکیدمیکند': 'تأکید می‌کند', 'پیشنهادمیکند': 'پیشنهاد می‌کند',
    'نشانمیدهد': 'نشان می‌دهد',
    'درنظرگرفته': 'در نظر گرفته', 'درنظرمیگیرد': 'در نظر می‌گیرد'
  };

  // ============================================================
  // ═══════════ کلمات کلیدی (بیمه) ═══════════
  // ============================================================
  var IMPORTANT_WORDS = [
    'تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم',
    'کرمانشاه', 'یزد', 'اردبیل', 'بندرعباس', 'اراک', 'زاهدان', 'کرمان',
    'همدان', 'رشت', 'زنجان', 'سنندج', 'گرگان', 'قزوین', 'ارومیه',
    'خرم‌آباد', 'ساری', 'بوشهر', 'بیرجند', 'ایلام', 'شهرکرد', 'یاسوج',
    'بجنورد', 'سمنان', 'ورامین', 'نجف‌آباد', 'دزفول', 'آبادان',
    'خرمشهر', 'مسجدسلیمان', 'بروجرد', 'خوی', 'مراغه', 'مرند',
    'میاندوآب', 'مهاباد', 'بانه', 'سقز', 'قائم‌شهر', 'بابل', 'آمل',
    'نوشهر', 'چالوس', 'رامسر', 'لاهیجان', 'انزلی', 'آستارا',
    'پارس‌آباد', 'خلخال', 'سراب', 'فسا', 'جهرم', 'لار', 'مرودشت',
    'کازرون', 'برازجان', 'گناوه', 'دیلم',
    'ایران', 'افغانستان', 'عراق', 'ترکیه', 'پاکستان', 'هند', 'چین',
    'روسیه', 'آمریکا', 'انگلستان', 'فرانسه', 'آلمان', 'ایتالیا',
    'اسپانیا', 'ژاپن', 'کره', 'مصر', 'عربستان', 'امارات', 'قطر',
    'کویت', 'عمان', 'بحرین', 'لبنان', 'سوریه', 'اردن', 'فلسطین',
    'یونان', 'روم', 'ایرلند', 'هلند', 'بلژیک', 'سوئد', 'نروژ',
    'دانمارک', 'فنلاند', 'اتریش', 'سوئیس', 'لهستان', 'مجارستان',
    'پژوهش', 'تحقیق', 'دانشگاه', 'دانشجو', 'استاد', 'علمی', 'فرهنگی',
    'اجتماعی', 'اقتصادی', 'سیاسی', 'تاریخی', 'فلسفی', 'دینی', 'ادبی',
    'هنری', 'ورزشی', 'کتاب', 'مقاله', 'پایان‌نامه', 'رساله', 'منبع',
    'مرجع', 'فصل', 'بخش', 'مقدمه', 'نتیجه', 'بحث', 'تحلیل', 'بررسی',
    'مطالعه', 'روش', 'داده', 'نمودار', 'جدول', 'شکل', 'تصویر',
    'نویسنده', 'مترجم', 'ناشر', 'چاپ', 'صفحه', 'شماره', 'فرضیه',
    'متغیر', 'نمونه', 'جامعه', 'آماری', 'کیفی', 'کمی', 'میدانی',
    'کتابخانه', 'آزمون', 'آزمایش', 'نظریه', 'الگو', 'مدل', 'ساختار',
    'کارکرد', 'رابطه', 'همبستگی', 'علت', 'معلول', 'تفسیر', 'توصیف',
    'تبیین', 'پیشینه', 'ادبیات', 'چکیده', 'کلیدواژه', 'فهرست',
    'منابع', 'پیوست', 'نتیجه‌گیری', 'پیشنهاد',
    'ریاضی', 'فیزیک', 'شیمی', 'زیست', 'زمین', 'نجوم', 'پزشکی',
    'داروسازی', 'مهندسی', 'کامپیوتر', 'برنامه', 'نرم‌افزار',
    'سخت‌افزار', 'هوش', 'مصنوعی', 'شبکه', 'امنیت', 'داده‌کاوی',
    'یادگیری', 'ماشین', 'الگوریتم', 'پایگاه', 'حقوق', 'قانون',
    'اقتصاد', 'حسابداری', 'مدیریت', 'بازاریابی', 'روانشناسی',
    'جامعه‌شناسی', 'مردم‌شناسی', 'باستان‌شناسی', 'جغرافیا', 'تاریخ',
    'فلسفه', 'منطق', 'عرفان', 'کلام', 'فقه', 'حدیث', 'تفسیر', 'قرآن',
    'اسلام', 'محمد', 'علی', 'حسن', 'حسین', 'رضا', 'مهدی', 'فاطمه',
    'زهرا', 'مریم', 'احمد', 'محمود', 'سعید', 'مجید', 'امیر', 'فرهاد',
    'کوروش', 'داریوش', 'رستم', 'سهراب', 'فارسی', 'عربی', 'انگلیسی',
    'فرانسه', 'آلمانی', 'ترکی', 'کردی', 'بلوچی', 'زبان', 'شعر',
    'نثر', 'داستان', 'رمان', 'نمایشنامه'
  ];

  // ============================================================
  // ═══════════ حروف نزدیک روی کیبورد فارسی ═══════════
  // ============================================================
  var SIMILAR = {
    'ح': 'خجچ', 'خ': 'حجچ', 'ج': 'حخچ', 'چ': 'حخج',
    'ط': 'تثبپ', 'ت': 'طثبپ', 'ث': 'طتبپ', 'ب': 'پتثط', 'پ': 'بتثط',
    'ذ': 'زضظ', 'ز': 'ذضظژ', 'ض': 'ذزظ', 'ظ': 'ذزض', 'ژ': 'ز',
    'س': 'شصث', 'ش': 'سصث', 'ص': 'سشث',
    'ک': 'گ', 'گ': 'ک',
    'ع': 'غأإا', 'غ': 'عأإا',
    'ا': 'أإآعغ', 'أ': 'اإآ', 'إ': 'اأآ', 'آ': 'اأإ',
    'ق': 'فغ', 'ف': 'قغ',
    'د': 'ذ', 'ر': 'ز', 'ن': 'م', 'م': 'ن',
    'و': 'ؤ', 'ه': 'ةۀ',
    'ی': 'يى', 'ي': 'ی', 'ى': 'ی',
    'ک': 'ك', 'ك': 'ک',
    'ه': 'ة', 'ة': 'ه'
  };
  function areSimilar(c1, c2) {
    if (c1 === c2) return true;
    var s = SIMILAR[c1];
    return s ? s.indexOf(c2) !== -1 : false;
  }

  // ============================================================
  // ═══════════ Levenshtein با وزن ═══════════
  // ============================================================
  function levenshtein(a, b, maxDist) {
    if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
    var m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    var prev = [], curr = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      curr[0] = i;
      var rowMin = curr[0];
      for (var j2 = 1; j2 <= n; j2++) {
        var cost = (a[i-1] === b[j2-1]) ? 0 : (areSimilar(a[i-1], b[j2-1]) ? 0.5 : 1);
        curr[j2] = Math.min(prev[j2] + 1, curr[j2-1] + 1, prev[j2-1] + cost);
        if (curr[j2] < rowMin) rowMin = curr[j2];
      }
      if (rowMin > maxDist) return maxDist + 1;
      prev = curr.slice();
    }
    return prev[n];
  }

  // ============================================================
  // ═══════════ دیکشنری ═══════════
  // ============================================================
  var WORDS_BY_LEN = {};
  var HAS_DICT = false;
  var whitelistSet = {};

  function loadDictFile() {
    return fetch('fa-words.txt').then(function (r) {
      if (!r.ok) throw new Error('not found');
      return r.text();
    }).then(function (text) {
      var words = text.split(/[\r\n]+/).map(function (w) {
        return w.trim().split(/\s/)[0];
      }).filter(function (w) { return w.length >= 2 && /^[\u0600-\u06FF\u200c]+$/.test(w); });
      var uniq = {};
      words.forEach(function (w) { uniq[w] = 1; });
      Object.keys(uniq).forEach(function (w) {
        var len = w.length;
        if (!WORDS_BY_LEN[len]) WORDS_BY_LEN[len] = [];
        WORDS_BY_LEN[len].push(w);
      });
      HAS_DICT = Object.keys(WORDS_BY_LEN).length > 0;
      var total = 0;
      for (var k in WORDS_BY_LEN) total += WORDS_BY_LEN[k].length;
      console.log('📖 دیکشنری بار شد: ' + total.toLocaleString('fa-IR') + ' کلمه');
      return total;
    }).catch(function (e) {
      console.warn('⚠️ fa-words.txt پیدا نشد — از حالت ساده استفاده می‌شه');
      HAS_DICT = false;
      return 0;
    });
  }

  function addImportantWords() {
    var added = 0;
    IMPORTANT_WORDS.forEach(function (w) {
      var len = w.length;
      if (!WORDS_BY_LEN[len]) WORDS_BY_LEN[len] = [];
      if (WORDS_BY_LEN[len].indexOf(w) === -1) {
        WORDS_BY_LEN[len].push(w);
        added++;
      }
    });
    console.log('⭐ ' + added.toLocaleString('fa-IR') + ' کلمهٔ کلیدی اضافه شد');
  }

  function isKnownWord(w) {
    if (!HAS_DICT) return true;
    var group = WORDS_BY_LEN[w.length];
    return group ? group.indexOf(w) !== -1 : false;
  }

  // الگوریتم بهبودیافته: ترجیح کلمهٔ هم‌طول
  function findClosest(word, maxDist) {
    maxDist = maxDist || 2.5;
    var best = null, bestDist = maxDist + 0.5, bestLenDiff = 999;
    for (var d = -2; d <= 2; d++) {
      var group = WORDS_BY_LEN[word.length + d];
      if (!group) continue;
      for (var i = 0; i < group.length; i++) {
        var dist = levenshtein(word, group[i], bestDist);
        var lenDiff = Math.abs(group[i].length - word.length);
        if (dist < bestDist - 0.001) {
          bestDist = dist;
          best = group[i];
          bestLenDiff = lenDiff;
        } else if (Math.abs(dist - bestDist) < 0.001 && lenDiff < bestLenDiff) {
          best = group[i];
          bestLenDiff = lenDiff;
        }
      }
    }
    return { word: best, distance: bestDist };
  }

  // ============================================================
  // ═══════════ تحلیل متن ═══════════
  // ============================================================
  var ARABIC_TO_PERSIAN = { 'ي':'ی','ك':'ک','ى':'ی','ة':'ه','ۀ':'ه','ؤ':'و','إ':'ا','أ':'ا' };
  function normalize(w) {
    var out = '';
    for (var i = 0; i < w.length; i++) out += ARABIC_TO_PERSIAN[w[i]] || w[i];
    return out;
  }

  var personalDict = {};
  var DICT_KEY = 'pack2_dict_v4';
  function loadPD() { try { personalDict = JSON.parse(localStorage.getItem(DICT_KEY) || '{}'); } catch (e) {} }
  function savePD() { try { localStorage.setItem(DICT_KEY, JSON.stringify(personalDict)); } catch (e) {} }

  function findMistakes(text) {
    if (!text) return [];
    var issues = [];
    var re = /[\u0600-\u06FF\u200c]+/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var word = m[0].trim();
      if (word.length < 2) continue;
      if (word.indexOf('\u200c') !== -1) continue;
      if (personalDict[word]) continue;
      if (whitelistSet[word]) continue;

      // ۱. غلط اختصاصی (قبل از دیکشنری چک می‌شه)
      if (MISTAKES[word] && MISTAKES[word] !== word) {
        issues.push({ wrong: word, right: MISTAKES[word], type: 'common' });
        continue;
      }

      // ۲. نویسهٔ عربی
      var norm = normalize(word);
      if (norm !== word) {
        issues.push({ wrong: word, right: norm, type: 'arabic' });
        continue;
      }

      // ۳. کلمهٔ ناشناخته
      if (HAS_DICT && !isKnownWord(word)) {
        var closest = findClosest(word, 2.5);
        if (closest.word) {
          issues.push({ wrong: word, right: closest.word, type: 'typo', distance: closest.distance });
        } else {
          issues.push({ wrong: word, right: null, type: 'unknown' });
        }
      }
    }
    return issues;
  }

  function scanAll() {
    var results = [];
    (window.pages || []).forEach(function (page, pageIdx) {
      if (!window.traverseTree) return;
      window.traverseTree(page.tree, function (node) {
        if (node.type === 'chapter') return;
        var text = (node.content || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<[^>]*>/g, ' ');
        var issues = findMistakes(text);
        if (issues.length > 0) {
          var uniq = {};
          issues.forEach(function (i) { uniq[i.wrong + '→' + (i.right || '?')] = i; });
          results.push({
            pageIdx: pageIdx,
            pageTitle: page.title || 'بدون عنوان',
            nodeId: node.id,
            nodeTitle: node.title || 'بدون عنوان',
            nodeNumber: node.number || '',
            issues: Object.keys(uniq).map(function (k) { return uniq[k]; })
          });
        }
      });
    });
    return results;
  }

  // ============================================================
  // ═══════════ UI ═══════════
  // ============================================================
  var currentScan = [];

  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function openSpellCheck() {
    if (!HAS_DICT) {
      if (!confirm('⚠️ فایل fa-words.txt پیدا نشد.\n\nبررسی فقط با لیست غلط‌های رایج انجام می‌شه.\n\nادامه؟')) return;
    }
    var results = scanAll();
    currentScan = results;
    var totalIssues = results.reduce(function (s, r) { return s + r.issues.length; }, 0);

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">';
    html += '<h3 style="margin:0;">📝 غلط‌یاب فارسی</h3>';
    if (totalIssues > 0) {
      html += '<button onclick="__p2_fixAll()" style="background:#10b981;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:0.78rem;font-weight:700;">✅ اصلاح همه</button>';
    }
    html += '</div>';

    if (!HAS_DICT) {
      html += '<div style="background:#fef3c7;border-radius:10px;padding:10px 14px;font-size:0.75rem;color:#78350f;margin-bottom:12px;line-height:1.8;">⚠️ دیکشنری کامل نیست. برای دقت بیشتر فایل <code>fa-words.txt</code> رو دانلود کن.</div>';
    }

    if (totalIssues === 0) {
      html += '<div style="text-align:center;padding:40px 20px;"><div style="font-size:3rem;margin-bottom:10px;">✅</div><div style="color:#10b981;font-weight:700;">هیچ غلطی پیدا نشد!</div></div>';
      html += '<div class="modal-actions" style="margin-top:14px;"><button class="btn-cancel" onclick="__p2_close()">بستن</button></div>';
      showModal(html, 'max-width:680px;');
      return;
    }

    html += '<div style="background:var(--bg-main);padding:10px 14px;border-radius:10px;margin-bottom:12px;font-size:0.8rem;">';
    html += '<strong style="color:#dc2626;">' + totalIssues + '</strong> مورد در <strong>' + results.length + '</strong> بخش';
    html += '</div>';

    html += '<div style="max-height:55vh;overflow-y:auto;">';
    results.forEach(function (r) {
      html += '<div style="margin-bottom:12px;padding:10px 12px;background:var(--bg-main);border-radius:10px;border-right:3px solid var(--primary);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      html += '<div style="font-size:0.75rem;"><span style="color:var(--primary);font-weight:700;">📄 ' + escapeHtml(r.pageTitle) + '</span>';
      if (r.nodeNumber) html += '<span style="color:var(--text-muted);margin:0 6px;">›</span>';
      html += '<span style="color:var(--text-dark);">' + escapeHtml(r.nodeTitle) + '</span></div>';
      html += '<button onclick="__p2_jump(' + r.pageIdx + ',\'' + r.nodeId + '\')" style="background:none;border:1px solid var(--border-light);color:var(--text-muted);padding:2px 8px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.65rem;">↗ رفتن</button>';
      html += '</div>';

      r.issues.forEach(function (iss) {
        var typeLabel = { arabic: 'عربی', common: 'غلط رایج', typo: 'اشتباه تایپی', unknown: 'نامعتبر' }[iss.type] || iss.type;
        var typeColor = { arabic: '#f59e0b', common: '#dc2626', typo: '#8b5cf6', unknown: '#64748b' }[iss.type] || '#64748b';
        html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-top:1px dashed var(--border-light);font-size:0.78rem;">';
        html += '<span style="color:#dc2626;font-weight:600;">' + escapeHtml(iss.wrong) + '</span>';
        if (iss.right) {
          html += '<span style="color:var(--text-muted);">→</span>';
          html += '<span style="color:#10b981;font-weight:700;">' + escapeHtml(iss.right) + '</span>';
        } else {
          html += '<span style="color:var(--text-muted);font-style:italic;">— بدون پیشنهاد</span>';
        }
        html += '<span style="font-size:0.58rem;color:#fff;background:' + typeColor + ';padding:1px 6px;border-radius:4px;">' + typeLabel + '</span>';
        html += '<span style="margin-right:auto;display:flex;gap:4px;">';
        if (iss.right) {
          html += '<button onclick="__p2_fixOne(\'' + r.nodeId + '\',\'' + esc(iss.wrong) + '\',\'' + esc(iss.right) + '\',this)" style="background:#10b981;color:#fff;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.68rem;font-weight:600;">✓ اصلاح</button>';
        }
        html += '<button onclick="__p2_addDict(\'' + esc(iss.wrong) + '\')" title="این کلمه درسته" style="background:none;border:1px solid var(--border-light);color:var(--text-muted);padding:3px 8px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.68rem;">درسته</button>';
        html += '</span></div>';
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="modal-actions" style="margin-top:14px;"><button class="btn-cancel" onclick="__p2_close()">بستن</button></div>';
    showModal(html, 'max-width:700px;');
  }

  window.__p2_fixOne = function (nodeId, wrong, right, btn) {
    var target = null;
    (window.pages || []).forEach(function (pg) {
      var n = window.findNode ? window.findNode(pg.tree, nodeId) : null;
      if (n) target = n;
    });
    if (!target) return;
    var re = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    target.content = (target.content || '').replace(re, right);
    if (window.saveData) window.saveData();
    if (window.renderPages) window.renderPages();
    if (btn) { btn.textContent = '✓'; btn.disabled = true; }
    if (window.showToast) window.showToast('✅ ' + wrong + ' → ' + right);
  };

  window.__p2_fixAll = function () {
    if (!confirm('همهٔ غلط‌های قابل اصلاح، اصلاح شوند؟')) return;
    var total = 0;
    currentScan.forEach(function (r) {
      (window.pages || []).forEach(function (pg) {
        var node = window.findNode ? window.findNode(pg.tree, r.nodeId) : null;
        if (!node) return;
        r.issues.forEach(function (iss) {
          if (!iss.right || personalDict[iss.wrong]) return;
          var re = new RegExp(iss.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          var before = node.content || '';
          var after = before.replace(re, iss.right);
          if (before !== after) { node.content = after; total++; }
        });
      });
    });
    if (window.saveData) window.saveData();
    if (window.renderAll) window.renderAll();
    closeModal();
    if (window.showToast) window.showToast('✅ ' + total + ' مورد اصلاح شد');
  };

  window.__p2_addDict = function (word) {
    personalDict[word] = 1;
    savePD();
    if (window.showToast) window.showToast('✅ «' + word + '» در دیکشنری ثبت شد');
  };

  window.__p2_jump = function (pageIdx, nodeId) {
    window.currentPageIndex = pageIdx;
    if (window.renderAll) window.renderAll();
    closeModal();
    setTimeout(function () {
      var el = document.querySelector('.tree-node[data-node-id="' + nodeId + '"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background 0.3s';
        el.style.background = '#fef3c7';
        setTimeout(function () { el.style.background = ''; }, 2000);
      }
    }, 200);
  };
  window.__p2_close = closeModal;

  // ============================================================
  // ═══════════ تایپیست ═══════════
  // ============================================================
  var typistActive = false;
  function ensureTypistStyle() {
    if (document.getElementById('pack2-typist-style')) return;
    var s = document.createElement('style');
    s.id = 'pack2-typist-style';
    s.textContent = 'body.p2-typist .tree-content-editor > * { opacity: 0.2; transition: opacity 0.25s; }' +
      'body.p2-typist .tree-content-editor > .p2-current { opacity: 1 !important; background: linear-gradient(90deg, transparent, rgba(250,204,21,0.12), transparent); border-radius: 4px; }' +
      '#p2-typist-ind { position: fixed; top: 50px; left: 50%; transform: translateX(-50%); background: #facc15; color: #0f172a; padding: 5px 16px; border-radius: 30px; font-family: Vazirmatn, sans-serif; font-size: 0.72rem; font-weight: 700; z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }';
    document.head.appendChild(s);
  }
  function updateTypist() {
    if (!typistActive) return;
    document.querySelectorAll('.p2-current').forEach(function (e) { e.classList.remove('p2-current'); });
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    var container = sel.getRangeAt(0).startContainer;
    var editor = container.nodeType === 3 ? container.parentElement : container;
    while (editor && !editor.classList.contains('tree-content-editor')) editor = editor.parentElement;
    if (!editor) return;
    var el = container.nodeType === 3 ? container.parentElement : container;
    while (el && el.parentElement !== editor) el = el.parentElement;
    if (el) el.classList.add('p2-current');
  }
  function toggleTypist() {
    typistActive = !typistActive;
    ensureTypistStyle();
    if (typistActive) {
      document.body.classList.add('p2-typist');
      var ind = document.createElement('div');
      ind.id = 'p2-typist-ind';
      ind.textContent = '🎯 حالت تایپیست فعال';
      document.body.appendChild(ind);
      document.addEventListener('selectionchange', updateTypist);
      document.addEventListener('keyup', updateTypist);
      document.addEventListener('mouseup', updateTypist);
      updateTypist();
      if (window.showToast) window.showToast('🎯 حالت تایپیست روشن');
    } else {
      document.body.classList.remove('p2-typist');
      var e = document.getElementById('p2-typist-ind'); if (e) e.remove();
      document.removeEventListener('selectionchange', updateTypist);
      document.removeEventListener('keyup', updateTypist);
      document.removeEventListener('mouseup', updateTypist);
      document.querySelectorAll('.p2-current').forEach(function (n) { n.classList.remove('p2-current'); });
      if (window.showToast) window.showToast('حالت تایپیست خاموش');
    }
  }

  // ============================================================
  // ═══════════ مودال ═══════════
  // ============================================================
  function showModal(html, style) {
    var ov = document.getElementById('pack2ModalOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'pack2ModalOverlay';
      ov.className = 'modal-overlay';
      ov.style.zIndex = '5001';
      ov.innerHTML = '<div class="modal-box" id="pack2ModalBox"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    }
    var box = document.getElementById('pack2ModalBox');
    box.style.cssText = style || 'max-width:640px;';
    box.innerHTML = html;
    ov.classList.add('show');
  }
  function closeModal() {
    var ov = document.getElementById('pack2ModalOverlay');
    if (ov) ov.classList.remove('show');
  }

  // ============================================================
  // ═══════════ دکمه‌ها + کلیدها ═══════════
  // ============================================================
  function addButtons() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-pack2]')) return;
    var spell = document.createElement('button');
    spell.setAttribute('data-pack2', 'spell');
    spell.title = 'غلط‌یاب کل پروژه (Ctrl+Shift+S)';
    spell.style.cssText = 'background:#dc2626;color:#fff;font-weight:700;';
    spell.textContent = '📝 غلط‌یاب کل پروژه';
    spell.onclick = openSpellCheck;
    actions.insertBefore(spell, actions.firstChild);
    var typ = document.createElement('button');
    typ.setAttribute('data-pack2', 'typist');
    typ.title = 'حالت تایپیست (Ctrl+Shift+K)';
    typ.style.cssText = 'background:#0f172a;color:#fff;';
    typ.textContent = '🎯 تایپیست';
    typ.onclick = toggleTypist;
    actions.insertBefore(typ, spell.nextSibling);
  }
  function shortcuts() {
    document.addEventListener('keydown', function (e) {
      if (!e.ctrlKey || !e.shiftKey) return;
      var k = (e.key || '').toLowerCase();
      if (k === 's' || k === 'س') { e.preventDefault(); openSpellCheck(); }
      else if (k === 'k' || k === 'ن') { e.preventDefault(); toggleTypist(); }
    });
  }

  // ============================================================
  // ═══════════ Boot ═══════════
  // ============================================================
  function boot() {
    loadPD();
    loadDictFile().then(function () {
      addImportantWords();
      console.log('✅ pack2 v4 ready');
    });
    addButtons();
    shortcuts();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 700); });
  else setTimeout(boot, 700);
})();