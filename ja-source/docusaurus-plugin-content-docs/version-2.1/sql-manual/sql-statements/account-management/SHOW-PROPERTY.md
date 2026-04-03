---
{
  "title": "プロパティを表示",
  "language": "ja",
  "description": "このステートメントはユーザーの属性を表示するために使用されます。"
}
---
## 説明

このステートメントは、ユーザーの属性を表示するために使用されます。

## 構文

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```
## オプションパラメータ
**1. `[ALL PROPERTIES]`**

   全てのユーザー属性を表示するかどうか。

**2. `<user_name>`**

   指定したユーザーの属性を表示します。指定しない場合は、現在のユーザーの属性を確認します。

**3. `<key>`**

   属性名によるあいまい検索が可能です。

## 戻り値
- ステートメントが `PROPERTY` を使用する場合

   | Column | Description |
   | -- | -- |
   | Key | 属性名 |
   | Value | 属性値 |

- ステートメントが `PROPERTIES` を使用する場合

   | Column | Description |
   | -- | -- |
   | User | ユーザー名 |
   | Properties | 対応するユーザーの各 `property` `key:value` |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | Notes                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | ユーザーまたはロールが `GRANT_PRIV` 権限を持っている場合、全てのユーザープロパティを表示できます。`SHOW PROPERTY` では現在のユーザーのプロパティを表示するのに `GRANT_PRIV` 権限は必要ありません |

## 使用上の注意
-  `SHOW ALL PROPERTIES` を使用して、全てのユーザーのプロパティを表示できます。
- `user_name` が指定されている場合、指定したユーザーの属性を表示します。
- `user_name` が指定されていない場合、現在のユーザーの属性を表示します。
- `SHOW PROPERTY` では現在のユーザーのプロパティを表示するのに `GRANT_PRIV` 権限は必要ありません。

## 例

- jackユーザーの属性を表示

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
- すべてのユーザー制限関連プロパティを表示

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
