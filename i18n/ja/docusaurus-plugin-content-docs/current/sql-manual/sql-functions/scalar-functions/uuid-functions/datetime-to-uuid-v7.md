---
{
    "title": "DATETIME_TO_UUID_V7",
    "language": "ja",
    "description": "日時からネイティブの UUID v7 を生成します。入力が `NULL` の場合は `NULL` を返します。"
}
---

## 説明

日時からネイティブの UUID v7 を生成します。入力が `NULL` の場合は `NULL` を返します。

## エイリアス

`dateTimeToUUIDv7`。

## 使用上の注意

この関数は `UUID_V7()` とは別のカウンターを使用します。複数の BE にまたがるグローバルな順序は保証されず、日時を決定論的にエンコードするものでもありません。同じ入力が連続した際にカウンターがオーバーフローすると、エンコードされるタイムスタンプは一ミリ秒進みます。

## 構文

```sql
DATETIME_TO_UUID_V7(<datetime>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<datetime>` | DATETIME 型の値。小数秒を含めることができ、セッションの `time_zone` に基づいて解釈されます。 |

## 戻り値

`UUID` 型の値を返します。入力が `NULL`、無効な日付、または UTC に変換した結果が Unix エポックより前の日時の場合は、`NULL` を返します。ミリ秒未満の桁は切り捨てられます。この関数は非決定的であり、同じ日時で繰り返し呼び出しても、その都度新しい UUID を生成します。

## 例

```sql
SET time_zone = 'UTC';
SELECT UUID_VERSION(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6)))) AS version,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6))), 'UTC') AS restored;
```

```text
+---------+-------------------------+
| version | restored                |
+---------+-------------------------+
| 7       | 2026-09-10 12:34:56.789 |
+---------+-------------------------+
```

```sql
SET time_zone = 'UTC';
SELECT DATETIME_TO_UUID_V7(CAST(NULL AS DATETIME)) AS null_input,
       DATETIME_TO_UUID_V7(CAST('1969-12-31 23:59:59' AS DATETIME)) AS before_epoch,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('1970-01-01 00:00:00' AS DATETIME)), 'UTC') AS epoch;
```

```text
+------------+--------------+-------------------------+
| null_input | before_epoch | epoch                   |
+------------+--------------+-------------------------+
| NULL       | NULL         | 1970-01-01 00:00:00.000 |
+------------+--------------+-------------------------+
```
