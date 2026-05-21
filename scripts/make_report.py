"""Generate the DOCX report for the CryptoMonitor lab work.

Run from project root after dropping screenshots into ./screenshots/:
    python3 scripts/make_report.py
"""
from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots"
OUTPUT = PROJECT_ROOT / "Звіт_CryptoMonitor.docx"


STUDENT_NAME = "Бобаль В."
GROUP = "1 група"
DISCIPLINE = "Крос-платформне програмування мобільних додатків"
TOPIC = "Мобільний додаток моніторингу криптовалют на React Native"
VARIANT = "Залікова робота"
REPO_URL = "https://github.com/crxscent/CryptoMonitor"

TASK_TEXT = (
    "Створити додаток для моніторингу криптовалют: список топ-20 криптовалют "
    "з API (CoinGecko), графік зміни ціни, пошук та додавання в обране."
)

SCREENSHOTS = [
    (
        "01_top20.png",
        "Екран «Топ-20». Список двадцяти криптовалют за ринковою капіталізацією, "
        "із поточною ціною, зміною за 24 години та зіркою для додавання в обране. "
        "Жест «потягнути вниз» оновлює дані.",
    ),
    (
        "02_detail_chart.png",
        "Екран деталей монети з графіком зміни ціни. Доступні діапазони 1Д, 7Д, "
        "30Д, 90Д, 1Р. Нижче — статистичний блок: капіталізація, об'єм, мінімум "
        "та максимум за 24 години, ранг і циркуляційна пропозиція.",
    ),
    (
        "03_search.png",
        "Екран пошуку. Введення тексту запускає debounce-запит до endpoint "
        "/search CoinGecko. Можна натиснути на результат для переходу до деталей "
        "або одразу додати монету в обране.",
    ),
    (
        "04_favorites.png",
        "Екран «Обране». Дані зберігаються через AsyncStorage та переживають "
        "перезапуск. При фокусуванні екрана список ціни оновлюється запитом "
        "/coins/markets?ids=…",
    ),
]


def set_font(run, name="Times New Roman", size=14, bold=False, color=None):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        from docx.oxml import OxmlElement

        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), name)
    run.font.size = Pt(size)
    run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def add_paragraph(doc, text, *, size=14, bold=False, align=None, indent_first=True):
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    if indent_first:
        p.paragraph_format.first_line_indent = Cm(1.25)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    set_font(run, size=size, bold=bold)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    set_font(run, size=16 if level == 1 else 14, bold=True)
    return p


def build_title_page(doc):
    section = doc.sections[0]
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(1.5)

    def centered(text, *, size=14, bold=False, space_after=0):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.space_after = Pt(space_after)
        r = p.add_run(text)
        set_font(r, size=size, bold=bold)
        return p

    centered("Міністерство освіти і науки України", size=14)
    centered("Національний університет «Львівська політехніка»", size=14, bold=True, space_after=12)
    centered("Кафедра програмного забезпечення", size=14, space_after=72)

    centered("ЗВІТ", size=22, bold=True, space_after=8)
    centered(f"з дисципліни «{DISCIPLINE}»", size=14, space_after=24)
    centered(f"Тема: «{TOPIC}»", size=14, bold=True, space_after=8)
    centered(f"Варіант: {VARIANT}", size=14, space_after=120)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.line_spacing = 1.2
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(f"Виконав: студент {GROUP}\n{STUDENT_NAME}")
    set_font(r, size=14)

    for _ in range(6):
        doc.add_paragraph()
    centered("Львів — 2026", size=14)
    doc.add_page_break()


def build_task_section(doc):
    add_heading(doc, "1. Завдання")
    add_paragraph(doc, TASK_TEXT)
    add_paragraph(doc, "Загальні вимоги до варіанта:")
    bullets = [
        "Реалізувати мобільний додаток на React Native (Expo або React Native CLI).",
        "Використати публічний API CoinGecko для отримання даних про криптовалюти.",
        "Відобразити список топ-20 криптовалют за ринковою капіталізацією.",
        "Реалізувати графік зміни ціни обраної криптовалюти.",
        "Реалізувати пошук монети за назвою або символом.",
        "Реалізувати додавання та зберігання списку обраних монет на пристрої.",
        "Розмістити вихідний код у публічному репозиторії GitHub.",
    ]
    for b in bullets:
        p = doc.add_paragraph(style=None)
        p.paragraph_format.left_indent = Cm(0.75)
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run("• " + b)
        set_font(r, size=14)


