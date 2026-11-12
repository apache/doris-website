---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "ru",
    "description": "В основном используется для объединения значений нескольких bitmap и выполнения побитовой операции xor над результатами."
}
---

## Описание {#description}

В основном используется для объединения значений нескольких bitmap и выполнения побитовой операции xor над результатами.

## Синтаксис {#syntax}

```sql
GROUP_BITMAP_XOR(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Поддерживаемые типы данных bitmap |

## Возвращаемое значение {#return-value}

Тип возвращаемого значения: BITMAP. Если в группе нет допустимых данных, возвращается NULL.

## Пример {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
	page varchar(10),
	user_id BITMAP
) DISTRIBUTED BY HASH(page) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	('m', to_bitmap(4)),
	('m', to_bitmap(7)),
	('m', to_bitmap(8)),
	('m', to_bitmap(1)),
	('m', to_bitmap(3)),
	('m', to_bitmap(6)),
	('m', to_bitmap(15)),
	('m', to_bitmap(4)),
	('m', to_bitmap(7));
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+---------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(user_id)) |
+------+---------------------------------------------+
| m    | 1,3,6,8,15                                  |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap where page is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(group_bitmap_xor(user_id)) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```
