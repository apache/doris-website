---
{
    "title": "MEDIAN",
    "language": "ja",
    "description": "MEDIAN 関数は式の中央値を返します。percentile(expr, 0.5) と同等です。"
}
---

## 説明

MEDIAN 関数は式の中央値を返します。percentile(expr, 0.5) と同等です。

## 構文

```sql
MEDIAN(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 中央値を計算する式。Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt 型をサポートします。 |

## 戻り値

入力式と同じデータ型を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例

```sql
-- setup
create table log_statis(
    datetime datetime,
    scan_rows int
) distributed by hash(datetime) buckets 1
properties ("replication_num"="1");
insert into log_statis values
    ('2025-08-25 10:00:00', 10),
    ('2025-08-25 10:00:00', 50),
    ('2025-08-25 10:00:00', 100),
    ('2025-08-25 11:00:00', 20),
    ('2025-08-25 11:00:00', 30),
    ('2025-08-25 11:00:00', 40);
```

```sql
select datetime, median(scan_rows) from log_statis group by datetime;
```

```text
select datetime, median(scan_rows) from log_statis group by datetime;
+---------------------+-------------------+
| datetime            | median(scan_rows) |
+---------------------+-------------------+
| 2025-08-25 10:00:00 |                50 |
| 2025-08-25 11:00:00 |                30 |
+---------------------+-------------------+
```

```sql
select median(scan_rows) from log_statis where scan_rows is null;
```

```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```
