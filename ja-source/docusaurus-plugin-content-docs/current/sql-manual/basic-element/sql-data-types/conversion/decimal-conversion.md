---
{
  "title": "DECIMAL型へのキャスト",
  "language": "ja",
  "description": "ソースタイプがnullableの場合、nullable typeを返します；"
}
---
## 文字列から

### 厳密モード

ソース型がnullableの場合、nullable型を返します；

ソース型がnon-nullableの場合、non-nullable型を返します；

#### BNF定義

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>?

<sign>        ::= "+" | "-"

<significand> ::= <digits> "." <digits> | <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```
#### ルール説明

* 10進数のみサポート；

* 科学記数法をサポート；

* 丸めをサポート；

* 文字列では任意の前置きと後置きの空白文字を許可。含まれるもの: " ", "\t", "\n", "\r", "\f", "\v"。

* 整数部がオーバーフローした場合はエラーを返す；

* 無効なフォーマットの場合はエラーを返す。

#### 例

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 丸め                                     |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 前置きと後置きの空白文字あり             |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 前置きと後置きの空白文字あり、正の符号   |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 前置きと後置きの空白文字あり、負の符号   |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学記数法                               |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 正の指数による科学記数法                 |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 負の指数による科学記数法                 |
| "123.456a"                        | Error          | 無効なフォーマット                       |
| "1234567890123.123456"            | Error          | オーバーフロー                           |

### 非厳密モード

常にnull許可型を返す；

#### BNF定義

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```
#### ルールの説明

* strict modeからすべての有効な形式をサポート

* オーバーフローが発生した場合はNULLに変換

* 無効な形式の場合はNULLに変換

#### 例

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 丸め処理                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 前後に空白文字あり                       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 前後に空白文字あり、正の符号             |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 前後に空白文字あり、負の符号             |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学記法                                 |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 正の指数を持つ科学記法                   |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 負の指数を持つ科学記法                   |
| "123.456a"                        | NULL           | 無効な形式                               |
| "1234567890123.123456"            | NULL           | オーバーフロー                           |

## boolから

trueは1に変換され、falseは0に変換されます。

### Strict mode

オーバーフローが発生した場合はエラーになります（例：`cast bool as decimal(1, 1)`）。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合、non-nullable型を返します。

### Non-strict mode

オーバーフローが発生した場合はNULLに変換されます。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast bool as decimal(1, 1)`）、nullable型を返します

* そうでなければnon-nullable型を返します。

## integerから

### Strict mode

オーバーフローが発生した場合はエラーになります。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合、non-nullable型を返します。

#### 例

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | Error          | オーバーフロー |

### Non-strict mode

オーバーフローが発生した場合はNULLに変換されます。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast int as decimal(1, 0)`）、nullable型を返します

* そうでなければnon-nullable型を返します（例：`cast int as decimal(18, 0)`）。

#### 例

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | NULL           | オーバーフロー |

## float/doubleから

丸め処理をサポートしています。

### Strict mode

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合、non-nullable型を返します。

* InfinityとNaNはエラーを引き起こします。

* オーバーフローが発生した場合はエラーになります。

#### 例

| float/double | Decimal(18, 3) | Comment |
| ------------ | -------------- | ------- |
| 1.1239       | 1.124          | 丸め処理 |
| 3.40282e+38  | Error          | オーバーフロー |
| Infinity     | Error          |         |
| NaN          | Error          |         |

### Non-strict mode

常にnullable型を返します。

* +/-InfはNULLに変換されます

* NaNはNULLに変換されます

* オーバーフローが発生した場合はNULLに変換されます。

#### 例

| float/double | Decimal(18, 6) | Comment |
| ------------ | -------------- | ------- |
| 1.123456     | 1.123456       |         |
| 3.40282e+38  | NULL           | オーバーフロー |
| Infinity     | NULL           |         |
| NaN          | NULL           |         |

## decimal間のcast

丸め処理をサポートしています。

### Strict mode

オーバーフローが発生した場合はエラーになります。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合、non-nullable型を返します。

#### 例

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 丸め処理 |
| 12345.12345678 | Error          | 整数部のオーバーフロー |

### Non-strict mode

オーバーフローが発生した場合はNULLに変換されます。

ソースタイプがnullableの場合、nullable型を返します。

ソースタイプがnon-nullableの場合：

* オーバーフローが可能な場合（例：`cast decimal(18, 0) as decimal(9, 0)`）、nullable型を返します

* そうでなければnon-nullable型を返します（例：`cast decimal(9, 0) as decimal(18, 0)`）。

#### 例

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 丸め処理 |
| 12345.12345678 | NULL           | 整数部のオーバーフロー |

## dateから

サポートされていません。

## datetimeから

サポートされていません。

## timeから

サポートされていません。

## その他の型から

サポートされていません
