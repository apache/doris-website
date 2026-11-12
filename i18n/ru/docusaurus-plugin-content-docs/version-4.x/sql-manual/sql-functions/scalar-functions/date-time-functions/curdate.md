---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "ru",
    "description": "Возвращает текущую дату в виде значения типа DATE."
}
---

## Описание {#description}

Возвращает текущую дату в виде значения типа DATE.

Эта функция соответствует [функции curdate](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate) в MySQL.

## Псевдонимы {#aliases}

- current_date

## Синтаксис {#syntax}

```sql
CURDATE()
```

## Возвращаемое значение {#return-value}

Текущая дата. Возвращаемое значение имеет тип DATE.

## Примеры {#examples}

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
