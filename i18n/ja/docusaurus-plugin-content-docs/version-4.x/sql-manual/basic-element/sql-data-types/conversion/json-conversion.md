---
{
    "title": "JSON へのキャストと JSON からのキャスト",
    "language": "ja",
    "description": "Doris の JSON 型はテキスト形式ではなくバイナリ形式でデータを保存し、処理と保存の効率を高めます。"
}
---

Doris の JSON 型はテキスト形式ではなくバイナリ形式でデータを保存し、処理と保存の効率を高めます。 JSON の型と Doris の内部型は一対一に対応しています。

## JSON へのキャスト

### 文字列から

文字列を JSON にキャストする場合、文字列の内容は [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159) で定義された有効な JSON 構文に従う必要があります。パーサーは文字列を検証し、対応する JSON のバイナリ形式に変換します。

#### 文字列の解析ルール

- 文字列に有効な JSON 構造（オブジェクト、配列、数値、真偽値、または null）が含まれる場合、対応する JSON 型として解析されます。
  ```sql
  mysql> SELECT CAST('[1,2,3,4]' AS JSON); -- Output: [1,2,3,4] (parsed as JSON array)
  +---------------------------+
  | CAST('[1,2,3,4]' AS JSON) |
  +---------------------------+
  | [1,2,3,4]                 |
  +---------------------------+
  ```

- 文字列を解析せず、その文字列自体を JSON の文字列値として扱うには、`TO_JSON` 関数を使用します。
  ```sql
  mysql> SELECT TO_JSON('[1,2,3,4]'); -- Output: "[1,2,3,4]" (a JSON string with quotes)
  +----------------------+
  | TO_JSON('[1,2,3,4]') |
  +----------------------+
  | "[1,2,3,4]"          |
  +----------------------+
  ```

#### 数値の解析ルール

JSON 文字列から数値を解析する場合は、次のルールが適用されます。

- 数値に小数点が含まれる場合は、JSON の Double 型に変換されます。
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key');
  +------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key')   |
  +------------------------------------------------------+
  | double                                               |
  +------------------------------------------------------+
  ```

- 数値が整数の場合は、値を表現できる最小の整数型で保存されます。
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key');
  +---------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key')   |
  +---------------------------------------------------------+
  | int                                                     |
  +---------------------------------------------------------+
  ```

  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key');
  +-------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key')   |
  +-------------------------------------------------------------+
  | bigint                                                      |
  +-------------------------------------------------------------+
  ```

- 整数が Int128 の範囲を超える場合は double として保存され、精度が失われる可能性があります。
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key');
  +--------------------------------------------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key')   |
  +--------------------------------------------------------------------------------------------------+
  | double                                                                                           |
  +--------------------------------------------------------------------------------------------------+
  ```

#### エラー処理

文字列を JSON として解析する際の動作は、次のとおりです。
- 厳格モード（デフォルト）では、無効な JSON 構文によってエラーが発生します。
- 非厳格モードでは、無効な JSON 構文に対して NULL が返されます。

```sql
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
+-----------------------------+
| CAST('{"invalid JSON' AS JSON) |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> SET enable_strict_cast = true;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Failed to parse json string: {"invalid JSON, ...
```

### その他の Doris 型から

次の Doris 型は、精度を失うことなく JSON に直接キャストできます。

| Doris 型 | JSON 型 |
|------------|-----------|
| BOOLEAN | Bool |
| TINYINT | Int8 |
| SMALLINT | Int16 |
| INT | Int32 |
| BIGINT | Int64 |
| LARGEINT | Int128 |
| FLOAT | Float |
| DOUBLE | Double |
| DECIMAL | Decimal |
| STRING | String |
| ARRAY | Array |
| STRUCT | Object |

#### 例

```sql
-- Integer array to JSON
mysql> SELECT CAST(ARRAY(123,456,789) AS JSON);
+----------------------------------+
| CAST(ARRAY(123,456,789) AS JSON) |
+----------------------------------+
| [123,456,789]                    |
+----------------------------------+

-- Decimal array to JSON (preserves precision)
mysql> SELECT CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON);
+--------------------------------------------------------------------------+
| CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON)  |
+--------------------------------------------------------------------------+
| [12345678.123456780000000000,0.000000010000000000,12.000000000000000001] |
+--------------------------------------------------------------------------+
```

#### 直接サポートされない型

上の表にない型は、JSON に直接キャストできません。

```sql
mysql> SELECT CAST(MAKEDATE(2021, 1) AS JSON);
ERROR 1105 (HY000): CAST AS JSONB can only be performed between JSONB, String, Number, Boolean, Array, Struct types. Got Date to JSONB
```

対処方法: まず互換性のある型にキャストし、次に JSON にキャストします。

```sql
mysql> SELECT CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON);
+---------------------------------------------------+
| CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON)   |
+---------------------------------------------------+
| 20210101                                          |
+---------------------------------------------------+
```

## JSON からのキャスト

:::caution 動作の変更
バージョン 4.0 より前の Doris では、JSON の CAST に対する条件がより緩く、オーバーフローが適切に処理されていませんでした。

バージョン 4.0 以降、JSON の CAST でオーバーフローが発生すると、厳格モードではエラーとなり、非厳格モードでは null が返されます。
:::

### BOOLEAN へ

JSON の Bool、Number、String 型は BOOLEAN にキャストできます。

