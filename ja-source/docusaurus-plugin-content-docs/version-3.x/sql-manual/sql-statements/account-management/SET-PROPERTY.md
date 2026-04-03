---
{
  "title": "SET PROPERTY",
  "description": "ユーザーに割り当てられたリソース、クラスターのインポートなど、ユーザー属性を設定します。",
  "language": "ja"
}
---
## デスクリプション

リソースがユーザーに割り当てられている、クラスターをインポートするなど、ユーザー属性を設定します。

**関連コマンド**

- [CREATE USER](./CREATE-USER.md)
- [SHOW PROPERTY](./SHOW-PROPERTY.md)

## Syntax

```sql
SET PROPERTY [ FOR '<user_name>' ] '<key_1>' = '<value_1>' [, '<key_2>' = '<value_2>', ...];
```
## 必須パラメータ
**1. `<key_n>`**

スーパーユーザー権限：

 - `max_user_connections`: 接続の最大数。
 - `max_query_instances`: ユーザーが同時にクエリを実行するために使用できるインスタンス数。
 - `sql_block_rules`: SQLブロックルールを設定します。設定されると、このユーザーが送信したクエリがルールに一致する場合は拒否されます。
 - `cpu_resource_limit`: クエリのCPUリソースを制限します。詳細はセッション変数 `cpu_resource_limit` の説明を参照してください。-1は未設定を意味します。
 - `exec_mem_limit`: クエリのメモリ使用量を制限します。詳細はセッション変数 `exec_mem_limit` の説明を参照してください。-1は未設定を意味します。
 - `resource_tags`: ユーザーのリソースタグ権限を指定します。
 - `query_timeout`: ユーザーのクエリタイムアウト権限を指定します。
 - `default_workload_group`: ユーザーのデフォルトワークロードグループを指定します。
 - `default_compute_group`: ユーザーのデフォルトコンピュートグループを指定します。

注意: 属性 `cpu_resource_limit`、`exec_mem_limit` が設定されていない場合、デフォルトでセッション変数の値が使用されます。

**2. `<value_n>`**

指定されたキーに設定する値。

## オプションパラメータ

**1. `<user_name>`**

プロパティを設定するユーザーのユーザー名。省略した場合、現在のユーザーにプロパティが設定されます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 注記                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User または Role    | この `SET PROPERTY` 操作は、`ADMIN_PRIV` 権限を持つユーザーまたはロールのみが実行できます。 |

## 使用上の注意

- ここで設定されるユーザー属性は、user_identityではなくuserに対するものです。つまり、CREATE USER文で2つのユーザー'jack'@'%'と'jack'@'192.%'を作成した場合、SET PROPERTY文はユーザーjackに対してのみ使用でき、'jack'@'%'や'jack'@'192.%'に対しては使用できません。

## 例

- ユーザーjackの最大接続数を1000に変更

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```
- ユーザー jack のクエリに対して利用可能なインスタンス数を 3000 に変更する

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```
- ユーザー jack の sql ブロックルールを変更する

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```
- ユーザーjackのCPU使用量制限を変更する

   ```sql
   SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
   ```
- ユーザーのリソースタグ権限を変更する

   ```sql
   SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
   ```
ユーザーのクエリメモリ使用量制限を変更します（バイト単位）

   ```sql
   SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
   ```
- ユーザーのクエリタイムアウト制限を秒単位で変更する

   ```sql
   SET PROPERTY FOR 'jack' 'query_timeout' = '500';
   ```
