---
{
  "title": "ALTER STATS",
  "language": "ja",
  "description": "指定されたテーブルの指定された列のstatisticsを手動で変更します。「Statistics」の章を参照してください。"
}
---
## 説明

指定したテーブルの指定した列の統計情報を手動で変更します。「統計情報」の章を参照してください。

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

> カラム識別子（つまり名前）を指定します。<index_name>が指定されていない場合、これはベーステーブルのカラム名になります。

**<column_stats>**

> 設定する統計値で、key = valueの形式で指定します。keyとvalueの両方を引用符で囲み、キーと値のペアはカンマで区切る必要があります。設定可能な統計は以下の通りです：

> row_count、行の総数

> ndv、カラムのカーディナリティ

> num_nulls、カラム内のnull値の数

> data_size、カラムの総サイズ

> min_value、カラムの最小値

> max_value、カラムの最大値

> このうち、row_countは必須で、その他の属性は任意です。設定されていない場合、そのカラムの対応する統計属性値は空になります。

# オプションパラメータ

**<index_name>**

> 同期マテリアライズドビュー（「同期マテリアライズドビュー」の章を参照）の識別子（つまり名前）。テーブルには0個から複数のマテリアライズドビューを持つことができます。マテリアライズドビュー内のカラムの統計を設定する必要がある場合は、<index_name>を使用してマテリアライズドビューの名前を指定する必要があります。指定されていない場合は、ベーステーブル内のカラムのプロパティが設定されます。

# アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限       | オブジェクト | 備考 |
| :--------- | :----------- | :--- |
| ALTER_PRIV | Table        |      |

# 使用上の注意

ユーザーがテーブルに統計を手動で注入した後、そのテーブルは統計の自動収集（「統計の自動収集」の章を参照）に参加しなくなり、ユーザーが手動で注入した統計が上書きされることを回避します。注入された統計が不要になった場合は、drop stats文を使用して既に注入された情報を削除することができ、これによりテーブルは自動収集を再度有効にすることができます。

# 例

- partテーブルのp_partkeyカラムに統計を注入します（index_nameが指定されていないため、ベーステーブルのカラム）。

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
- part テーブルの index1 マテリアライズドビューの col1 カラムに統計情報を注入します（index_name が指定されているため、マテリアライズドビューカラム）。

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
