---
{
    "title": "DOMAIN_WITHOUT_WWW",
    "language": "ru",
    "description": "Извлекает доменное имя без префикса www из строки URL"
}
---

## Описание {#description}

Извлекает доменное имя без префикса www из строки URL

## Синтаксис {#syntax}

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|----------------------|
| `<url>`   | Строка `URL`, из которой нужно извлечь доменное имя без префикса www |

## Возвращаемое значение {#return-value}

Доменное имя из параметра `<url>` без префикса www

```sql
SELECT DOMAIN_WITHOUT_WWW("https://www.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+---------------------------------------------------------------------------------------+
| domain_without_www('https://www.apache.org/docs/gettingStarted/what-is-apache-doris') |
+---------------------------------------------------------------------------------------+
| apache.org                                                                            |
+---------------------------------------------------------------------------------------+
```
