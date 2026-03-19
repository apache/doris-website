---
{
  "title": "JSON_ARRAY_IGNORE_NULL",
  "language": "ja",
  "description": "指定された要素を含むJSON配列を生成します。パラメータが渡されない場合は空の配列を返します。"
}
---
# JSON_ARRAY_IGNORE_NULL
## 説明
指定された要素を含むJSON配列を生成します。パラメータが渡されない場合は空の配列を返します。

## 構文

```sql
JSON_ARRAY_IGNORE_NULL([<expression>, ...]) 
```
## パラメータ
### 可変パラメータ:
- `<expression>`: JSON配列に含める要素。NULLを含む異なる型の単一または複数の値を指定可能。

## 戻り値
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): パラメータリストで構成されたJSON配列を返す。

## 使用上の注意
- JSON_ARRAY_IGNORE_NULLの実装では、[`TO_JSON`](./to-json.md)関数を暗黙的に呼び出すことで異なる型のパラメータをJSON値に変換するため、パラメータは[`TO_JSON`](./to-json.md)でサポートされている型である必要があります。
- NULLは無視されます。配列内でnull値を保持したい場合は、[`JSON_ARRAY`](./json-array.md)関数を使用できます。
- パラメータの型が[`TO_JSON`](./to-json.md)でサポートされていない場合、エラーが発生します。そのパラメータを事前にString型に変換することができます。例:

    ```sql
    select JSON_ARRAY_IGNORE_NULL(CAST(NOW() as String));
    ```
> NOW()関数はDateTime型を返すため、CAST関数を使用してString型に変換する必要があります
- パラメータがJSON文字列で、それをJSONオブジェクトとして配列に追加したい場合は、`JSON_PARSE`関数を明示的に呼び出してJSONオブジェクトとして解析する必要があります：

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
2. NULLパラメータ

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
3. サポートされていないパラメータタイプ

    ```sql
    select json_array_ignore_null('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. マップ型パラメータはJSONに明示的に変換できます

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
5. JSON文字列は`json_parse`で解析できます

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
