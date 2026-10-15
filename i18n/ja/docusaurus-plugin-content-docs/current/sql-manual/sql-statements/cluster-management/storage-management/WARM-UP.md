---
{
    "title": "WARM UP",
    "language": "ja",
    "description": "WARM UP COMPUTE GROUP ステートメントは、クエリ性能を向上させるためにコンピュートグループ内のデータをウォームアップします。"
}
---

## 説明

`WARM UP COMPUTE GROUP` ステートメントは、クエリ性能を向上させるためにコンピュートグループ内のデータをウォームアップします。ウォームアップ操作では、別のコンピュートグループからリソースを取得するか、ウォームアップする特定のテーブルとパーティションを指定できます。ウォームアップ操作はジョブ ID を返します。この ID を使用してウォームアップジョブの状態を追跡できます。

> Catalog クエリで使用するキャッシュのウォームアップについては、[データキャッシュのドキュメント](../../../../lakehouse/data-cache.md)を参照してください。

## 構文

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;
```
```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;
```
```sql
warm_up_list ::= warm_up_item [AND warm_up_item...];
```
```sql
warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```
## パラメータ

| パラメータ名                  | 説明                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | ウォームアップ対象のコンピュートグループの名前。                                   |
| source_compute_group_name  | リソースの取得元となるコンピュートグループの名前。                                 |
| warm_up_list              | ウォームアップする項目のリスト。テーブルとパーティションを指定できます。                   |
| table_name                | ウォームアップに使用するテーブルの名前。                                         |
| partition_name            | ウォームアップに使用するパーティションの名前。                                       |

## 戻り値

* JobId: ウォームアップジョブの ID。

## 例

1. source_group_name という名前のコンピュートグループを使用して、destination_group_name という名前のコンピュートグループをウォームアップします。

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. destination_group という名前のコンピュートグループで、テーブル sales_data と customer_info、およびテーブル orders のパーティション q1_2024 をウォームアップします。

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```
