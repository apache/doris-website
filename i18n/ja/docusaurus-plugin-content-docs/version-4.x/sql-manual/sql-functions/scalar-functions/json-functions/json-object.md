---
{
    "title": "JSON_OBJECT",
    "language": "ja",
    "description": "指定したキーと値の組から JSON オブジェクトを生成します。"
}
---

## 説明

指定したキーと値の組から JSON オブジェクトを生成します。キーが NULL の場合、または引数の数が奇数の場合はエラーになります。

## 構文

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```

```sql
JSON_OBJECT(*)
```

## パラメータ

### 可変長パラメータ:

| パラメータ | 説明 |
| --- | --- |
| `<key>` | 文字列型のキー。NULL は指定できません。 |
| `<value>` | 値。複数の型を指定でき、JSON 型以外は [`TO_JSON`](./to-json.md) で自動変換されます。 |
| `*` | ワイルドカード。指定したデータの属性名をキー、対応する値を値としてオブジェクトを作ります。 |

ワイルドカードにはテーブル名または別名を付けられます。例えば mytable のすべての列を渡すには、次のように指定します。

```sql
(mytable.*)
```

## 注意事項
- 引数の数は偶数である必要があります。0 個も指定でき、その場合は空の JSON オブジェクトを返します。
- 引数にはキーと値を交互に指定します。
- JSON の定義に従い、キーは文字列に変換されます。
- キーが NULL の場合はエラーになります。
- 値には [`TO_JSON`](./to-json.md) がサポートする型を指定し、JSON に変換します。
- 値が NULL の場合、返される JSON オブジェクト内では JSON の null 値になります。
- ほかの型を値として使うには、CAST で JSON または String に変換できます。
- Doris は現在、JSON オブジェクトのキーを重複排除しません。重複キーは指定できますが、予期しない結果になる場合があります。
    1. 他のシステムは重複キーの値を破棄したり、エラーを返したりする場合があります。
    2. [`JSON_EXTRACT`](./json-extract.md) の結果は一定しません。

## 戻り値

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md) 型で、引数から構成した JSON オブジェクトを返します。キーが NULL、または引数の数が奇数の場合はエラーになります。

## 例
1. 引数なしの場合
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
    CAST で String に変換できます。
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
3. String 型以外のキーは String に変換されます
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
4. NULL をキーに指定できません
    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
    NULL は値に指定できます。
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

5. JSON 文字列は [`JSON_PARSE`](./json-parse.md) で JSON オブジェクトに変換してから `JSON_OBJECT` に渡せます
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
    変換しない場合は文字列として扱われます。
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

    CAST で JSON に変換してから渡せます。
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
