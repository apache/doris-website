---
{
  "title": "ウォームアップ",
  "language": "ja",
  "description": "WARM UP COMPUTE GROUP文は、クエリパフォーマンスを向上させるためにcompute group内のデータをウォームアップするために使用されます。"
}
---
## 説明

`WARM UP COMPUTE GROUP`文は、クエリパフォーマンスを向上させるためにcompute group内のデータをウォームアップするために使用されます。ウォームアップ操作は、別のcompute groupからリソースを取得したり、ウォームアップする特定のテーブルやパーティションを指定したりできます。ウォームアップ操作は、ウォームアップジョブのステータスを追跡するために使用できるジョブIDを返します。

> Catalogクエリシナリオのキャッシュをウォームアップする方法については、[Data Cacheドキュメント](../../../../lakehouse/data-cache.md)を参照してください。

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
| destination_compute_group_name | ウォームアップ対象のコンピュートグループ名。                                   |
| source_compute_group_name  | リソース取得元のコンピュートグループ名。                                 |
| warm_up_list              | ウォームアップする特定のアイテムのリスト。テーブルやパーティションを含むことができる。                   |
| table_name                | ウォームアップに使用するテーブル名。                                         |
| partition_name            | ウォームアップに使用するパーティション名。                                       |

## 戻り値

* JobId: ウォームアップジョブのID。

## 例

1. source_group_name という名前のコンピュートグループを使用して、destination_group_name という名前のコンピュートグループをウォームアップする

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```
2. compute group名destination_groupを使用して、テーブルsales_dataとcustomer_info、およびテーブルordersのパーティションq1_2024をウォームアップします。

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```
