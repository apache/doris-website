---
{
  "title": "JSON_OBJECT",
  "description": "指定されたKey-Valueペアを含むJSONオブジェクトを1つ生成します。",
  "language": "ja"
}
---
## デスクリプション

指定されたKey-Valueペアを含む1つのJSONオブジェクトを生成します。Key値がNULLの場合、または奇数個のパラメータが渡された場合にエラーを返します。

## Syntax

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```
```sql
JSON_OBJECT(*)
```
## パラメータ
### 可変パラメータ:
- `<key>`: String型
- `<value>`: 複数の型、DorisはJSON以外の型のパラメータを[`TO_JSON`](./to-json.md)関数を通じて自動的にJSON型に変換します。
- `*`: アスタリスク（ワイルドカード）で呼び出された場合、OBJECT値は属性名をキーとし、関連する値を値として使用して、指定されたデータから構築されます。

    関数にワイルドカードを渡す際は、Tableの名前またはエイリアスでワイルドカードを修飾できます。例えば、mytableという名前のTableからすべての列を渡すには、以下を指定します:

    ```sql
    (mytable.*)
    ```
## 注意事項
- パラメータの数は偶数である必要があり、0個のパラメータも可能です（空のJSONオブジェクトを返します）。
- 慣例により、パラメータリストはキーと値を交互に並べた構成になります。
- キーはJSON定義に従ってテキストに強制変換されます。
- 渡されたKeyがNULLの場合、例外エラーを返します。
- Valueパラメータは、JSONに変換可能な方法で変換され、[`TO_JSON`](./to-json.md)でサポートされる型である必要があります。
- 渡されたValueがNULLの場合、そのKey-Valueペアに対して返されるJSONオブジェクト内のValueはJSON null値になります。
- 値として他の型をサポートしたい場合は、CASTを使用してJSON/Stringに変換できます。
- Dorisは現在JSONオブジェクトの重複排除を行わないため、重複するキーが許可されます。ただし、重複するキーは予期しない結果を引き起こす可能性があります：
    1. 他のシステムでは重複するキーに対応する値が削除されたり、エラーが報告される場合があります。
    2. [`JSON_EXTRACT`](./json-extract.md)によって返される結果は不確定です。

## 戻り値

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): パラメータリストで構成されたJSONオブジェクトを返します。

## 例
1. パラメータなしのケース

    ```sql
    select json_object();
    ```
    ```text
    +---------------+
    | json_object() |
    +---------------+
    | {}            |
    +---------------+
    ```
2. サポートされていない値の型

    ```sql
    select json_object('time',curtime());
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(TIMEV2(0))
    ```
キャストを通じてStringに変換できます

    ```sql
    select json_object('time', cast(curtime() as string));
    ```
    ```text
    +------------------------------------------------+
    | json_object('time', cast(curtime() as string)) |
    +------------------------------------------------+
    | {"time":"17:09:42"}                            |
    +------------------------------------------------+
    ```
3. 非String型のキーはStringに変換されます

    ```sql
    SELECT json_object(123, 456);
    ```
    ```text
    +-----------------------+
    | json_object(123, 456) |
    +-----------------------+
    | {"123":456}           |
    +-----------------------+
    ```
4. Nullはキーとして使用できません

    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
nullは値として使用できます

    ```sql
    select json_object('key', null);
    ```
    ```text
    +--------------------------+
    | json_object('key', null) |
    +--------------------------+
    | {"key":null}             |
    +--------------------------+
    ```
5. JSON文字列は、`JSON_OBJECT`に渡される前に[`JSON_PARSE`](./json-parse.md)を介してJSONオブジェクトに解析できます

    ```sql
    select json_object(123, json_parse('{"key": "value"}'));
    ```
    ```text
    +--------------------------------------------------+
    | json_object(123, json_parse('{"key": "value"}')) |
    +--------------------------------------------------+
    | {"123":{"key":"value"}}                          |
    +--------------------------------------------------+
    ```
そうでなければ文字列として扱われます

    ```sql
    select json_object(123,'{"key": "value"}');
    ```
    ```text
    +-------------------------------------+
    | json_object(123,'{"key": "value"}') |
    +-------------------------------------+
    | {"123":"{\"key\": \"value\"}"}      |
    +-------------------------------------+
    ```
6. [`TO_JSON`](./to-json.md)でサポートされていない型

    ```sql
    select json_object('key', map('abc', 'efg'));
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<VARCHAR(3),VARCHAR(3)>)
    ```
CAST文を使用してJSONに変換してから渡すことができます：

    ```sql
    select json_object('key', cast(map('abc', 'efg') as json));
    ```
    ```text
    +-----------------------------------------------------+
    | json_object('key', cast(map('abc', 'efg') as json)) |
    +-----------------------------------------------------+
    | {"key":{"abc":"efg"}}                               |
    +-----------------------------------------------------+
    ```
7. 重複するキーがある場合

    ```sql
    select
        json_object('key', 123, 'key', 4556) v1
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.key') v2
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.*') v3;
    ```
    ```text
    +------------------------+------+------------+
    | v1                     | v2   | v3         |
    +------------------------+------+------------+
    | {"key":123,"key":4556} | 123  | [123,4556] |
    +------------------------+------+------------+
    ```
