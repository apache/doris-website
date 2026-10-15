---
{
    "title": "JSON_TYPE",
    "language": "ja",
    "description": "JSONB データ内で jsonpath が指定するフィールドの型を判定します。フィールドが存在しない場合は NULL を返し、存在する場合はその型を返します。"
}
---

## 説明

JSONB データ内で `json_path` が指定するフィールドの型を判定します。フィールドが存在しない場合は NULL を返します。存在する場合は、次のいずれかの型を返します。

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

## 構文

```sql
JSON_TYPE( <json>, <json_path> )
```

## パラメータ

- `<json>` 型を確認する JSON 文字列。
- `<json_path>` JSON 内のフィールドの位置を指定する文字列型のパス。通常は $ で始まり、. で階層構造を表します。

## 戻り値

`Nullable<String>`: 対応するフィールドの型を返します。

## 使用上の注意
- `<json_object>` または `<json_path>` が NULL の場合は、NULL を返します。
- `<json_path>` が有効なパスでない場合は、エラーを報告します。
- `<json_path>` が指定するフィールドが存在しない場合は、NULL を返します。

## 例
1. JSON フィールドが文字列型の場合：
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.name');
    ```
    ```text
    +-------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.name') |
    +-------------------------------------------------------------------+
    | string                                                            |
    +-------------------------------------------------------------------+
    ```

2. JSON フィールドが数値型の場合：
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.age');
    ```
    ```text
    +------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.age') |
    +------------------------------------------------------------------+
    | int                                                              |
    +------------------------------------------------------------------+
    ```
3. NULL パラメータ
    ```sql
    select json_type(NULL, '$.key1');
    ```
    ```text
    +---------------------------+
    | json_type(NULL, '$.key1') |
    +---------------------------+
    | NULL                      |
    +---------------------------+
    ```
4. NULL パラメータ 2
    ```sql
    select json_type('{"key1": true}', NULL);
    ```
    ```text
    +-----------------------------------+
    | json_type('{"key1": true}', NULL) |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
5. `json_path` パラメータが指定するフィールドが存在しない場合
    ```sql
    select json_type('{"key1": true}', '$.key2');
    ```
    ```text
    +---------------------------------------+
    | json_type('{"key1": true}', '$.key2') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
6. `json_path` パラメータが無効な場合
    ```sql
    select json_type('{"key1": true}', '$.');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Json path error: Invalid Json Path for value: $.
    ```
