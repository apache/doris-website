---
{
    "title": "Пользовательский Normalizer",
    "language": "ru",
    "description": "Руководство по пользовательским Normalizer для инвертированных индексов Doris: обработка всего текста как одного токена и поддержка сценариев точного сопоставления ключевых слов с преобразованием регистра и нормализацией диакритических знаков."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenario: Keyword exact match / Standardization preprocessing without tokenization -->

Пользовательский Normalizer выполняет единообразную предварительную обработку текста. Он **не разбивает текст**, а обрабатывает его целиком как один токен. Сочетая фильтры символов (`char_filter`) и фильтры токенов (`token_filter`), он поддерживает преобразование регистра, нормализацию символов и аналогичные операции. Его обычно используют там, где требуется нормализация без токенизации, например при поиске по ключевым словам.

**Различия между Normalizer и Analyzer**

| Критерий сравнения | Normalizer | Analyzer |
| --- | --- | --- |
| Разбиение текста | Нет, весь текст представляет собой один токен | Да, текст разбивается на несколько токенов по заданным правилам |
| Типичный сценарий | Точное сопоставление ключевых слов (например, кодов товаров, идентификаторов) | Полнотекстовый поиск (например, по тексту статьи) |
| Часто используемые фильтры | lowercase, ascii_folding и другие | tokenizer + различные фильтры |

## Сценарии использования {#applicable-scenarios}

- **Поиск по ключевым словам**: поля с кодами товаров, названиями товаров и идентификаторами пользователей, для которых не требуется токенизация, но нужен единый формат.
- **Сопоставление без учёта регистра**: значения `ProductA` и `producta` считаются одинаковыми.
- **Нормализация диакритических знаков и специальных символов**: преобразование `Café` в `cafe` позволяет избежать пропущенных совпадений из-за различий в символах.

## Порядок использования {#usage-workflow}

Полный процесс состоит из трёх шагов:

1. (Необязательно) Создайте пользовательские `char_filter` и `token_filter`.
2. Создайте пользовательский Normalizer, объединяющий указанные выше фильтры.
3. Укажите Normalizer в операторе создания таблицы через свойство инвертированного индекса.

### Шаг 1: создание пользовательских фильтров (необязательно) {#step-1-create-custom-filters-optional}

Если встроенные фильтры не отвечают вашим требованиям, сначала можно создать пользовательские фильтры.

> Подробнее о создании `char_filter` и `token_filter` см. в документе [Пользовательский Analyzer](./custom-analyzer.md).

### Шаг 2: создание пользовательского Normalizer {#step-2-create-a-custom-normalizer}

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
    "char_filter" = "x_char_filter",          -- Optional, one or more character filters
    "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```

**Описание параметров**

| Параметр | Обязательный | Описание |
| --- | --- | --- |
| `char_filter` | Нет | Имена одного или нескольких фильтров символов, разделённые запятыми |
| `token_filter` | Нет | Имена одного или нескольких фильтров токенов, выполняемых в указанном порядке |

### Шаг 3: указание Normalizer в операторе создания таблицы {#step-3-reference-the-normalizer-in-the-table-creation-statement}

В свойствах инвертированного индекса используйте `normalizer`, чтобы указать нужный Normalizer.

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

:::caution Примечание
`normalizer` и `analyzer` взаимно исключают друг друга и не могут быть указаны одновременно в одном индексе.
:::

## Управление пользовательскими Normalizer {#managing-custom-normalizers}

| Операция | Оператор SQL |
| --- | --- |
| Просмотр | `SHOW INVERTED INDEX NORMALIZER;` |
| Удаление | `DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;` |

## Полный пример: игнорирование регистра и диакритических знаков {#complete-example-ignore-case-and-accent-marks}

**Сценарий**: поле с названием товара должно поддерживать точное сопоставление без учёта регистра и диакритических знаков (например, `Café-Products` и `cafe-products` считаются одинаковыми значениями).

**Шаги реализации**:

1. Создайте пользовательский фильтр токенов `my_ascii_folding` для удаления диакритических знаков.
2. Создайте Normalizer `lowercase_ascii_normalizer`, который объединяет встроенный фильтр `lowercase` с фильтром `my_ascii_folding` из предыдущего шага.
3. Создайте таблицу и примените Normalizer к полю `product_name`.
4. Проверьте результат нормализации с помощью функции `tokenize`.

**Пример SQL**:

```sql
-- 1. Create a custom token filter (when specific parameters are needed)
--    Here, create an ascii_folding filter
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
--    Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use the normalizer when creating a table
CREATE TABLE product_table (
    `id` bigint NOT NULL,
    `product_name` text NULL,
    INDEX idx_name (`product_name`) USING INVERTED PROPERTIES("normalizer" = "lowercase_ascii_normalizer")
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 4. Verification test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

**Ожидаемый результат**:

```json
[
    {"token":"cafe-products"}
]
```

Как видно из результата, `Café-Products` обрабатывается как один токен без разбиения; при этом выполняются преобразование в нижний регистр и удаление диакритических знаков.

## Ограничения {#limitations}

1. Фильтры, имена которых указаны в `char_filter` и `token_filter`, должны существовать: быть встроенными или созданными ранее.
2. Normalizer можно удалить, только если его не использует ни одна таблица.
3. Удалить `char_filter` или `token_filter` можно, только если на него не ссылается ни один Normalizer.
4. После выполнения оператора, задающего пользовательский Normalizer, синхронизация с BE занимает около 10 секунд. К данным, загруженным после этого, Normalizer применяется корректно.
5. `normalizer` и `analyzer` нельзя указывать одновременно в одном инвертированном индексе.
