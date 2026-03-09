---
{
  "title": "FLOAT/DOUBLEに変換",
  "language": "ja",
  "description": "ソース型がnullableの場合、nullable型を返す；"
}
---
## 文字列から

:::caution 動作変更
バージョン4.0以降、オーバーフローの結果はNULLではなく+/-Infinityになります。
:::

### 厳密モード

ソース型がnullable型の場合、nullable型を返します；

ソース型がnon-nullable型の場合、non-nullable型を返します；

#### BNF定義

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```
#### ルール説明

* 10進形式の数値のみサポート；

* 科学記法をサポート；

* 数値には正または負の符号文字を前置可能；

* 文字列では任意の前置および後置空白文字を許可、以下を含む：" ", "\t", "\n", "\r", "\f", "\v"；

* InfinityとNaNをサポート；

* その他の形式ではエラーを返す；

* オーバーフローは+|-Infinityに変換される。

#### 例

| String                              | float/double | Comment                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "123456."                           | 123456       |                                          |
| "123456"                            | 123456       |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | 前置・後置空白文字あり                    |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | 前置・後置空白文字、正符号あり            |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | 前置・後置空白文字、負符号あり            |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | 科学記法                                 |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v"   | 123400       | 正の指数を持つ科学記法                    |
| " \t\r\n\f\v+1.23456e-1 \t\r\n\f\v" | 0.123456     | 負の指数を持つ科学記法                    |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | Error        | 無効な形式                               |
| "1.7e409"                           | Infinity     | オーバーフロー                           |
| "-1.7e409"                          | -Infinity    | オーバーフロー                           |

### Non-strictモード

常にnullable型を返します。

#### BNF定義

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```
#### ルールの説明

* strict modeの全ての有効な形式をサポート

* 無効な形式は NULL に変換

* オーバーフローは +|-Infinity に変換

#### 例

| String                              | float/double | Comment                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "12345."                            | 12345        |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | 前後に空白文字あり                         |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | 前後に空白文字、正符号あり                  |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | 前後に空白文字、負符号あり                  |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | 科学記法                                  |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | NULL         | 無効な形式                                |
| "1.7e409"                           | Infinity     | オーバーフロー                            |
| "-1.7e409"                          | -Infinity    | オーバーフロー                            |

## boolから

trueは1に変換、falseは0に変換されます。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

## integerから

C++のstatic castセマンティクスに従います。精度が失われる可能性があります。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

## floatからdoubleへ

C++のstatic castセマンティクスに従います。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

## doubleからfloatへ

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

### ルールの説明

* C++のstatic castセマンティクスに従います。

* オーバーフローは+-Infinityに変換されます。

### 例

| double        | float     | Comment      |
| ------------- | --------- | ------------ |
| 1.79769e+308  | Infinity  | オーバーフロー |
| -1.79769e+308 | -Infinity | オーバーフロー |

## decimalからfloatへ

Decimal型からfloatへのキャストは精度が失われる可能性があります。

DorisのDecimal(p, s)型は実際にはメモリ内で整数として表現され、その整数値はDecimal実際値 * 10^sに等しくなります。例えば、Decimal(10, 6)値1234.56789は、メモリ内で整数値1234567890として表現されます。

Decimal型をfloatやdouble型に変換する際、Dorisは実際には次の操作を実行します：static_cast<float>(メモリ内整数値) / (10^scale)。

### Strict mode

オーバーフローした場合はInfinityに変換します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Decimal(76, 6)                                                                | float     | Comment                             |
| ----------------------------------------------------------------------------- | --------- | ----------------------------------- |
| 123456789.012345                                                              | 123456790 | floatへのキャストで精度が失われます   |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | オーバーフロー                       |

### Non-strict mode

オーバーフローした場合はInfinityに変換します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Decimal(76, 6)                                                                | float     | Comment                             |
| ----------------------------------------------------------------------------- | --------- | ----------------------------------- |
| 123456789.012345                                                              | 123456790 | floatへのキャストで精度が失われます   |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | オーバーフロー                       |

## decimalからdoubleへ

現在、Decimal型は最大76桁の有効桁数を持つことができます。double型へのキャストではオーバーフローの問題はなく、精度損失の問題のみです。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

### 例

| Decimal(76, 6)                                                                | double             | Comment                                    |
| ----------------------------------------------------------------------------- | ------------------ | ------------------------------------------ |
| 123456789.012345                                                              | 123456789.012345   | 15桁の有効桁数、doubleへのキャストで精度は失われません |
| 12345678901.012345                                                            | 12345678901.012344 | 17桁の有効桁数、doubleへのキャストで精度が失われます |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | 1e+70              | 精度が失われます                            |

## dateからfloatへ

### Strict mode

エラーを返します。

### Non-strict mode

日付の年、月、日の数値を順番に連結して整数を形成し、月と日は2桁として扱い、10未満の場合は先頭に0を付けます。次に、この整数をfloatにstatic_castしますが、精度が失われる可能性があります。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| date       | float    | Comment  |
| ---------- | -------- | -------- |
| 2025-04-21 | 20250420 | 精度損失 |

## dateからdoubleへ

### Strict mode

エラーを返します。

### Non-strict mode

日付の年、月、日の数値を順番に連結して整数を形成し、月と日は2桁として扱い、10未満の場合は先頭に0を付けます。次に、この整数をdoubleにstatic_castします。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| date       | double   | Comment                    |
| ---------- | -------- | -------------------------- |
| 2025-04-21 | 20250421 | 8桁の有効桁数、精度損失なし |

## datetimeからfloatへ

### Strict mode

エラーを返します。

### Non-strict mode

datetimeのマイクロ秒部分を破棄し、年、月、日、時、分、秒を順番に連結して整数を形成し、月、日、時、分、秒は2桁として扱い、10未満の場合は先頭に0を付けます。次に、この整数をfloatにstatic_castしますが、精度が失われる可能性があります。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| datetime                   | float          | Comment  |
| -------------------------- | -------------- | -------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 | 精度損失 |
| 9999-12-31 23:59:59.999999 | 99991231235959 | 精度損失 |

## datetimeからdoubleへ

### Strict mode

エラーを返します。

### Non-strict mode

datetimeのマイクロ秒部分を破棄し、年、月、日、時、分、秒を順番に連結して整数を形成し、月、日、時、分、秒は2桁として扱い、10未満の場合は先頭に0を付けます。次に、この整数をdoubleにstatic_castします。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| datetime                   | double          | Comment                          |
| -------------------------- | --------------- | -------------------------------- |
| 2025-03-14 17:00:01.123456 |  20250314170001 | 14桁の有効桁数、精度損失なし      |
| 9999-12-31 23:59:59.999999 |  99991231235959 |                                  |

## timeから

### Strict mode

エラーを返します。

### Non-strict mode

マイクロ秒単位のfloat/double数値に変換します。

ソース型がnullableの場合、nullable型を返します。

ソース型がnon-nullableの場合、non-nullable型を返します。

#### 例

| Time             | float         | Comment |
| ---------------- | ------------- | ------- |
| 00:00:01         | 1000000       |         |
| 838:59:58        | 3020398000000 |         |
| 838:59:58.123456 | 3020398123456 |         |

## その他の型から

サポートされていません。
