---
{
    "title": "ALTER STATS",
    "language": "ja",
    "description": "指定したテーブルの指定した列の統計情報を手動で変更します。「統計情報」の章を参照してください。"
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

> テーブルの識別子（名前）を指定します。

**<column_name>**

> 列の識別子（名前）を指定します。<index_name> を指定しない場合は、ベーステーブルの列名です。

**<column_stats>**

> 設定する統計情報の値を key = value 形式で指定します。key と value はどちらも引用符で囲み、キーと値の組はカンマで区切ります。設定できる統計情報は次のとおりです。

> row_count、総行数

> ndv、列のカーディナリティ

> num_nulls、列に含まれる NULL 値の数

> data_size、列の合計サイズ

> min_value、列の最小値

> max_value、列の最大値

> このうち row_count は必須で、その他の属性は省略できます。省略した場合、その列の該当する統計情報属性の値は空になります。

# オプションパラメータ

**<index_name>**

> 同期マテリアライズドビュー（「同期マテリアライズドビュー」の章を参照）の識別子（名前）を指定します。テーブルには 0 個以上のマテリアライズドビューを作成できます。マテリアライズドビュー内の列の統計情報を設定する場合は、<index_name> でそのマテリアライズドビューの名前を指定します。指定しない場合は、ベーステーブル内の列の属性を設定します。

# アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限       | オブジェクト | 備考 |
| :--------- | :----- | :---- |
| ALTER_PRIV | テーブル     |      |

# 使用上の注意

ユーザーがテーブルに統計情報を手動で注入すると、手動で注入した統計情報が上書きされないよう、そのテーブルは統計情報の自動収集（「統計情報の自動収集」の章を参照）の対象から外れます。注入した統計情報を使用しなくなった場合は、drop stats ステートメントで注入済みの情報を削除すると、そのテーブルで自動収集を再開できます。

# 例

- part テーブルの p_partkey 列に統計情報を注入します（index_name を指定していないため、ベーステーブルの列です）。

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```

- part テーブルの index1 マテリアライズドビューの col1 列に統計情報を注入します（index_name を指定しているため、マテリアライズドビューの列です）。

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