```sql
-- From JSON Bool
mysql> SELECT CAST(CAST('true' AS JSON) AS BOOLEAN);
+---------------------------------------+
| CAST(CAST('true' AS JSON) AS BOOLEAN) |
+---------------------------------------+
|                                     1 |
+---------------------------------------+

-- From JSON Number
mysql> SELECT CAST(CAST('123' AS JSON) AS BOOLEAN);
+--------------------------------------+
| CAST(CAST('123' AS JSON) AS BOOLEAN) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+

-- From JSON String (must contain valid boolean representation)
mysql> SELECT CAST(TO_JSON('true') AS BOOLEAN);
+----------------------------------+
| CAST(TO_JSON('true') AS BOOLEAN) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

### 数値型へ

JSON の Bool、Number、String 型は、数値型（TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL）にキャストできます。

```sql
-- From JSON Number to INT
mysql> SELECT CAST(CAST('123' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('123' AS JSON) AS INT) |
+----------------------------------+
|                              123 |
+----------------------------------+

-- From JSON Bool to numeric types
mysql> SELECT CAST(CAST('true' AS JSON) AS INT), CAST(CAST('false' AS JSON) AS DOUBLE);
+-----------------------------------+--------------------------------------+
| CAST(CAST('true' AS JSON) AS INT) | CAST(CAST('false' AS JSON) AS DOUBLE) |
+-----------------------------------+--------------------------------------+
|                                 1 |                                    0 |
+-----------------------------------+--------------------------------------+
```

より小さい型にキャストする場合は、数値のオーバーフローに関するルールが適用されます。

```sql
-- In strict mode, overflow causes error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
ERROR 1105 (HY000): Cannot cast from jsonb value type 12312312312312311 to doris type INT

-- In non-strict mode, overflow returns NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
+-----------------------------------------+
| CAST(TO_JSON(12312312312312311) AS INT) |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

### STRING へ

どの JSON 型も STRING にキャストでき、JSON のテキスト表現が生成されます。

```sql
mysql> SELECT CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING);
+----------------------------------------------------------+
| CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING) |
+----------------------------------------------------------+
| {"key1":"value1","key2":123}                             |
+----------------------------------------------------------+

mysql> SELECT CAST(CAST('true' AS JSON) AS STRING);
+--------------------------------------+
| CAST(CAST('true' AS JSON) AS STRING) |
+--------------------------------------+
| true                                 |
+--------------------------------------+
```

### ARRAY へ

JSON の Array 型と String 型は、Doris の ARRAY 型にキャストできます。

```sql
mysql> SELECT CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>);
+-------------------------------------------+
| CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>) |
+-------------------------------------------+
| [1, 2, 3]                                 |
+-------------------------------------------+

-- Type conversion within array elements
mysql> SELECT CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>);
+-------------------------------------------------+
| CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>) |
+-------------------------------------------------+
| [1, 2, 3]                                       |
+-------------------------------------------------+

-- Convert string to array
mysql> SELECT CAST(TO_JSON("['123','456']") AS ARRAY<INT>);
+----------------------------------------------+
| CAST(TO_JSON("['123','456']") AS ARRAY<INT>) |
+----------------------------------------------+
| [123, 456]                                   |
+----------------------------------------------+
```

配列の各要素は、標準のキャストルールに従って個別に変換されます。

```sql
-- In non-strict mode, invalid elements become NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
+---------------------------------------------------+
| CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>) |
+---------------------------------------------------+
| [10, 20, null]                                    |
+---------------------------------------------------+

-- In strict mode, invalid elements cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
ERROR 1105 (HY000): Cannot cast from jsonb value type 200 to doris type TINYINT
```

### STRUCT へ

JSON の Object 型と String 型は、Doris の STRUCT 型にキャストできます。

```sql
mysql> SELECT CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>);
+------------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>) |
+------------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                   |
+------------------------------------------------------------------------------+

mysql> SELECT CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>);
+----------------------------------------------------------------------------+
| CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>) |
+----------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                 |
+----------------------------------------------------------------------------+
```

STRUCT の各フィールドは、指定された型に従って個別に変換されます。

```sql
mysql> SELECT CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>);
+--------------------------------------------------------------------------------------------------------------------------+
| CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>) |
+--------------------------------------------------------------------------------------------------------------------------+
| {"key1":[123.45, 678.9], "key2":[12312313]}                                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
```

JSON と STRUCT の定義では、フィールドの数と名前が一致している必要があります。

```sql
-- In non-strict mode, mismatched fields return NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
+-------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>) |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

-- In strict mode, mismatched fields cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
ERROR 1105 (HY000): jsonb_value field size 2 is not equal to struct size 1
```

### JSON の null の扱い

JSON の null と SQL の NULL は異なります。

- JSON フィールドに null 値が含まれる場合、任意の Doris 型にキャストすると SQL の NULL になります。

```sql
mysql> SELECT CAST(CAST('null' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('null' AS JSON) AS INT) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

## 型変換の概要

| JSON 型 | キャスト可能な型 |
|-----------|---------------|
| Bool | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| Null | （常に SQL の NULL に変換） |
| Number | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| String | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING, ARRAY, STRUCT |
| Array | STRING, ARRAY |
| Object | STRING, STRUCT |

### キーワード
JSON, JSONB, CAST, 型変換, to_json
