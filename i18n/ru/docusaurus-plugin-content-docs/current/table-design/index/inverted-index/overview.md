---
{
    "title": "Инвертированный индекс (текстовый поиск)",
    "sidebar_label": "Обзор",
    "language": "ru",
    "description": "Текстовый поиск в Doris основан на инвертированных индексах и поддерживает полнотекстовый поиск, сопоставление фраз, поиск по регулярным выражениям, настраиваемую токенизацию и оценку релевантности BM25. Его можно сочетать с векторным поиском в сценариях гибридного поиска, например RAG."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

Текстовый поиск находит в наборе данных документы, содержащие заданные слова или фразы, и ранжирует результаты по релевантности.

| Способ поиска | Преимущество | Сценарии применения |
|----------|------|----------|
| Текстовый поиск | «Найти точно»: управляемое и объяснимое точное совпадение, обеспечивающее предсказуемое нахождение ключевых слов и применение условий фильтрации | Поиск по ключевым словам, сопоставление фраз, фильтрация с булевыми условиями |
| Векторный поиск | «Найти шире»: использует семантическое сходство для расширения охвата поиска | Семантический поиск, приближённое сопоставление |

В приложениях генеративного ИИ, особенно при генерации с дополнением из поиска (RAG), текстовый и векторный поиск дополняют друг друга:

- Сочетают широкий семантический охват с точностью совпадения слов
- Повышают полноту поиска, сохраняя точность и объяснимость результатов
- Вместе создают надёжную основу поиска, предоставляющую большим языковым моделям более точный и релевантный контекст

:::caution Начиная с версии 4.1.5 создание инвертированных индексов V1 запрещено

Для новых индексов используйте V2 или V3. Существующие таблицы с V1 остаются доступными для чтения, но добавлять в них инвертированные индексы или обновлять формат хранения индекса на месте с помощью `ALTER TABLE` нельзя; вместо этого пересоздайте таблицу. После обновления FE не сможет запуститься, если в его действующей конфигурации для `inverted_index_storage_format` по-прежнему указано `V1`. Заранее обновите `fe.conf` и `fe_custom.conf`. См. [«Обновление до 4.1.5»](../../../admin-manual/cluster-management/upgrade.md).

:::

## Развитие текстового поиска в Doris {#evolution-of-text-search-in-doris}

Начиная с версии 2.0.0 Doris поддерживает инвертированные индексы для быстрого полнотекстового поиска. По мере расширения сценариев поиска и усложнения запросов возможности текстового поиска в следующих версиях Doris продолжали развиваться.

| Этап | Версия | Основные возможности |
|------|------|----------|
| Базовые возможности | 2.0+ | Появились инвертированные индексы для отдельных столбцов, базовые операторы полнотекстового поиска (`MATCH_ANY`, `MATCH_ALL`) и токенизаторы для разных языков, обеспечивающие эффективный поиск по ключевым словам в больших наборах данных |
| Расширение функций | От 2.x до 3.x | Расширен набор операторов: добавлены сопоставление фраз (`MATCH_PHRASE`), поиск по префиксу фразы (`MATCH_PHRASE_PREFIX`) и поиск по регулярному выражению (`MATCH_REGEXP`); в версии 3.1 появилась настраиваемая токенизация |
| Расширение возможностей | 4.0+ | Появились оценка релевантности BM25 и функция `SEARCH` как единая точка входа для запросов, поддерживающие ранжирование по релевантности текста и гибридное ранжирование |

Ключевые улучшения версий 4.0+:

- **Оценка релевантности BM25**: функция `score()` ранжирует результаты по релевантности текста. Её оценки можно сочетать с оценками векторного сходства для гибридного ранжирования.
- **Функция SEARCH**: предоставляет единый язык запросов DSL с поддержкой поиска по нескольким столбцам и сочетания булевых условий. Это упрощает составление сложных запросов и дополнительно повышает их производительность.

---

## Основные возможности текстового поиска в Doris {#core-text-search-features-in-doris}

### 1. Разнообразные текстовые операторы {#1-rich-text-operators}

Doris предоставляет операторы полнотекстового поиска для различных способов поиска: от простого сопоставления ключевых слов до сложных запросов по фразам.

Основные операторы, поддерживаемые в текущей версии:

| Оператор | Описание | Типичные сценарии |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | Совпадение с любым словом (OR) или со всеми словами (AND) | Обычный поиск по ключевым словам |
| `MATCH_PHRASE` | Точное сопоставление фразы с возможностью настроить допустимое расстояние между словами (slop) и их порядок | Поиск слов, расположенных рядом |
| `MATCH_PHRASE_PREFIX` | Сопоставление по префиксу фразы | Автодополнение, поиск по мере ввода |
| `MATCH_REGEXP` | Сопоставление по регулярному выражению | Поиск текста по шаблону |

Эти операторы можно использовать отдельно или объединять с помощью функции `SEARCH()` для построения сложных логических запросов. Например:

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[Посмотреть все операторы](./search-operators.md)

---

### 2. Настраиваемая токенизация (3.1+) {#2-custom-tokenization-31}

При текстовом поиске способ токенизации напрямую влияет на точность и полноту результатов. Начиная с версии 3.1 Doris поддерживает **настраиваемые анализаторы**, позволяющие определить этапы токенизации в соответствии с потребностями приложения.

Для точной настройки обработки текста можно сочетать компоненты трёх типов:

- **Символьный фильтр (char_filter)**: заменяет, удаляет или нормализует символы перед токенизацией
- **Токенизатор (tokenizer)**: задаёт алгоритм токенизации. Поддерживаются, в частности, `standard`, `ngram`, `edge_ngram`, `keyword` и `icu` для обработки текстов на разных языках и с разной структурой
- **Фильтр токенов (token_filter)**: например, `lowercase`, `word_delimiter` и `ascii_folding`; используется для нормализации и уточнения результатов токенизации

```sql
-- Example: Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

-- Use the custom analyzer when creating a table
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[Подробнее о настраиваемой токенизации](./custom-analyzer.md)

---

### 3. Оценка релевантности BM25 (4.0+) {#3-bm25-relevance-scoring-40}

Doris реализует алгоритм **BM25 (Best Matching 25)** для вычисления релевантности текста, позволяя оценивать и ранжировать результаты полнотекстового поиска.

Основные свойства BM25:

- Вероятностная модель, учитывающая частоту слова (TF), обратную частоту документа (IDF) и длину документа
- Устойчивая работа как с короткими, так и с длинными текстами
- Возможность настройки весов с помощью параметров `k1` и `b`

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[Подробнее о механизме оценки](./scoring.md)

---

### 4. Функция SEARCH: единая точка входа для запросов (4.0+) {#4-search-function-unified-query-entry-point-40}

Функция `SEARCH()` предоставляет единый синтаксис текстового поиска с поддержкой поиска по нескольким столбцам и сочетания булевых условий, упрощая запись сложных запросов:

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[Полное руководство по функции SEARCH](./search-function.md)

---

## Быстрый старт {#quick-start}

### Шаг 1. Создайте таблицу с инвертированными индексами {#step-1-create-a-table-with-inverted-indexes}

```sql
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    category STRING,
    tags ARRAY<STRING>,
    created_at DATETIME,
    -- Text search indexes
    INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
    INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
    INDEX idx_category(category) USING INVERTED,
    INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### Шаг 2. Выполните текстовые запросы {#step-2-run-text-queries}

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full-text search';

-- Boolean query with SEARCH
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:database OR tags:ANY(sql nosql))');

