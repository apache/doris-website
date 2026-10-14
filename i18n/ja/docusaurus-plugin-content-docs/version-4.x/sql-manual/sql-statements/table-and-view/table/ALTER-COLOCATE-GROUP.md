---
{
    "title": "ALTER COLOCATE GROUP",
    "language": "ja",
    "description": "Colocation Group のプロパティを変更します。"
}
---

## 説明

Colocation Group のプロパティを変更します。

## 構文

```sql
ALTER COLOCATE GROUP  [<database>.] <group_name>
SET (
    <property_list>
);
```
## 必須パラメータ

**1. `<group_name>`**

変更する Colocation Group の名前を指定します。

**2.`<property_list>`**

`property_list` は `colocation group` のプロパティです。現在変更できるのは `replication_num` と `replication_allocation` のみです。これら二つの `colocation group` プロパティを変更すると、`default.replication_allocation`、`dynamic.replication_allocation`、およびグループ内テーブルの既存パーティションの replication_allocation も同じ値に変更されます。

## 任意パラメータ

**1. `<database>`**

変更する `colocate group` が属するデータベースを指定します。

注意:
1. Colocation Group がグローバルで、名前が __global__ で始まる場合、どのデータベースにも属しません。

## 必要な権限
`ADMIN` 権限が必要です。

## 例

1. グローバルグループのレプリカ数を変更します。テーブル作成時に `"colocate_with" = "__global__foo"` を設定します。

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```

2. 非グローバルグループのレプリカ数を変更します。テーブルはデータベース example_db に属し、作成時に "colocate_with" = "bar" を設定します。
 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```
