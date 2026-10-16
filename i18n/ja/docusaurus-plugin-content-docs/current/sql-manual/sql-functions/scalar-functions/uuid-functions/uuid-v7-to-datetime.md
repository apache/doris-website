---
{
    "title": "UUID_V7_TO_DATETIME",
    "language": "ja",
    "description": "UUID v7 から Unix 時間のミリ秒単位のタイムスタンプを取り出し、指定したタイムゾーンの日時に変換します。入力が `NULL` の場合は `NULL` を返します。"
}
---

## 説明

UUID v7 から Unix 時間のミリ秒単位のタイムスタンプを取り出し、指定したタイムゾーンの日時に変換します。入力が `NULL` の場合は `NULL` を返します。

## 別名

`UUIDv7ToDateTime`。

## 構文

```sql
UUID_V7_TO_DATETIME(<uuid> [, <time_zone>])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<uuid>` | UUID 型の値。 |
| `<time_zone>` | 省略可能な定数文字列。例: `UTC`、`Asia/Shanghai`、`+08:00`。省略時はセッションの `time_zone` を使用します。値が行ごとに異なるタイムゾーン列は指定できません。無効なタイムゾーンを指定するとエラーになります。 |

## 戻り値

戻り値の型は `DATETIME(3)` です。UUID または明示的に指定したタイムゾーンが `NULL` の場合、あるいは変換後の日時が DATETIME の範囲外となる場合は `NULL` を返します。バージョンフィールドが 7 でない場合は、`NULL` ではなく、Unix エポック（1970-01-01 00:00:00 UTC）を指定したタイムゾーンに変換して返します。UUID のバリアントビットは検証しません。

## 例

```sql
SET time_zone = 'UTC';
SELECT UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID)) AS session_time,
       UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID), 'Asia/Shanghai') AS shanghai_time;
```

```text
+-------------------------+-------------------------+
| session_time            | shanghai_time           |
+-------------------------+-------------------------+
| 1970-01-01 00:00:00.001 | 1970-01-01 08:00:00.001 |
+-------------------------+-------------------------+
```

```sql
SELECT UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), 'UTC') AS non_v7,
       UUID_V7_TO_DATETIME(CAST(NULL AS UUID), 'UTC') AS null_input,
       UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), NULL) AS null_zone,
       UUID_V7_TO_DATETIME(CAST('ffffffff-ffff-7000-8000-000000000000' AS UUID), 'UTC') AS out_of_range;
```

```text
+-------------------------+------------+-----------+--------------+
| non_v7                  | null_input | null_zone | out_of_range |
+-------------------------+------------+-----------+--------------+
| 1970-01-01 00:00:00.000 | NULL       | NULL      | NULL         |
+-------------------------+------------+-----------+--------------+
```
