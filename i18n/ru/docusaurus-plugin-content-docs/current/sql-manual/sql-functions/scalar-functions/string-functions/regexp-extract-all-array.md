---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "ru",
    "description": "Извлекает все совпадения первой группы захвата в виде массива строк."
}
---

<version since="dev">

</version>

## Описание {#description}

Извлекает все непересекающиеся совпадения первой группы захвата в `<pattern>` из `<str>` и возвращает массив строк в порядке совпадений. Возвращает `NULL`, если хотя бы один из аргументов равен `NULL`.

## Синтаксис {#syntax}

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<str>` | Входная строка типа `STRING`. |
| `<pattern>` | Регулярное выражение типа `STRING`. Извлекается первая группа захвата; третий аргумент с индексом группы не поддерживается. |

## Возвращаемое значение {#return-value}

Возвращает `ARRAY<STRING>`. Возвращает пустой массив `[]`, если нет совпадений или группы захвата. Возвращает `NULL`, если хотя бы один из аргументов равен `NULL`. Некорректное регулярное выражение вызывает ошибку.

По умолчанию движок использует синтаксис RE2 и учитывает регистр при поиске совпадений. Переменная сеанса `enable_extended_regex` включает расширенные возможности регулярных выражений; см. [REGEXP_EXTRACT_ALL](./regexp-extract-all.md). Эта функция возвращает массив, а `REGEXP_EXTRACT_ALL` возвращает форматированную строку.

## Пример {#example}

```sql
SELECT regexp_extract_all_array('id=12,id=34', 'id=([0-9]+)') AS result;
```

```text
["12", "34"]
```

Используйте `(?i)` для поиска совпадений без учёта регистра:

```sql
SELECT regexp_extract_all_array('Hello hello HELLO', '(?i)(hello)') AS result;
```

```text
["Hello", "hello", "HELLO"]
```

```sql
SELECT regexp_extract_all_array('abc', '([0-9]+)') AS no_match,
       regexp_extract_all_array('abc', 'abc') AS no_capture_group;
```

```text
[]    []
```

```sql
SELECT regexp_extract_all_array(NULL, '(a)') AS null_input,
       regexp_extract_all_array('a', NULL) AS null_pattern;
```

```text
NULL    NULL
```

Результат можно передать непосредственно в функции для работы с массивами:

```sql
SELECT array_size(regexp_extract_all_array('a1b2', '([0-9])')) AS matches;
```

```text
2
```