-- Relevance-based ranking
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time analytics OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## Гибридный поиск: текст и векторы {#hybrid-search-text--vector}

В приложениях RAG сочетание текстового поиска и векторного сходства позволяет находить больше подходящих результатов:

```sql
-- Hybrid retrieval: semantic similarity + keyword filtering
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
    -- Vector filter for semantic similarity
    cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
    -- Text filter for keyword constraints
    AND SEARCH('title:search AND content:engine AND category:technology')
ORDER BY text_relevance DESC
LIMIT 10;
```

## Управление инвертированными индексами {#managing-inverted-indexes}

### Создание индекса {#create-an-index}

```sql
-- Create at table creation time
CREATE TABLE t (
    content STRING,
    INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- Create on an existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Compute-storage integrated mode: build the index for existing data
BUILD INDEX idx_content ON docs;
```

Начиная с Doris 4.2, для поиска по значениям JSON в столбце VARIANT можно использовать [индекс значений VARIANT](./variant-values-index.md). Создание индекса и работа с историческими данными описаны в руководстве.

#### Существующие данные в режиме разделения вычислений и хранения {#cloud-index-build}

В Doris 4.1.5 при добавлении инвертированного индекса с токенизацией, например приведённого выше индекса с `parser="chinese"`, исторические данные индексируются в рамках задачи изменения схемы. Дождитесь состояния `FINISHED`; отдельно выполнять `BUILD INDEX` для этого индекса не нужно:

