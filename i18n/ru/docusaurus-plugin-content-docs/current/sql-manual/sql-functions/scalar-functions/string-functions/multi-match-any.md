---
{
    "title": "MULTI_MATCH_ANY",
    "language": "ru",
    "description": "Проверяет, соответствует ли строка хотя бы одному регулярному выражению из массива."
}
---

<a id="multi_match_any"></a>

## Описание {#description}

Проверяет, соответствует ли `<haystack>` хотя бы одному регулярному выражению из `<patterns>`. По умолчанию сопоставление выполняется с учётом регистра. Возвращает `0` вместо `NULL`, если любой из аргументов равен `NULL`.

## Синтаксис {#syntax}

```sql
MULTI_MATCH_ANY(<haystack>, <patterns>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<haystack>` | Входная строка типа `STRING`. |
| `<patterns>` | Регулярные выражения типа `ARRAY<STRING>`. Элементы массива шаблонов должны быть строками, отличными от NULL. |

## Возвращаемое значение {#return-value}

Возвращает `TINYINT`: `1`, если найдено соответствие хотя бы одному выражению, иначе `0`. Возвращает `0` для пустого массива шаблонов, а также если любой из аргументов равен `NULL`.

Эта функция использует движок регулярных выражений Hyperscan/VectorScan. Некорректные или неподдерживаемые шаблоны приводят к ошибке. Константную входную строку нельзя использовать вместе с неконстантным столбцом массивов шаблонов; такое сочетание приводит к ошибке аргументов.

## Пример {#example}

```sql
SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', ['A', 'bcd']) AS matched;
```

```text
0
```

Регулярные выражения выполняют сопоставление с шаблоном, а не поиск буквальной подстроки:

```sql
SELECT multi_match_any('abc123', ['[0-9]+', '^xyz']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', CAST([] AS ARRAY<STRING>)) AS empty_patterns,
       multi_match_any(CAST(NULL AS STRING), ['a']) AS null_text,
       multi_match_any('abc', CAST(NULL AS ARRAY<STRING>)) AS null_patterns;
```

```text
0    0    0
```

## Ключевые слова {#keywords}

MULTI_MATCH, MATCH, ANY
