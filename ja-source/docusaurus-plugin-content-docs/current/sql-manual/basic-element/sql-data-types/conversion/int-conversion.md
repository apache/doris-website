---
{
  "title": "INT型へのキャスト",
  "language": "ja",
  "description": "ソース型がnullableの場合、nullable型を返す；"
}
---
## 文字列から

### Strictモード

ソースタイプがnullableの場合、nullableタイプを返します；

ソースタイプがnon-nullableの場合、non-nullableタイプを返します；

#### BNF定義

```xml
<integer>       ::= <whitespace>* <sign>? <decimal_digit>+ <whitespace>*

<sign>          ::= "+" | "-"

<decimal_digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```
#### ルール説明

* 10進形式の数値のみをサポート

* 数値には正または負の符号文字を前置可能

* 文字列では任意の前置および後置の空白文字を許可（' ', '\t', '\n', '\r', '\f', '\v' を含む）

* 科学記数法はサポートしない

* その他の形式についてはエラーを返す

* オーバーフローの場合はエラーを返す

#### 例

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | 前置・後置空白文字あり       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | 前置・後置空白文字あり、正の符号 |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | 前置・後置空白文字あり、負の符号 |
| 'abc'                               | Error              | 無効な形式                           |
| '123.456'                           | Error              | 小数点形式はサポートされない             |
| '1.23456e5'                         | Error              | 科学記数法はサポートされない        |
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

* strict modeからの全ての有効な形式をサポート；

* 小数部が続くstrict mode形式をサポート、変換結果は小数部を直接切り捨て；

* 科学記数法形式はNULLに変換；

* その他の全ての形式の場合はNULLに変換；

* オーバーフローが発生した場合はNULLに変換。

#### 例

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | プレフィックスとサフィックスの空白文字あり       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | プレフィックスとサフィックスの空白文字、正の符号あり |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | プレフィックスとサフィックスの空白文字、負の符号あり |
| '123.456'                           | 123                |                                          |
| '1.23456e5'                         | NULL               | 科学記数法                      |
| 'abc'                               | NULL               | 無効な形式                           |
| '2147483648'                        | NULL               | オーバーフロー                                 |
| '-2147483649'                       | NULL               | オーバーフロー                                 |

## boolから

trueは1に変換、falseは0に変換。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

## 整数から整数へ

任意の整数型間の変換をサポート。

### Strict mode

オーバーフローが発生した場合はエラーを返す。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

#### 例

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | Error      | オーバーフロー |
| -2147483649 | Error      | オーバーフロー |

### Non-strict mode

:::caution 動作変更
バージョン4.0以降、オーバーフローの結果は未定義値ではなく、NULLになります。
:::

オーバーフローが発生した場合はNULLを返す。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast bigint as int`）、nullable型を返す；

* それ以外の場合はnon-nullable型を返す（例：`cast int as bigint`）。

#### 例

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | NULL       | オーバーフロー |
| -2147483649 | NULL       | オーバーフロー |

## dateから

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

### ルール説明

:::caution 動作変更
バージョン4.0以降、dateからtinyintおよびsmallintへのキャストはサポートされなくなりました。
:::

* tinyintおよびsmallintへのキャストはサポートしない。オーバーフローが必ず発生するため。

* int、bigint、largeintへのキャストをサポート。日付の年、月、日の数値を順番に連結して整数を形成し、月と日は2桁として扱い、10未満の場合は先頭に0を埋める。

### 例

| date       | int      |
| ---------- | -------- |
| 2025-03-14 | 20250314 |

## datetimeから

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

### ルール説明

:::caution 動作変更
バージョン4.0以降、datetimeからtinyint、smallint、intへのキャストはサポートされなくなりました。
:::

* tinyint、smallint、intへのキャストはサポートしない。オーバーフローが必ず発生するため；

* bigint、largeintへのキャストをサポート。datetimeのマイクロ秒部分を破棄し、年、月、日、時、分、秒を順番に連結して整数を形成し、月、日、時、分、秒は2桁として扱い、10未満の場合は先頭に0を埋める。

### 例

| datetime                   | int            |
| -------------------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 |
| 9999-12-31 23:59:59.999999 | 99991231235959 |

## float/doubleから

四捨五入はサポートしない。

### Strict mode

#### ルール説明

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

* オーバーフローが発生した場合はエラーを返す；

* InfinityおよびNaN値の場合はエラーを返す。

#### 例

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 切り捨て |
| 1.79769E308  | Error       | オーバーフロー |
| Infinity     | Error       |         |
| NaN          | Error       |         |

### Non-strict mode

常にnullable型を返す。

#### ルール説明

:::caution 動作変更
バージョン4.0以降、オーバーフローの結果は未定義値ではなく、NULLになります。
:::

* オーバーフローが発生した場合はNULLに変換；

* InfinityはNULLに変換；

* NaNはNULLに変換。

#### 例

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 切り捨て |
| 1.79769E308  | NULL        | オーバーフロー |
| Infinity     | NULL        |         |
| -Infinity    | NULL        |         |
| NaN          | NULL        |         |

## decimalから

四捨五入はサポートしない。

### Strict mode

オーバーフローが発生した場合はエラーを返す。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

#### 例

| Decimal(18, 6)  | int   | comment    |
| --------------- | ----- | ---------- |
| 1.654321        | 1     | 切り捨て |
| 12345678901.123 | Error | オーバーフロー   |

### Non-strict mode

オーバーフローが発生した場合はNULLに変換。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast decimal(18, 0) as int`）、nullable型を返す；

* それ以外の場合はnon-nullable型を返す（例：`cast decimal(9, 0) as bigint`）。

#### 例

| Decimal(18, 6)  | int  | comment    |
| --------------- | ---- | ---------- |
| 1.654321        | 1    | 切り捨て |
| 12345678901.123 | NULL | オーバーフロー   |

## timeから

マイクロ秒に変換。

### Strict mode

オーバーフローが発生した場合はエラーを返す。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合、non-nullable型を返す。

#### 例

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | Error   | オーバーフロー |

### Non-strict mode

:::caution 動作変更
バージョン4.0以降、オーバーフローの結果は未定義値ではなく、NULLになります。
:::

オーバーフローが発生した場合はNULLに変換。

ソース型がnullableの場合、nullable型を返す。

ソース型がnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast time as tinyint`）、nullable型を返す；

* それ以外の場合はnon-nullable型を返す（例：`cast time as bigint`）。

#### 例

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | NULL    | オーバーフロー |

## その他の型

サポートしない