```sql
SHOW ALTER TABLE COLUMN WHERE TableName = 'docs';
```

Для инвертированных индексов без токенизации (`parser="none"`) и индексов NGram BloomFilter значение по умолчанию `enable_add_index_for_new_data=false` также обеспечивает индексацию исторических данных при изменении схемы. Установите `true`, если хотите сначала добавить индекс для новых данных, а исторические данные проиндексировать отдельно. Выполните следующий пример в сеансе с доступной вычислительной группой:

```sql
CREATE TABLE cloud_index_example (
    id INT,
    tag VARCHAR(64)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO cloud_index_example VALUES (1, 'doris'), (2, 'database');
SET enable_add_index_for_new_data = true;
CREATE INDEX idx_tag ON cloud_index_example(tag)
USING INVERTED PROPERTIES("parser" = "none");
BUILD INDEX ON cloud_index_example;
SHOW BUILD INDEX WHERE TableName = 'cloud_index_example';
```

Построение выполняется асинхронно. Прежде чем рассчитывать, что исторические строки будут использовать индекс, дождитесь, пока `SHOW BUILD INDEX` сообщит о состоянии `FINISHED`. В синтаксисе облачного режима имя индекса опускается: команда `BUILD INDEX idx_tag ON cloud_index_example` будет отклонена. Эти инструкции для Doris 4.1.5 описывают существующие в этой версии форматы индексов, а не отдельный способ построения SNII в более новых ядрах.

### Удаление индекса {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### Просмотр индексов {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## Часто задаваемые вопросы {#inverted-index-faq}

### Поддерживает ли Doris 4.1.5 токенизацию японского текста и исправление опечаток? {#does-doris-415-support-japanese-tokenization-and-typo-tolerance}

В Doris 4.1.5 нет встроенного токенизатора Kuromoji. Проверьте работу парсера `icu` или `unicode` на репрезентативных японских текстах и изучите результат с помощью `TOKENIZE()`; их разбиение текста отличается от морфологического анализа Kuromoji. Прежде чем выбирать более новый парсер, сверьтесь с документацией для установленной версии.

[Операторы поиска](./search-operators.md) поддерживают сопоставление по префиксу, регулярному выражению и фразе с допустимым расстоянием между словами (slop). Они не исправляют опечатки на основе расстояния редактирования: слово с ошибкой не заменяется автоматически близкими словами из словаря.

## Дополнительные материалы {#further-reading}

### Основная документация {#core-documentation}

- [Операторы текстового поиска](./search-operators.md): полный справочник операторов и ускорение запросов
- [Функция SEARCH](./search-function.md): синтаксис единого языка запросов DSL и примеры
- [Оценка релевантности](./scoring.md): алгоритм ранжирования по релевантности и его использование

### Дополнительные темы {#advanced-topics}

- [Настраиваемый анализатор](./custom-analyzer.md): создание токенизаторов и фильтров для конкретной предметной области
- [Векторный поиск](../vector-index/overview.md): поиск по семантическому сходству с помощью векторов эмбеддингов
