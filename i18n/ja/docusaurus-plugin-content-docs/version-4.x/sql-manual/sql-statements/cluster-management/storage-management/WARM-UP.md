---
{
    "title": "WARM UP",
    "language": "ja",
    "description": "WARM UP COMPUTE GROUP ステートメントは、クエリ パフォーマンスを向上させるために、コンピュートグループ内のデータをウォームアップするために使用されます。"
}
---

## 説明 {#description}

`WARM UP COMPUTE GROUP` ステートメントは、クエリ パフォーマンスを向上させるために、コンピュートグループ内のデータをウォームアップするために使用されます。ウォームアップ操作では、別のコンピュートグループからリソースを取得するか、ウォームアップ対象として特定のテーブルやパーティションを指定できます。ウォームアップ操作はジョブ ID を返します。この ID を使用してウォームアップジョブのステータスを追跡できます。

> Catalog クエリシナリオでキャッシュをウォームアップする方法については、[Data Cache ドキュメント](../../../../lakehouse/data-cache.md)を参照してください。

## 構文 {#syntax}

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
## パラメータ {#parameters}

| パラメータ名                  | 説明                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | ウォームアップする対象コンピュートグループの名前。                                   |
| source_compute_group_name  | リソースを取得するソースコンピュートグループの名前。                                 |
| warm_up_list              | ウォームアップする特定の項目のリスト。テーブルとパーティションを含めることができます。                   |
| table_name                | ウォームアップに使用するテーブルの名前。                                         |
| partition_name            | ウォームアップに使用するパーティションの名前。                                       |

## 戻り値 {#return-value}

* JobId:  ウォームアップジョブの ID。

## アクセス制御要件 {#access-control-requirements}

4.1.5 以降、ウォームアップには宛先 Compute Group に対する `USAGE` 権限が必要で、ソース Compute Group を指定する場合はソース Compute Group に対する `USAGE` 権限も必要です。`WITH TABLE` で明示的に指定した各内部テーブルには `SELECT` 権限が必要です。`ON TABLES` ルールを使用するイベント駆動のウォームアップには、グローバル `ADMIN` 権限も必要です。必要な権限が不足している場合、操作は拒否されます。

## 例 {#examples}

1. source_group_name という名前のコンピュートグループを使用して、destination_group_name という名前のコンピュートグループをウォームアップします。

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. destination_group という名前のコンピュートグループを使用して、テーブル sales_data と customer_info、およびテーブル orders のパーティション q1_2024 をウォームアップします。

```sql
    WARM UP COMPUTE GROUP destination_group WITH
        TABLE sales_data
        AND TABLE customer_info
        AND TABLE orders PARTITION q1_2024;

```
