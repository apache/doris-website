---
{
  "title": "ウォームアップ",
  "description": "WARM UP COMPUTE GROUP文は、クエリのパフォーマンスを向上させるために、コンピュートグループ内のデータをウォームアップするために使用されます。",
  "language": "ja"
}
---
## 説明

`WARM UP COMPUTE GROUP`文は、クエリパフォーマンスを向上させるためにコンピュートグループ内のデータをウォームアップするために使用されます。ウォームアップ操作では、他のコンピュートグループからリソースを取得するか、ウォームアップする特定のtableやパーティションを指定できます。ウォームアップ操作は、ウォームアップジョブのステータスを追跡するために使用できるジョブIDを返します。

> カタログクエリシナリオでのキャッシュのウォームアップ方法については、Data Cacheドキュメントを参照してください。

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

| パラメータ名                  | デスクリプション                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | ウォームアップ対象のコンピュートグループの名前。                                   |
| source_compute_group_name  | リソースの取得元となるソースコンピュートグループの名前。                                 |
| warm_up_list              | ウォームアップする特定の項目のリスト。Tableとパーティションを含めることができる。                   |
| table_name                | ウォームアップに使用するTableの名前。                                         |
| partition_name            | ウォームアップに使用するパーティションの名前。                                       |

## Return Value

* JobId: ウォームアップジョブのID。

## Examples

1. source_group_nameという名前のコンピュートグループを使用してdestination_group_nameという名前のコンピュートグループをウォームアップする

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```
2. destination_groupという名前のcompute groupを使用して、Tablesales_dataとcustomer_info、およびTableordersのパーティションq1_2024をウォームアップします。

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```
