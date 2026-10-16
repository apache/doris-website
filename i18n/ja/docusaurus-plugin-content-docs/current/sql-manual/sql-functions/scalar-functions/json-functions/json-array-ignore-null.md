---
{
    "title": "JSON_ARRAY_IGNORE_NULL",
    "language": "ja",
    "description": "指定した要素を含む JSON 配列を生成します。パラメータを指定しない場合は空の配列を返します。"
}
---

# JSON_ARRAY_IGNORE_NULL
## 説明
指定した要素を含む JSON 配列を生成します。パラメータを指定しない場合は空の配列を返します。

## 構文
```sql
JSON_ARRAY_IGNORE_NULL([<expression>, ...]) 
```

## パラメータ
### 可変長パラメータ:
- `<expression>`: JSON 配列に含める要素です。NULL を含む異なる型の値を、一つまたは複数指定できます。

## 戻り値
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): パラメータのリストから構成される JSON 配列を返します。

## 使用上の注意
- JSON_ARRAY_IGNORE_NULL は [`TO_JSON`](./to-json.md) 関数を暗黙的に呼び出して、さまざまな型のパラメータを JSON 値に変換します。そのため、パラメータには [`TO_JSON`](./to-json.md) がサポートする型を指定してください。
- NULL は無視されます。配列内に null 値を残したい場合は、[`JSON_ARRAY`](./json-array.md) 関数を使用できます。
- パラメータの型が [`TO_JSON`](./to-json.md) でサポートされない場合はエラーになります。たとえば、事前にパラメータを String 型に変換できます。
    ```sql
    select JSON_ARRAY_IGNORE_NULL(CAST(NOW() as String));
    ```
    > NOW() 関数は DateTime 型を返すため、CAST 関数で String 型に変換する必要があります
- パラメータが JSON 文字列で、その内容を JSON オブジェクトとして配列に追加する場合は、`JSON_PARSE` 関数を明示的に呼び出して解析してください。
  ```sql
  select JSON_ARRAY_IGNORE_NULL(JSON_PARSE('{"key": "value"}'));
  ```

## 例
1. 通常のパラメータ
    ```sql
    select json_array_ignore_null() as empty_array, json_array_ignore_null(1) v1, json_array_ignore_null(1, 'abc') v2;
    ```
    ```
    +-------------+------+-----------+
    | empty_array | v1   | v2        |
    +-------------+------+-----------+
    | []          | [1]  | [1,"abc"] |
    +-------------+------+-----------+
    ```
2. NULL パラメータ
    ```sql
    select json_array_ignore_null(null) v1, json_array_ignore_null(1, null, 'I am a string') v2;
    ```
    ```
    +------+---------------------+
    | v1   | v2                  |
    +------+---------------------+
    | []   | [1,"I am a string"] |
    +------+---------------------+
    ```
3. サポートされないパラメータの型
    ```sql
    select json_array_ignore_null('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. MAP 型のパラメータは明示的に JSON に変換できます

    ```sql
    select json_array_ignore_null(1, cast(map('key', 'value') as json));
    ```
    ```
    +--------------------------------------------------------------+
    | json_array_ignore_null(1, cast(map('key', 'value') as json)) |
    +--------------------------------------------------------------+
    | [1,{"key":"value"}]                                          |
    +--------------------------------------------------------------+
    ```
5. `json_parse` で JSON 文字列を解析できます
    ```sql
    select json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}'));
    ```
    ```
    +------------------------------------------------------------------------------------------+
    | json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}')) |
    +------------------------------------------------------------------------------------------+
    | [{"key1":"value","key2":[1,"I am a string",3]}]                                          |
    +------------------------------------------------------------------------------------------+
    ```