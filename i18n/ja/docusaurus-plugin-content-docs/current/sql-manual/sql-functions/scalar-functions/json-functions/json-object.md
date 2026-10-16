---
{
    "title": "JSON_OBJECT",
    "language": "ja",
    "description": "指定したキーと値のペアを含む JSON オブジェクトを生成します。"
}
---

## 説明

指定したキーと値のペアを含む JSON オブジェクトを生成します。キーが NULL の場合、またはパラメータの数が奇数の場合はエラーになります。

## 構文

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```

```sql
JSON_OBJECT(*)
```

## パラメータ
### 可変長パラメータ:
- `<key>`: 文字列型です。
- `<value>`: 複数の型を指定できます。Doris は JSON 型以外のパラメータを [`TO_JSON`](./to-json.md) 関数で自動的に JSON 型に変換します。
- `*`: アスタリスク（ワイルドカード）を指定すると、指定したデータの属性名をキー、対応する値を値として JSON オブジェクトを構築します。

    ワイルドカードを渡すときは、テーブル名またはテーブルのエイリアスで修飾できます。たとえば、mytable というテーブルのすべての列を渡すには、次のように指定します。

    ```sql
    (mytable.*)
    ```

## 注意事項
- パラメータの数は偶数である必要があります。0 個も指定でき、その場合は空の JSON オブジェクトを返します。
- 通常、パラメータはキーと値を交互に指定します。
- キーは JSON の定義に従って強制的にテキストに変換されます。
- 渡したキーが NULL の場合は例外エラーになります。
- 値のパラメータは JSON に変換されるため、[`TO_JSON`](./to-json.md) がサポートする型である必要があります。
- 渡した値が NULL の場合、返される JSON オブジェクトでは、そのキーと値のペアの値が JSON の null になります。
- その他の型を値として使用する場合は、CAST で JSON 型または String 型に変換できます。
- 現在、Doris は JSON オブジェクト内の重複キーを排除しないため、同じキーを複数回指定できます。ただし、重複キーによって予期しない結果が生じることがあります。
    1. 他のシステムでは、重複キーに対応する値が削除されたり、エラーが報告されたりする場合があります。
    2. [`JSON_EXTRACT`](./json-extract.md) が返す結果は不確定です。

## 戻り値

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): パラメータのリストから構成される JSON オブジェクトを返します。

## 例
1. パラメータを指定しない場合
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
2. サポートされない値の型
    ```sql
    select json_object('time',curtime());
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(TIMEV2(0))
    ```
    CAST を使って String 型に変換できます。
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
3. 文字列型以外のキーは文字列に変換されます
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
4. NULL はキーとして使用できません
    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
    NULL は値として使用できます。
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

5. JSON 文字列は [`JSON_PARSE`](./json-parse.md) で JSON オブジェクトに解析してから `JSON_OBJECT` に渡せます
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
    解析しない場合は文字列として扱われます。
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
6. [`TO_JSON`](./to-json.md) がサポートしない型
    ```sql
    select json_object('key', map('abc', 'efg'));
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<VARCHAR(3),VARCHAR(3)>)
    ```

    渡す前に CAST 文で JSON 型に変換できます。
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
7. キーが重複する場合
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
