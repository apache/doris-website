---
{
  "title": "ALTER COLOCATE GROUP",
  "description": "この文は、Colocation Groupのプロパティを変更するために使用されます。",
  "language": "ja"
}
---
## 説明

この文は、Colocation Groupのプロパティを変更するために使用されます。

## 構文

```sql
ALTER COLOCATE GROUP  [<database>.] <group_name>
SET (
    <property_list>
);
```
## 必須パラメータ

**1. `<group_name>`**

変更するcolocate groupの名前を指定します。

**2.`<property_list>`**

`property_list`は`colocation group`のプロパティであり、現在は`replication_num`と`replication_allocation`の変更のみをサポートしています。`colocation group`のこれら2つのプロパティを変更した後、同時にグループのTableの既存パーティションのプロパティ`default.replication_allocation`、`dynamic.replication_allocation`、およびreplication_allocationを同じ値に変更します。

## オプションパラメータ

**1. `<database>`**

変更する`colocate group`が属するデータベースを指定します。

注意：
1. colocate groupがグローバル、つまり名前が__global__で始まる場合、どのDatabaseにも属しません

## アクセス制御要件
`ADMIN`権限が必要です。

## 例

1. グローバルグループのレプリカ数を変更し、Table作成時に`"colocate_with" = "__global__foo"`を設定します。

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```
2. 非グローバルグループのレプリカ数を変更し、Table作成時に "colocate_with" = "bar" を設定する。このTableはデータベース example_db に属する。

 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```
