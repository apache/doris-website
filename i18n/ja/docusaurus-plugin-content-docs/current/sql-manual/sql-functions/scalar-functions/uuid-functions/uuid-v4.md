---
{
    "title": "UUID_V4",
    "language": "ja",
    "description": "ネイティブの UUID 型でランダムなバージョン 4 UUID を生成します。別名があり、列のデフォルト値として行ごとに生成できます。"
}
---

## 説明

ネイティブの UUID 型でバージョン 4 UUID を生成します。バージョン 4 ではランダムな値を使用します。

## 別名

`GENERATE_UUID_V4`、`GENERATEUUIDV4`。

## 使用上の注意

各行に対して独立した値を生成します。引数を取らないため、`NULL` を渡すことはできません。`CREATE TABLE` では UUID 列の動的なデフォルト値として使用できますが、`ALTER TABLE ADD COLUMN` ではこの動的なデフォルト値をサポートしていません。[UUID 型](../../../basic-element/sql-data-types/uuid.md)を参照してください。

## 構文

```sql
UUID_V4()
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| なし | 引数を取りません。 |

## 戻り値

`UUID` 型の値を返し、`NULL` にはなりません。値は、英字が小文字の 36 文字の標準形式で表示されます。

## 例

```sql
SELECT UUID_VERSION(UUID_V4()) AS version,
       LENGTH(CAST(UUID_V4() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 4       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V4()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV4()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 4             | 4                     |
+---------------+-----------------------+
```
