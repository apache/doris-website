---
{
    "title": "UUID_V7",
    "language": "ja",
    "description": "ミリ秒単位のタイムスタンプを含むネイティブ型の UUID v7 を生成します。別名、列のデフォルト値、順序に関する制約についても説明します。"
}
---

## 説明

ネイティブの UUID 型でバージョン 7 の UUID を生成します。バージョン 7 にはミリ秒単位の Unix タイムスタンプが含まれており、生成時刻を基準におおむね並べ替えられる識別子に適しています。

## 別名

`GENERATE_UUID_V7`、`GENERATEUUIDV7`。

## 使用上の注意

各行に対して独立した値を生成します。引数を取らないため、`NULL` を渡すことはできません。`CREATE TABLE` では UUID 列の動的なデフォルト値として使用できますが、`ALTER TABLE ADD COLUMN` ではこの動的なデフォルト値はサポートされません。[UUID 型](../../../basic-element/sql-data-types/uuid.md)を参照してください。

生成処理では、各 BE プロセス内で増加するタイムスタンプとカウンターを使用します。BE 間での生成順序は保証されません。時計の巻き戻りやカウンターのオーバーフローにより、UUID に記録されたタイムスタンプが実際の時刻より先になる場合があります。正確なイベント時刻やグローバルな連番として使用しないでください。

## 構文

```sql
UUID_V7()
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| なし | 引数を取りません。 |

## 戻り値

`UUID` 型の値を返し、`NULL` は返しません。値は 36 文字の小文字による標準形式で表示されます。

## 例

```sql
SELECT UUID_VERSION(UUID_V7()) AS version,
       LENGTH(CAST(UUID_V7() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 7       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V7()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV7()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 7             | 7                     |
+---------------+-----------------------+
```
