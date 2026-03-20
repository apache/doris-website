---
{
  "title": "ALTER STATS",
  "description": "指定されたtableの指定された列の統計情報を手動で変更します。「Statistics」の章を参照してください。",
  "language": "ja"
}
---
## 説明

指定されたtableの指定された列の統計情報を手動で変更します。「Statistics」の章を参照してください。

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

> Tableの識別子（つまり、名前）を指定します。

**<column_name>**

> カラムの識別子（つまり、名前）を指定します。<index_name>が指定されていない場合、これはベースTableのカラム名になります。

**<column_stats>**

> 設定する統計値で、key = valueの形式で指定します。keyとvalueの両方を引用符で囲む必要があり、キーと値のペアはコンマで区切ります。設定可能な統計には以下があります：

> row_count、行の総数

> ndv、カラムのカーディナリティ

> num_nulls、カラム内のnull値の数

> data_size、カラムの総サイズ

> min_value、カラムの最小値

> max_value、カラムの最大値

> この中で、row_countは必須で指定する必要があり、その他の属性はオプションです。設定されていない場合、そのカラムの対応する統計属性値は空になります。

# オプションパラメータ

**<index_name>**

> 同期マテリアライズドビュー（「同期マテリアライズドビュー」の章を参照）の識別子（つまり、名前）。Tableは0個から複数のマテリアライズドビューを持つことができます。マテリアライズドビュー内のカラムの統計を設定する必要がある場合、<index_name>を使用してマテリアライズドビューの名前を指定する必要があります。指定されていない場合、ベースTable内のカラムのプロパティが設定されます。

# アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限       | オブジェクト | 備考 |
| :--------- | :----------- | :--- |
| ALTER_PRIV | Table        |      |

# 使用上の注意

ユーザーがTableに統計を手動で注入した後、そのTableはユーザーが手動で注入した統計を上書きしないよう、統計の自動収集（「統計の自動収集」の章を参照）に参加しなくなります。注入された統計が不要になった場合、drop stats文を使用してすでに注入された情報を削除することができ、これによりTableは再び自動収集を有効にできます。

# 例

- partTableのp_partkeyカラムに統計を注入します（index_nameが指定されていないため、ベースTableのカラム）。

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
- part Tableの index1 マテリアライズドビューの col1 カラムに統計情報を注入する（index_name が指定されているため、マテリアライズドビューのカラム）。

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
