---
{
    "title": "TOKENIZE",
    "language": "ru",
    "description": "Функция TOKENIZE разбивает строку на токены с помощью указанного анализатора и возвращает результаты токенизации в виде массива строк в формате JSON."
}
---

## Описание {#description}

Функция `TOKENIZE` разбивает строку на токены с помощью указанного анализатора и возвращает результаты токенизации в виде массива строк в формате JSON. Эта функция особенно полезна для понимания того, как будет анализироваться текст при использовании инвертированных индексов для полнотекстового поиска.

## Синтаксис {#syntax}

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

## Параметры {#parameters}

- `str`: Входная строка для токенизации. Тип: `VARCHAR`
- `properties`: Строка свойств, задающая конфигурацию анализатора. Тип: `VARCHAR`

Параметр `properties` поддерживает следующие пары «ключ-значение» (формат: `"key1"="value1", "key2"="value2"`):

### Общие свойства {#common-properties}

| Свойство | Описание | Примеры значений |
|----------|-------------|----------------|
| `built_in_analyzer` | Тип встроенного анализатора | `"english"`, `"chinese"`, `"kuromoji"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | Имя пользовательского анализатора (созданного с помощью `CREATE INVERTED INDEX ANALYZER`) | `"my_custom_analyzer"` |
| `parser_mode` | Режим разбора. Для `chinese` определяет степень детализации сегментации; для `kuromoji` задаёт режим сегментации японского текста | chinese: `"fine_grained"`, `"coarse_grained"`; kuromoji: `"search"` (по умолчанию), `"normal"`, `"extended"` |
| `support_phrase` | Включение поддержки фраз (сохранение информации о позициях) | `"true"`, `"false"` |
| `lower_case` | Преобразование токенов в нижний регистр | `"true"`, `"false"` |
| `char_filter_type` | Тип символьного фильтра | Зависит от фильтра |
| `stop_words` | Настройка стоп-слов | Зависит от реализации |

## Возвращаемое значение {#return-value}

Возвращает значение типа `VARCHAR`, содержащее массив JSON с результатами токенизации. Каждый элемент массива представляет собой объект со следующей структурой:

- `token`: Терм, полученный при токенизации
- `position`: (Необязательно) Индекс позиции токена, если включён параметр `support_phrase`

## Примеры {#examples}

### Пример 1: Использование встроенных анализаторов {#example-1-using-built-in-analyzers}

```sql
-- Using the standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- Using the english analyzer
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- Using the unicode analyzer with Chinese text
SELECT TOKENIZE("Apache Doris数据库", '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- Using the chinese analyzer
SELECT TOKENIZE("我来到北京清华大学", '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Using the icu analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, {"token": "世界"}]
```

```sql
-- Using the basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, {"token": "hm"}, {"token": "bg"}, {"token": "jpg"}, {"token": "http"}, {"token": "1"}, {"token": "0"}]
```

```sql
-- Using the ik analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

```sql
-- Using the kuromoji analyzer for Japanese text (supported since Doris 5.0.0)
-- In the default search mode, the compound noun is also broken into its parts
SELECT TOKENIZE("関西国際空港", '"built_in_analyzer"="kuromoji"');
```
```
[{ "token": "関西" }, { "token": "国際" }, { "token": "空港" }]
```

### Пример 2: Использование пользовательских анализаторов {#example-2-using-custom-analyzers}

Сначала создайте пользовательский анализатор:

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```

Затем используйте его с функцией `TOKENIZE`:

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```

### Пример 3: Поддержка фраз (информация о позициях) {#example-3-with-phrase-support-position-information}

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

## Примечания {#notes}

1. **Настройка анализатора**: Параметр `properties` должен содержать корректную строку свойств. Пользовательский анализатор необходимо предварительно создать с помощью `CREATE INVERTED INDEX ANALYZER`.

2. **Поддерживаемые анализаторы**: В настоящее время поддерживаются следующие встроенные анализаторы:
   - `standard`: Стандартный анализатор для текстов общего назначения
   - `english`: Анализатор английского языка со стеммингом
   - `chinese`: Анализатор китайского текста
   - `kuromoji`: Морфологический анализатор японского языка (`parser_mode`: `search`, `normal`, `extended`). Поддерживается начиная с Doris 5.0.0 и по умолчанию отключён. Для его использования задайте `enable_kuromoji_analyzer = true` в `be.conf`.
   - `unicode`: Анализатор на основе Unicode для многоязычного текста
   - `icu`: Анализатор на основе ICU для расширенной обработки Unicode
   - `basic`: Базовая токенизация
   - `ik`: Анализатор IK для китайского текста
   - `none`: Без токенизации (возвращает исходную строку как один токен)

3. **Производительность**: Функция `TOKENIZE` предназначена прежде всего для тестирования и отладки конфигураций анализаторов. Для полнотекстового поиска в рабочей среде используйте инвертированные индексы с операторами `MATCH` или `SEARCH`.

4. **Вывод в формате JSON**: Результат представляет собой отформатированную строку JSON, которую при необходимости можно дополнительно обработать с помощью функций JSON.

5. **Совместимость с инвертированными индексами**: Конфигурацию анализатора, используемую в `TOKENIZE`, можно также применить к инвертированным индексам при создании таблиц:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```

6. **Проверка поведения анализатора**: Используйте `TOKENIZE` перед созданием инвертированных индексов, чтобы увидеть, как текст будет разбит на токены, и выбрать наиболее подходящий анализатор для ваших данных.

## Связанные функции {#related-functions}

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): Полнотекстовый поиск с использованием инвертированных индексов
- [SEARCH](../../../../table-design/index/inverted-index/search-function.md): Расширенный поиск с поддержкой DSL

## Ключевые слова {#keywords}

TOKENIZE, STRING, ПОЛНОТЕКСТОВЫЙ ПОИСК, ИНВЕРТИРОВАННЫЙ ИНДЕКС, АНАЛИЗАТОР
