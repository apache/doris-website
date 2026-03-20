---
{
  "title": "SHOW FRONTEND CONFIG",
  "description": "この文は、現在のクラスターの設定を表示するために使用されます（現在はFEの設定項目のみがサポートされています）",
  "language": "ja"
}
---
## 説明

このステートメントは、現在のクラスターの設定を表示するために使用されます（現在はFEの設定項目のみサポートされています）

## 構文

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```
## オプションパラメータ
**`<pattern>`**
> 通常の文字とワイルドカードを含むことができる文字列。


## 戻り値
| 列名 | 説明                                            |
|-------------|-----------------------------------------------------|
| Value       | 設定項目の値                            |
| タイプ        | 設定項目のタイプ                             |
| IsMutable   | `ADMIN SET CONFIG`コマンドで設定可能かどうか |
| MasterOnly  | Master FEにのみ適用されるかどうか                  |
| Comment     | 設定項目の説明                      |


## 例

1. 現在のFEノードの設定を表示する

   ```sql
   SHOW FRONTEND CONFIG;
   ```
2. like述語を使用して現在のFeノードの設定を検索する

   ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | タイプ    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```
