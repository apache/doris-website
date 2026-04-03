---
{
  "title": "JSON_OBJECT",
  "language": "ja",
  "description": "指定されたキー値ペアを含む1つのJSONオブジェクトを生成する。"
}
---
## 説明

指定されたキーと値のペアを含む1つのJSONオブジェクトを生成します。キー値がNULLの場合、または奇数個のパラメータが渡された場合にエラーを返します。

## 構文

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```
```sql
JSON_OBJECT(*)
```
## パラメータ
### 可変パラメータ:
- `<key>`: String型
- `<value>`: 複数の型、DorisはJSON型以外のパラメータを[`TO_JSON`](./to-json.md)関数を通してJSON型に自動変換します。
- `*`: アスタリスク（ワイルドカード）で呼び出されると、OBJECT値は属性名をキーとし、関連する値を値として使用して、指定されたデータから構築されます。

    関数にワイルドカードを渡す場合、テーブルの名前またはエイリアスでワイルドカードを修飾できます。例えば、mytableという名前のテーブルからすべての列を渡すには、以下のように指定します：

    ```sql
    (mytable.*)
    ```
## 注意事項
- パラメータ数は偶数である必要があり、0個のパラメータも可能です（空のJSONオブジェクトを返します）。
- 慣例により、パラメータリストはキーと値を交互に指定します。
- キーはJSON定義に従ってテキストに強制変換されます。
- 渡されたKeyがNULLの場合、例外エラーを返します。
- Valueパラメータは、JSONに変換可能な形で変換され、[`TO_JSON`](./to-json.md)でサポートされる型である必要があります。
- 渡されたValueがNULLの場合、そのKey-Valueペアに対応する返されるJSONオブジェクト内のValueはJSON null値になります。
- 値として他の型をサポートしたい場合は、CASTを使用してJSON/Stringに変換できます。
- Dorisは現在JSONオブジェクトの重複排除を行わないため、重複キーが許可されます。ただし、重複キーは予期しない結果を引き起こす可能性があります：
    1. 他のシステムでは、重複キーに対応する値が削除されたり、エラーが報告されたりする場合があります。
    2. [`JSON_EXTRACT`](./json-extract.md)が返す結果は不確定です。

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
キャストを通じてStringに変換可能

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
3. 非文字列型のキーは文字列に変換されます

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
Nullは値として使用できます

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
5. JSON文字列は、`JSON_OBJECT`に渡す前に[`JSON_PARSE`](./json-parse.md)を介してJSONオブジェクトに解析できます

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
7. 重複キーのケース

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
