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
| `<str>` | Строка для декодирования. Если URL не имеет строкового типа. |

##  Возвращаемое значение {#return-value}

Декодированное значение

##  Пример {#example}

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```
```text
+------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+------------------------------------------------+
```
