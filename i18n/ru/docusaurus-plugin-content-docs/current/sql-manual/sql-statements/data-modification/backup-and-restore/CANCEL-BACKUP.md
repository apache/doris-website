---
{
    "title": "CANCEL BACKUP",
    "language": "ru",
    "description": "Этот оператор используется для отмены выполняемой задачи BACKUP."
}
---

## Описание {#description}

Этот оператор используется для отмены выполняемой задачи BACKUP.

## Синтаксис {#syntax}

```sql
CANCEL BACKUP FROM <db_name>;
```

## Параметры {#parameters}

**1.`<db_name>`**

Имя базы данных, к которой относится задача резервного копирования.

## Пример {#example}

1. Отменить задачу BACKUP в базе данных example_db.

```sql
CANCEL BACKUP FROM example_db;
```
