---
{
  "title": "SHOW PROPERTY",
  "description": "このステートメントはユーザーの属性を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、ユーザーの属性を表示するために使用されます。

## Syntax

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```
## オプションパラメータ
**1. `[ALL PROPERTIES]`**

   すべてのユーザー属性を表示するかどうか。

**2. `<user_name>`**

   指定されたユーザーの属性を表示します。指定されていない場合は、現在のユーザーの属性を確認します。

**3. `<key>`**

   属性名によるあいまい一致が可能です。

## 戻り値
- ステートメントが`PROPERTY`を使用する場合

   | Column | デスクリプション |
   | -- | -- |
   | Key | 属性名 |
   | Value | 属性値 |

- ステートメントが`PROPERTIES`を使用する場合

   | Column | デスクリプション |
   | -- | -- |
   | User | ユーザー名 |
   | Properties | 対応するユーザーの各`property` `key:value` |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | ユーザーまたはロールがすべてのユーザープロパティを表示するための`GRANT_PRIV`権限を持つ場合、`SHOW PROPERTY`は現在のユーザーのプロパティを表示するために`GRANT_PRIV`権限を必要としません |

## 使用上の注意
- `SHOW ALL PROPERTIES`を使用してすべてのユーザーのプロパティを表示できます。
- `user_name`が指定されている場合は、指定されたユーザーの属性を表示します。
- `user_name`が指定されていない場合は、現在のユーザーの属性を表示します。
- `SHOW PROPERTY`は現在のユーザーのプロパティを表示するために`GRANT_PRIV`権限を必要としません。

## 例

- jackユーザーの属性を表示する

   ```sql
   SHOW PROPERTY FOR 'jack';
   ```
   ```text
   +-------------------------------------+--------+
   | Key                                 | Value  |
   +-------------------------------------+--------+
   | cpu_resource_limit                  | -1     |
   | default_load_cluster                |        |
   | default_workload_group              | normal |
   | exec_mem_limit                      | -1     |
   | insert_timeout                      | -1     |
   | max_query_instances                 | 3000   |
   | max_user_connections                | 1000   |
   | parallel_fragment_exec_instance_num | -1     |
   | query_timeout                       | -1     |
   | resource_tags                       |        |
   | sql_block_rules                     |        |
   +-------------------------------------+--------+
   ```
- ユーザーjackの制限関連プロパティを表示する

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%limit%';
   ```
   ```text
   +--------------------+-------+
   | Key                | Value |
   +--------------------+-------+
   | cpu_resource_limit | -1    |
   | exec_mem_limit     | -1    |
   +--------------------+-------+
   ```
- ユーザー制限に関連するすべてのプロパティを表示する

   ```sql
   SHOW ALL PROPERTIES LIKE '%limit%';
   ```
   ```text
   +-------+------------------------------------------------------------+
   | User  | Properties                                                 |
   +-------+------------------------------------------------------------+
   | root  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | admin | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | jack  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   +-------+------------------------------------------------------------+
   ```
