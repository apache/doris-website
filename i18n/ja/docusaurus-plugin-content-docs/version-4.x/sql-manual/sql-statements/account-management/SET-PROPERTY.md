---
{
    "title": "SET PROPERTY",
    "language": "ja",
    "description": "ユーザーに割り当てるリソースやインポート用クラスターなど、ユーザー属性を設定します。"
}
---

## 説明

ユーザーに割り当てるリソースやインポート用クラスターなど、ユーザー属性を設定します。

**関連コマンド**

- [CREATE USER](./CREATE-USER.md)
- [SHOW PROPERTY](./SHOW-PROPERTY.md)

## 構文

```sql
SET PROPERTY [ FOR '<user_name>' ] '<key_1>' = '<value_1>' [, '<key_2>' = '<value_2>', ...];
```

## 必須パラメータ
**1. `<key_n>`**

スーパーユーザーの権限:

 - `max_user_connections`: 接続数の上限。
 - `max_query_instances`: ユーザーが同時にクエリを実行するために使用できるインスタンス数。
 - `sql_block_rules`: SQL ブロックルールを設定します。設定後、このユーザーが送信したクエリがルールに一致すると拒否されます。
 - `cpu_resource_limit`: クエリの CPU リソースを制限します。詳細はセッション変数 `cpu_resource_limit` の説明を参照してください。-1 は未設定を意味します。
 - `exec_mem_limit`: クエリのメモリ使用量を制限します。詳細はセッション変数 `exec_mem_limit` の説明を参照してください。-1 は未設定を意味します。
 - `resource_tags`: ユーザーのリソースタグ権限を指定します。
 - `query_timeout`: ユーザーのクエリタイムアウト権限を指定します。
 - `default_workload_group`: ユーザーのデフォルトワークロードグループを指定します。
 - `default_compute_group`: ユーザーのデフォルトコンピュートグループを指定します。

注意: 属性 `cpu_resource_limit`、`exec_mem_limit` を設定しない場合、デフォルトではセッション変数の値を使用します。

**2. `<value_n>`**

指定したキーに設定する値。

## 任意パラメータ

**1. `<user_name>`**

属性を設定するユーザーの名前。省略すると現在のユーザーに設定します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User or Role    | この `SET PROPERTY` 操作を実行できるのは、`ADMIN_PRIV` 権限を持つユーザーまたはロールのみです。 |

## 使用上の注意

- ここで設定するユーザー属性は user に対するものであり、user_identity に対するものではありません。たとえば CREATE USER で 'jack'@'%' と 'jack'@'192.%' を作成した場合、SET PROPERTY はユーザー jack に対して使用し、'jack'@'% ' や 'jack'@'192.%' に対しては使用しません。

## 例

- ユーザー jack の最大接続数を 1000 に変更します

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```

- ユーザー jack のクエリで使用できるインスタンス数を 3000 に変更します

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```

- ユーザー jack の SQL ブロックルールを変更します

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```

- ユーザー jack の CPU 使用量の上限を変更します

   ```sql
   SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
   ```

- ユーザーのリソースタグ権限を変更します

   ```sql
   SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
   ```

- ユーザーのクエリメモリ使用量の上限をバイト単位で変更します

   ```sql
   SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
   ```

- ユーザーのクエリタイムアウトの上限を秒単位で変更します

   ```sql
   SET PROPERTY FOR 'jack' 'query_timeout' = '500';
   ```