def build_impl_section(doc):
    add_heading(doc, "2. Опис реалізації")

    add_heading(doc, "2.1. Архітектура додатку", level=2)
    add_paragraph(
        doc,
        "Додаток побудований за патерном «екран + контекст»: бізнес-логіка обраного "
        "винесена у React-контекст FavoritesContext, мережеві виклики ізольовані в "
        "модулі src/api/coingecko.js, а кожен екран відповідає лише за презентацію "
        "та локальний UI-стан. Навігація реалізована через React Navigation: на верхньому "
        "рівні — стек (Main → Detail), на нижньому — нижні таби (Топ-20 / Пошук / Обране).",
    )
    add_paragraph(
        doc,
        "Дані з CoinGecko завантажуються через fetch без додаткових бібліотек. "
        "Помилки мережі та порожні стани оброблені на рівні кожного екрана. "
        "Список обраного зберігається у AsyncStorage під ключем "
        "«@crypto_monitor:favorites» і відновлюється під час холодного старту "
        "у провайдері FavoritesProvider.",
    )

    add_heading(doc, "2.2. Використані бібліотеки", level=2)
    libs = [
        ("expo ~51", "каркас та CLI"),
        ("react-native 0.74", "ядро рендера UI"),
        ("@react-navigation/native + native-stack + bottom-tabs", "навігація"),
        ("react-native-chart-kit + react-native-svg", "графік зміни ціни"),
        ("@react-native-async-storage/async-storage", "локальне сховище обраного"),
        ("@expo/vector-icons (Ionicons)", "іконки інтерфейсу"),
        ("react-native-safe-area-context", "врахування safe-area"),
    ]
    table = doc.add_table(rows=1, cols=2)
    table.style = "Light Grid Accent 1"
    hdr = table.rows[0].cells
    for c, txt in zip(hdr, ("Бібліотека", "Призначення")):
        c.text = ""
        r = c.paragraphs[0].add_run(txt)
        set_font(r, size=12, bold=True)
    for name, desc in libs:
        row = table.add_row().cells
        row[0].text = ""
        r = row[0].paragraphs[0].add_run(name)
        set_font(r, size=12, bold=True)
        row[1].text = ""
        r = row[1].paragraphs[0].add_run(desc)
        set_font(r, size=12)

    add_heading(doc, "2.3. Структура проєкту", level=2)
    structure = (
        "CryptoMonitor/\n"
        "├── App.js                  — точка входу: провайдери, тема, навігація\n"
        "├── app.json                — конфіг Expo\n"
        "├── package.json            — залежності та npm-скрипти\n"
        "└── src/\n"
        "    ├── api/coingecko.js    — клієнт API CoinGecko\n"
        "    ├── components/CoinListItem.js — рядок монети в списках\n"
        "    ├── context/FavoritesContext.js — стан обраного + AsyncStorage\n"
        "    ├── screens/HomeScreen.js     — топ-20 з pull-to-refresh\n"
        "    ├── screens/SearchScreen.js   — пошук з debounce 350 мс\n"
        "    ├── screens/FavoritesScreen.js — список обраних монет\n"
        "    ├── screens/DetailScreen.js   — деталі + графік + статистика\n"
        "    └── theme/colors.js     — кольори темної теми"
    )
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(structure)
    set_font(r, name="Consolas", size=11)

    add_heading(doc, "2.4. Ключові рішення", level=2)
    decisions = [
        "Debounce пошуку 350 мс через setTimeout — щоб не «спамити» API на кожному "
        "натисканні клавіші й не вийти за rate limit CoinGecko.",
        "Прорідження точок графіка до ~60 значень (sampledPrices у DetailScreen). "
        "При запиті 90 і 365 днів CoinGecko повертає тисячі точок, що уповільнює "
        "рендер; прорідження зберігає форму кривої при мінімальній кількості точок.",
        "Окремий ендпоінт для обраного — /coins/markets?ids=… замість послідовних "
        "запитів за кожною монетою, щоб одним викликом отримати актуальну ціну й "
        "зміну за 24 години для усіх збережених монет.",
        "Використання React Navigation useFocusEffect на екрані «Обране» — щоб ціни "
        "оновлювалися щоразу, коли користувач повертається на цей таб.",
        "Єдина темна тема з палітрою у src/theme/colors.js — узгоджені кольори "
        "у всіх компонентах та станах (позитивна/негативна зміна, обране).",
    ]
    for d in decisions:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.75)
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run("• " + d)
        set_font(r, size=14)


