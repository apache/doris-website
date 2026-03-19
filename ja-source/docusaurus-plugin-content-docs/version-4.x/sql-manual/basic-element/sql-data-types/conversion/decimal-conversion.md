---
{
  "title": "DECIMAL型へのキャスト",
  "description": "ソース型がnullableの場合、nullable型を返します；",
  "language": "ja"
}
---
## From string

### Strict mode

ソースタイプがnullableの場合、nullableタイプを返します；

ソースタイプがnon-nullableの場合、non-nullableタイプを返します；

#### BNF definition

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
#### Rule description

* 10進数のみサポート；

* 科学記数法をサポート；

* 四捨五入をサポート；

* 文字列では任意の前後の空白文字を許可、以下を含む: " ", "\t", "\n", "\r", "\f", "\v"。

* 整数部分がオーバーフローした場合はエラーを返す；

* 無効な形式の場合はエラーを返す。

#### Examples

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 四捨五入                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 前後の空白文字あり                       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 前後の空白文字あり、正符号               |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 前後の空白文字あり、負符号               |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学記数法                               |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 正の指数を持つ科学記数法                 |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 負の指数を持つ科学記数法                 |
| "123.456a"                        | Error          | 無効な形式                               |
| "1234567890123.123456"            | Error          | オーバーフロー                           |

### Non-strict mode

常にnullable型を返す；

#### BNF definition

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

* strict modeのすべての有効な形式をサポート

* オーバーフローが発生した場合、NULLに変換

* 無効な形式の場合、NULLに変換

#### 例

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 四捨五入                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 前後の空白文字あり                       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 前後の空白文字、正の符号あり             |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 前後の空白文字、負の符号あり             |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学記法                                 |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 正の指数を持つ科学記法                   |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 負の指数を持つ科学記法                   |
| "123.456a"                        | NULL           | 無効な形式                               |
| "1234567890123.123456"            | NULL           | オーバーフロー                           |

## boolから

trueは1に変換、falseは0に変換されます。

### Strict mode

オーバーフローが発生した場合エラー（例：`cast bool as decimal(1, 1)`）

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

### Non-strict mode

オーバーフローが発生した場合、NULLに変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローの可能性がある場合（例：`cast bool as decimal(1, 1)`）、nullable型を返します

* そうでなければnon-nullable型を返します。

## integerから

### Strict mode

オーバーフローが発生した場合エラー。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | Error          | オーバーフロー |

### Non-strict mode

オーバーフローが発生した場合、NULLに変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローの可能性がある場合（例：`cast int as decimal(1, 0)`）、nullable型を返します

* そうでなければnon-nullable型を返します（例：`cast int as decimal(18, 0)`）。

#### 例

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | NULL           | オーバーフロー |

## float/doubleから

四捨五入をサポート。

### Strict mode

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

* InfinityとNaNはエラーを引き起こします。

* オーバーフローが発生した場合エラー。

#### 例

| float/double | Decimal(18, 3) | Comment |
| ------------ | -------------- | ------- |
| 1.1239       | 1.124          | 四捨五入 |
| 3.40282e+38  | Error          | オーバーフロー |
| Infinity     | Error          |         |
| NaN          | Error          |         |

### Non-strict mode

常にnullable型を返します。

* +/-InfはNULLに変換

* NaNはNULLに変換

* オーバーフローが発生した場合、NULLに変換

#### 例

| float/double | Decimal(18, 6) | Comment |
| ------------ | -------------- | ------- |
| 1.123456     | 1.123456       |         |
| 3.40282e+38  | NULL           | オーバーフロー |
| Infinity     | NULL           |         |
| NaN          | NULL           |         |

## decimal間のキャスト

四捨五入をサポート。

### Strict mode

オーバーフローが発生した場合エラー。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 四捨五入 |
| 12345.12345678 | Error          | 整数部のオーバーフロー |

### Non-strict mode

オーバーフローが発生した場合、NULLに変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合：

* オーバーフローの可能性がある場合（例：`cast decimal(18, 0) as decimal(9, 0)`）、nullable型を返します

* そうでなければnon-nullable型を返します（例：`cast decimal(9, 0) as decimal(18, 0)`）。

#### 例

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 四捨五入 |
| 12345.12345678 | NULL           | 整数部のオーバーフロー |

## dateから

サポートされていません。

## datetimeから

サポートされていません。

## timeから

サポートされていません。

## その他の型から

サポートされていません
