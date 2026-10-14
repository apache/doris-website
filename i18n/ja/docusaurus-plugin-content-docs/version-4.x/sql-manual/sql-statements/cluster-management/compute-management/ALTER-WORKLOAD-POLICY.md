---
{
    "title": "ALTER WORKLOAD POLICY",
    "language": "ja",
    "description": "ワークロードポリシーのプロパティを変更します。現在サポートされているのはプロパティの変更のみです。"
}
---

## 説明

ワークロードポリシーのプロパティを変更します。現在サポートされているのはプロパティの変更のみで、アクションと条件の変更はサポートされていません。


## 構文

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## 必須パラメータ

`<workload_policy_name>` 

ワークロードポリシーの名前。


`<properties>`

1. enabled: true または false を指定できます。デフォルト値は true で、現在のポリシーが有効であることを示します。false は現在のポリシーが無効であることを示します。
2. priority: 0 から 100 までの正の整数を指定します。デフォルト値は 0 です。ポリシーの優先度を表し、値が大きいほど優先度が高くなります。主に、複数のポリシーが一致したときに、最も優先度の高いポリシーを選択するために使用します。
3. workload_group: 現在、ポリシーは一つのワークロードグループに紐付けることができます。この場合、ポリシーは特定のワークロードグループに対してのみ有効です。デフォルトは空で、すべてのクエリに対して有効であることを意味します。

    ワークロードグループ自体がコンピュートグループに属するため、このプロパティの値は次のルールに従う必要があります。

    - **クラウドモード（ストレージとコンピュートが分離）**: `<compute_group>.<workload_group>` という完全修飾形式が必要です。例: `'workload_group'='compute_group_a.wg1'`。単独の `<workload_group>`、複数の `.`、空の部分（`.wg1` や `wg1.` など）は拒否され、`workload_group must be '<compute_group>.<workload_group>' in cloud mode` というエラーが発生します。
    - **非クラウドモード（ストレージとコンピュートが結合）**: 次の二つの形式を使用できます。
        - `<workload_group>`: デフォルトのリソースグループ（`default`）にある同名のワークロードグループに紐付けます。
        - `<resource_group>.<workload_group>`: リソースグループを明示的に指定します。ここでのプレフィックスは実際にはリソースグループ（Tag）を指します。構文をクラウドモードと共通にしているのは、一貫性を保つためです。

        複数の `.` や空の部分も拒否され、`workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode` というエラーが発生します。

## アクセス制御要件

少なくとも ADMIN_PRIV 権限が必要です。

## 例

1. ワークロードポリシーを無効にします。

  ```sql
  alter workload policy cancel_big_query properties('enabled'='false')
  ```
