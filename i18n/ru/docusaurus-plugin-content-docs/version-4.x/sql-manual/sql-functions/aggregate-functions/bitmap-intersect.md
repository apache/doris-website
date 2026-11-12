---
{
    "title": "BITMAP_INTERSECT",
    "language": "ru",
    "description": "Используется для вычисления пересечения сгруппированных Bitmap. Типичный сценарий использования: расчёт удержания пользователей."
}
---

## Описание {#description}

Используется для вычисления пересечения сгруппированных Bitmap. Типичный сценарий использования: расчёт удержания пользователей.

## Синтаксис {#syntax}

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## Аргументы {#arguments}

| Аргумент | Описание |
| -- | -- |
| `<value>` | Тип данных с поддержкой Bitmap |

## Возвращаемое значение {#return-value}

Возвращает значение типа Bitmap. Если в группе нет допустимых данных, возвращает NULL.

## Пример {#example}

```sql
-- setup
CREATE TABLE user_tags (
	tag VARCHAR(20),
	date DATETIME,
	user_id BITMAP bitmap_union
) AGGREGATE KEY(tag, date) DISTRIBUTED BY HASH(tag) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO user_tags VALUES
	('A', '2020-05-18', to_bitmap(1)),
	('A', '2020-05-18', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(3)),
	('B', '2020-05-18', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(5));
```

```sql
select tag, bitmap_to_string(bitmap_intersect(user_id)) from (
	select tag, date, bitmap_union(user_id) user_id from user_tags where date in ('2020-05-18', '2020-05-19') group by tag, date
) a group by tag;
```

Запрос рассчитывает удержание пользователей по разным тегам между вчерашним и сегодняшним днём.

```text
+------+---------------------------------------------+
| tag  | bitmap_to_string(bitmap_intersect(user_id)) |
+------+---------------------------------------------+
| A    | 2                                           |
| B    | 4                                           |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_intersect(user_id)) from user_tags where tag is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(bitmap_intersect(user_id)) |
+---------------------------------------------+
|                                             |
+---------------------------------------------+
```
