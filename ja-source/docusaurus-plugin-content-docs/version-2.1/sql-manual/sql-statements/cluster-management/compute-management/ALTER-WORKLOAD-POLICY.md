---
{
  "title": "ALTER WORKLOAD POLICY",
  "language": "ja",
  "description": "ワークロードグループのプロパティを変更します。現在、プロパティの変更のみがサポートされています。"
}
---
## 説明

Workload Groupのプロパティを変更します。現在、プロパティの変更のみがサポートされており、アクションと条件の変更はサポートされていません。


## 構文

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```
## 必須パラメータ

`<workload_policy_name>` 

Workload Policyの名前


`<properties>`

1. enabled: trueまたはfalseを指定できます。デフォルト値はtrueで、現在のポリシーが有効であることを示します。falseは現在のポリシーが無効であることを示します。
2. priority: 0から100の範囲の正の整数で、デフォルト値は0です。これはポリシーの優先度を表します。値が高いほど優先度が高くなります。このプロパティの主な役割は、複数のポリシーがマッチした場合に最も高い優先度のポリシーを選択することです。
3. workload_group: 現在、ポリシーは1つのworkload groupにバインドできます。これは、このポリシーが特定のworkload groupに対してのみ有効であることを意味します。デフォルトは空で、すべてのクエリに対して有効であることを意味します。

## アクセス制御要件

少なくともADMIN_PRIV権限が必要です。

## 例

1. Workload Policyを無効にする

```Java
alter workload policy cancel_big_query properties('enabled'='false')
```
