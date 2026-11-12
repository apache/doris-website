---
{
    "title": "URL_DECODE",
    "language": "ru",
    "description": "Преобразует URL в декодированную строку."
}
---

## Описание {#description}

Преобразует URL в декодированную строку.

## Синтаксис {#syntax}

```sql
URL_DECODE( <str> )
```

## Обязательные параметры {#required-parameters}
| Параметры | Описание |
|------|------|
| `<str>` | Строка для декодирования. Если URL имеет нестроковый тип. |

##  Возвращаемое значение {#return-value}

Декодированное значение

##  Пример {#example}

Декодирование URL с процентным кодированием: `%3A` → `:`, `%2F` → `/`.

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```

```text
+-------------------------------------------------------------------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+-------------------------------------------------------------------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+-------------------------------------------------------------------------------------------------------------+
```

Декодирование строки в формате `application/x-www-form-urlencoded`: `+` → пробел, `%26` → `&`.

```sql
select url_decode('Doris+Q%26A');
```

```text
+---------------------------+
| url_decode('Doris+Q%26A') |
+---------------------------+
| Doris Q&A                 |
+---------------------------+
```
