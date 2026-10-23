---
{
    "title": "INTERSECT_COUNT",
    "language": "ru",
    "description": "Вычисляет пересечение двух или более bitmap. Использование: intersectcount(bitmapcolumntocount, filtercolumn, filtervalues ..."
}
---

## Описание {#description}

Вычисляет пересечение двух или более bitmap.
Использование: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
Пример: intersect_count(user_id, event, 'A', 'B', 'C'), то есть подсчёт количества user_id в пересечении всех 3 bitmap для A/B/C.
Вычисляет количество элементов в пересечении bitmap из bitmap_column, для которых значение column_to_filter входит в filter_values, то есть количество элементов в пересечении bitmap.

## Синтаксис {#syntax}

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## Параметры {#parameters}

| Параметр         | Описание                                      |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | Входной столбец с данными bitmap. Поддерживаемые типы: Bitmap. |
| `<column_to_filter>` | Столбец измерения, используемый для фильтрации. Поддерживаемые типы: TinyInt, SmallInt, Integer, BigInt, LargeInt. |
| `<filter_values>`  | Различные значения, используемые для фильтрации столбца измерения. Поддерживаемые типы: TinyInt, SmallInt, Integer, BigInt, LargeInt. |


## Возвращаемое значение {#return-value}

Возвращает количество элементов в пересечении заданных bitmap.

## Пример {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
	dt INT,
	user_id BITMAP,
	city STRING
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	(20250801, to_bitmap(1), 'beijing'),
	(20250801, to_bitmap(2), 'beijing'),
	(20250801, to_bitmap(3), 'shanghai'),
	(20250802, to_bitmap(3), 'beijing'),
	(20250802, to_bitmap(4), 'shanghai'),
	(20250802, to_bitmap(5), 'shenzhen');
```

```sql
select intersect_count(user_id,dt,20250801) from pv_bitmap;
```

```text
+--------------------------------------+
| intersect_count(user_id,dt,20250801) |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```