def build_screenshots_section(doc):
    add_heading(doc, "3. Скріншоти")
    any_added = False
    for i, (fname, caption) in enumerate(SCREENSHOTS, start=1):
        path = SCREENSHOTS_DIR / fname
        if not path.exists():
            placeholder = (
                f"[Місце для скріншота {i}: {fname}] — додайте файл у папку "
                f"./screenshots/ і перегенеруйте звіт."
            )
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(placeholder)
            set_font(r, size=12, color=RGBColor(0x80, 0x80, 0x80))
        else:
            any_added = True
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run()
            r.add_picture(str(path), width=Cm(14))
        cap = doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(12)
        run = cap.add_run(f"Рис. {i}. {caption}")
        set_font(run, size=12)
    if not any_added:
        add_paragraph(
            doc,
            "Скріншоти будуть додані після збірки додатку на цільовому пристрої.",
        )


def build_conclusions(doc):
    add_heading(doc, "4. Висновки")
    add_paragraph(
        doc,
        "У межах роботи реалізовано повнофункціональний мобільний додаток для моніторингу "
        "криптовалют на React Native (Expo). Усі поставлені вимоги виконано: "
        "список топ-20 криптовалют, графік зміни ціни з вибором часового інтервалу, "
        "пошук монет за назвою/символом, а також додавання й збереження обраних "
        "монет із локальним сховищем AsyncStorage.",
    )
    add_paragraph(
        doc,
        "Серед труднощів — узгодження peer-залежностей між react-native, react-native-web "
        "та react-dom при роботі через npm (вирішено прапорцем --legacy-peer-deps), а "
        "також обмеження безкоштовного rate limit публічного API CoinGecko, що "
        "вимагало введення debounce на пошуку та зменшення кількості точок у графіку.",
    )
    add_paragraph(
        doc,
        "У процесі виконання було освоєно: побудову багаторівневої навігації у "
        "React Navigation (стек поверх табів), роботу з React-контекстом для глобального "
        "стану, асинхронну персистентність через AsyncStorage, рендер графіків у "
        "React Native через react-native-chart-kit, а також практику безпечного "
        "виконання мережевих запитів і коректну обробку станів завантаження/помилки.",
    )


def build_repo(doc):
    add_heading(doc, "5. Посилання на репозиторій")
    add_paragraph(doc, "Вихідний код розміщено на GitHub:")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.5
    r = p.add_run(REPO_URL)
    set_font(r, size=14, bold=True, color=RGBColor(0x1F, 0x49, 0x8B))
    add_paragraph(
        doc,
        "README-файл репозиторію містить опис стеку, структуру проєкту, перелік "
        "використовуваних API-ендпоінтів CoinGecko та покрокову інструкцію запуску "
        "(npm install --legacy-peer-deps → npx expo start).",
    )


def main():
    doc = Document()
    style = doc.styles["Normal"]
    set_font(style.element.find(qn("w:rPr")) and style or style, size=14)
    style.font.name = "Times New Roman"
    style.font.size = Pt(14)

    build_title_page(doc)
    build_task_section(doc)
    build_impl_section(doc)
    build_screenshots_section(doc)
    build_conclusions(doc)
    build_repo(doc)

    doc.save(OUTPUT)
    print(f"Saved: {OUTPUT}")


if __name__ == "__main__":
    main()
