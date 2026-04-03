---
{
  "title": "INT型へのキャスト",
  "description": "ソース型がnullableの場合、nullable型を返します；",
  "language": "ja"
}
---
## 文字列から

### Strict mode

ソース型がnullable型の場合、nullable型を返します；

ソース型がnon-nullable型の場合、non-nullable型を返します；

#### BNF定義

```xml
<integer>       ::= <whitespace>* <sign>? <decimal_digit>+ <whitespace>*

<sign>          ::= "+" | "-"

<decimal_digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```
#### ルール説明

* 10進数フォーマットの数値のみをサポート；

* 数値には正または負の符号文字を前置できる；

* 文字列では任意の前置および後置の空白文字を許可する。これには以下が含まれる： ' ', '\t', '\n', '\r', '\f', '\v'；

* 科学記数法はサポートしない；

* その他のフォーマットではエラーを返す；

* オーバーフローした場合はエラーを返す。

#### 例

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | 前置および後置の空白文字あり       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | 前置および後置の空白文字、正の符号あり |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | 前置および後置の空白文字、負の符号あり |
| 'abc'                               | Error              | 無効なフォーマット                           |
| '123.456'                           | Error              | 小数点フォーマットはサポートされていない             |
| '1.23456e5'                         | Error              | 科学記数法はサポートされていない        |
| '2147483648'                        | Error              | オーバーフロー                                 |
| '-2147483649'                       | Error              | オーバーフロー                                 |

### Non-strictモード

常にnullable型を返す。

#### BNF定義

```xml
<integer_non_strict> ::= <whitespace_char>* <sign>? <number> <whitespace_char>*

<sign>               ::= "+" | "-"

<number>             ::= <decimal_number> | <decimal_number> "." <decimal_number> | <decimal_number> "." | "." <decimal_number>

<decimal_number>     ::= <decimal_digit>+

<decimal_digit>      ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace_char>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```
#### ルール説明

* strict modeの全ての有効な形式をサポートします。

* 小数部が続くstrict mode形式をサポートし、変換結果は小数部を直接破棄します。

* 科学的記数法形式はNULLに変換されます。

* その他の全ての形式の場合はNULLに変換されます。

* オーバーフローが発生した場合はNULLに変換されます。

#### 例

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | With prefix and suffix whitespace       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | With prefix and suffix whitespace, negative sign |
| '123.456'                           | 123                |                                          |
| '1.23456e5'                         | NULL               | Scientific notation                      |
| 'abc'                               | NULL               | Invalid format                           |
| '2147483648'                        | NULL               | Overflow                                 |
| '-2147483649'                       | NULL               | Overflow                                 |

## boolから

trueは1に変換され、falseは0に変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

## integerからintegerへ

任意のinteger型間の変換をサポートします。

### Strict mode

オーバーフローが発生した場合はエラーを返します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | Error      | Overflow |
| -2147483649 | Error      | Overflow |

### Non-strict mode

:::caution Behavior Change
Since version 4.0, the result of overflow is no longer undefined value, but NULL.
:::

オーバーフローが発生した場合はNULLを返します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast bigint as int`）、nullable型を返します。

* それ以外の場合はnon-nullable型を返します（例：`cast int as bigint`）。

#### 例

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | NULL       | Overflow |
| -2147483649 | NULL       | Overflow |

## dateから

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

### ルール説明

:::caution Behavior Change
Since version 4.0, does not support casting date to tinyint and smallint anymore.
:::

* オーバーフローが確実に発生するため、tinyintとsmallintへのキャストはサポートしません。

* int、bigint、largeintへのキャストをサポートします。dateの年、月、日の数値を順番に連結して整数を形成し、月と日は2桁として扱い、10未満の場合は先頭に0を付けます。

### 例

| date       | int      |
| ---------- | -------- |
| 2025-03-14 | 20250314 |

## datetimeから

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

### ルール説明

:::caution Behavior Change
Since version 4.0, does not support casting datetime to tinyint, smallint and int anymore.
:::

* オーバーフローが確実に発生するため、tinyint、smallint、intへのキャストはサポートしません。

* bigint、largeintへのキャストをサポートします。datetimeのマイクロ秒部分を破棄し、年、月、日、時、分、秒を順番に連結して整数を形成し、月、日、時、分、秒は2桁として扱い、10未満の場合は先頭に0を付けます。

### 例

| datetime                   | int            |
| -------------------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 |
| 9999-12-31 23:59:59.999999 | 99991231235959 |

## float/doubleから

四捨五入はサポートしません。

### Strict mode

#### ルール説明

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

* オーバーフローが発生した場合はエラーを返します。

* InfinityとNaN値に対してはエラーを返します。

#### 例

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | Truncation |
| 1.79769E308  | Error       | Overflow |
| Infinity     | Error       |         |
| NaN          | Error       |         |

### Non-strict mode

常にnullable型を返します。

#### ルール説明

:::caution Behavior Change
Since version 4.0, the result of overflow is no longer undefined value, but NULL.
:::

* オーバーフローが発生した場合はNULLに変換されます。

* InfinityはNULLに変換されます。

* NaNはNULLに変換されます。

#### 例

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | Truncation |
| 1.79769E308  | NULL        | Overflow |
| Infinity     | NULL        |         |
| -Infinity    | NULL        |         |
| NaN          | NULL        |         |

## decimalから

四捨五入はサポートしません。

### Strict mode

オーバーフローが発生した場合はエラーを返します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Decimal(18, 6)  | int   | comment    |
| --------------- | ----- | ---------- |
| 1.654321        | 1     | Truncation |
| 12345678901.123 | Error | Overflow   |

### Non-strict mode

オーバーフローが発生した場合はNULLに変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast decimal(18, 0) as int`）、nullable型を返します。

* それ以外の場合はnon-nullable型を返します（例：`cast decimal(9, 0) as bigint`）。

#### 例

| Decimal(18, 6)  | int  | comment    |
| --------------- | ---- | ---------- |
| 1.654321        | 1    | Truncation |
| 12345678901.123 | NULL | Overflow   |

## timeから

マイクロ秒に変換されます。

### Strict mode

オーバーフローが発生した場合はエラーを返します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | Error   | Overflow |

### Non-strict mode

:::caution Behavior Change
Since version 4.0, the result of overflow is no longer undefined value, but NULL.
:::

オーバーフローが発生した場合はNULLに変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast time as tinyint`）、nullable型を返します。

* それ以外の場合はnon-nullable型を返します（例：`cast time as bigint`）。

#### 例

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | NULL    | Overflow |

## その他の型

サポートされていません
