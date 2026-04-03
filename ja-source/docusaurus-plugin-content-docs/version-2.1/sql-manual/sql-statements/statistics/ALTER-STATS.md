---
{
  "title": "ALTER STATS",
  "language": "ja",
  "description": "指定されたテーブルの指定されたカラムのstatisticsを手動で変更します。「Statistics」の章を参照してください。"
}
---
## 説明

指定されたテーブルの指定された列の統計情報を手動で変更します。「Statistics」の章を参照してください。

## 構文

```sql
ALTER TABLE <table_name>
  [ INDEX <index_name> ]
  MODIFY COLUMN <column_name>
  SET STATS (<column_stats>)
```
ここで：

```sql
column_stats
  : -- column stats value
  ("key1" = "value1", "key2" = "value2" [...])
```
# 必須パラメータ

**<table_name>**

> テーブルの識別子（つまり名前）を指定します。

**<column_name>**

> カラムの識別子（つまり名前）を指定します。<index_name>が指定されていない場合は、ベーステーブルのカラム名になります。

**<column_stats>**

> 設定する統計値を key = value の形式で指定します。keyとvalueの両方を引用符で囲む必要があり、key-valueペアはカンマで区切られます。設定可能な統計情報は以下の通りです：

> row_count、行の総数

> ndv、カラムのカーディナリティ

> num_nulls、カラム内のnull値の数

> data_size、カラムの総サイズ

> min_value、カラムの最小値

> max_value、カラムの最大値

> この中で、row_countは必須で指定する必要があり、その他の属性は任意です。設定されていない場合、そのカラムの対応する統計属性値は空になります。

# オプションパラメータ

**<index_name>**

> 同期マテリアライズドビュー（「同期マテリアライズドビュー」の章を参照してください）の識別子（つまり名前）。テーブルには0個から複数のマテリアライズドビューを持つことができます。マテリアライズドビュー内のカラムの統計情報を設定する必要がある場合は、<index_name>を使用してマテリアライズドビューの名前を指定する必要があります。指定されていない場合は、ベーステーブル内のカラムのプロパティが設定されます。

# アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :--------- | :----- | :---- |
| ALTER_PRIV | Table |       |

# 使用上の注意

ユーザーがテーブルに手動で統計情報を注入した後、そのテーブルは統計情報の自動収集（「統計情報の自動収集」の章を参照してください）の対象から外れ、ユーザーが手動で注入した統計情報が上書きされることを回避します。注入した統計情報が不要になった場合は、drop stats文を使用して既に注入された情報を削除することができ、これによりテーブルの自動収集を再び有効にすることができます。

# 例

- partテーブルのp_partkeyカラムに統計情報を注入します（index_nameが指定されていないため、ベーステーブルのカラム）。

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
- part テーブルの index1 マテリアライズドビューの col1 列に統計情報をインジェクトします（index_name が指定されているため、マテリアライズドビュー列）。

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
