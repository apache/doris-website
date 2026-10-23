---
{
    "title": "SHOW CREATE REPOSITORY",
    "language": "ru",
    "description": "Эта команда выводит инструкцию создания репозитория."
}
---

## Описание {#description}

Эта команда выводит инструкцию создания репозитория.

## Синтаксис {#syntax}

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```

## Обязательные параметры {#required-parameters}
**<repo_name>**
> Уникальное имя репозитория.

## Примеры {#examples}

Вывести инструкцию создания указанного репозитория

```sql
SHOW CREATE REPOSITORY for test_repository;
```
