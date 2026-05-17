---
{
    "title": "转换为 FLOAT/DOUBLE",
    "language": "zh-CN",
    "description": "如果源类型是nullable，返回nullable类型；"
}
---

## From string

:::caution 行为变更
自 4.0 起，溢出时结果不再是NULL，而是+/-Infinity。
:::

### 严格模式

如果源类型是nullable，返回nullable类型；

如果源类型是非nullable，返回非nullable类型；

#### BNF定义

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

#### 规则描述

* 只支持十进制格式的数字；

* 支持科学计数法；

* 数字前面可以带有正负符号字符；

* 字符串允许有任意数量的前缀空格和后缀空格，空格字符包括：" ", "\t",  "\n", "\r", "\f", "\v"；

* 支持Infinity和NaN；

* 其它格式报错；

* 溢出转成+|-Infinity。

#### 例子

| 字符串                                 | float/double | comment         |
| ----------------------------------- | ------------ | --------------- |
| "123.456"                           | 123.456      |                 |
| "123456."                           | 123456       |                 |
| "123456"                            | 123456       |                 |
| ".123456"                           | 0.123456     |                 |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | 带前缀和后缀空白字符，带负号。 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | 科学计数法。          |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v"   | 123400       | 科学计数法，指数带正号。    |
| " \t\r\n\f\v+1.23456e-1 \t\r\n\f\v" | 0.123456     | 科学计数法，指数是负数。    |
| "Infinity"                          | Infinity     |                 |
| "NaN"                               | NaN          |                 |
| "123.456a"                          | 报错           | 非法格式。           |
| "1.7e409"                           | Infinity     | 溢出              |
| "-1.7e409"                          | -Infinity    | 溢出              |

### 非严格模式

始终返回nullable类型。

#### BNF定义

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

#### 规则描述

* 支持严格模式下的所有合法格式；

* 非法格式转成NULL值；

* 溢出转成+|-Infinity。

#### 例子

| 字符串                              | float/double | comment         |
| -------------------------------- | ------------ | --------------- |
| "123.456"                        | 123.456      |                 |
| "12345."                         | 12345        |                 |
| ".123456"                        | 0.123456     |                 |
| " \t\r\n\f\v123.456 \t\r\n\f\v"  | 123.456      | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+123.456 \t\r\n\f\v" | 123.456      | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v" | -123.456     | 带前缀和后缀空白字符，带负号。 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v" | 123400       | 科学计数法。          |
| "Infinity"                       | Infinity     |                 |
| "NaN"                            | NaN          |                 |
| "123.456a"                       | NULL         | 非法格式。           |
| "1.7e409"                        | Infinity     | 溢出              |
| "-1.7e409"                       | -Infinity    | 溢出              |

## From bool

true转成1，false转成0。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

## From integer

遵守c++ static cast语义。可能会丢失精度。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

## From float to double

遵守c++ static cast语义。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

## From double to float

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

### 规则描述

* 遵守c++ static cast语义。

* 溢出时转成+-Infinity。

### 例子

| double        | float     | Comment |
| ------------- | --------- | ------- |
| 1.79769e+308  | Infinity  | 溢出      |
| -1.79769e+308 | -Infinity | 溢出      |

## From decimal to float

Decimal类型cast成float有可能会丢失精度。

Doris的`Decimal(p, s)`类型，在内存中实际是用整数表示的，整数的值等于`Decimal实际值 * 10^s`。例如，一个`Decimal(10, 6)`的值`1234.56789`，在内存中是用整数值`1234567890`表示的。

将Decimal类型转为float或者double类型时，Doris实际是执行以下操作：`static_cast<float>(内存中的整数值) / (10 ^scale)`。

### 严格模式

溢出时转成Infinity。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Decimal(76, 6)                                                                | float     | Comment         |
| ----------------------------------------------------------------------------- | --------- | --------------- |
| 123456789.012345                                                              | 123456790 | cast成float会丢失精度 |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | 溢出              |

### 非严格模式

溢出时转成Infinity。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Decimal(76, 6)                                                                | float     | Comment          |
| ----------------------------------------------------------------------------- | --------- | ---------------- |
| 123456789.012345                                                              | 123456790 | cast成float会丢失精度。 |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | 溢出               |

## From decimal to double

目前Decimal类型有效数字最多是76位，cast成double类型不存在溢出问题，只会存在丢失精度问题。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

### 例子

| Decimal(76, 6)                                                                | double             | Comment                     |
| ----------------------------------------------------------------------------- | ------------------ | --------------------------- |
| 123456789.012345                                                              | 123456789.012345   | 有效位数是15位，cast成double不会丢失精度。 |
| 12345678901.012345                                                            | 12345678901.012344 | 有效位数是17位，cast成double会丢失精度。  |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | 1e+70              | 会丢失精度。                      |

## From date to float

### 严格模式

报错。

### 非严格模式

将date的年月日的数字按顺序拼成整数，月、日都当成两位数，不足10的在前面补一个0。然后将这个整数static\_cast成float，可能会丢失精度。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| date       | float    | Comment |
| ---------- | -------- | ------- |
| 2025-04-21 | 20250420 | 丢失精度    |

## From date to double

### 严格模式

报错。

### 非严格模式

将date的年月日的数字按顺序拼成整数，月、日都当成两位数，不足10的在前面补一个0。然后将这个整数static\_cast成double。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| date       | double   | Comment       |
| ---------- | -------- | ------------- |
| 2025-04-21 | 20250421 | 8位有效数字，不会丢失精度 |

## From datetime to float

### 严格模式

报错。

### 非严格模式

将datetime的microsend部分丢弃，然后将年、月、日、小时、分钟、秒按顺序拼接成一个整数，月、日、小时、分钟、秒都当成两位数，不足10的在前面补一个0。然后将这个整数static\_cast成float，会丢失精度。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| datetime                   | float          | Comment |
| -------------------------- | -------------- | ------- |
| 2025-03-14 17:00:01.123456 | 20250314000000 | 丢失精度    |
| 9999-12-31 23:59:59.999999 | 99991234000000 | 丢失精度    |

## From datetime to double

### 严格模式

报错。

### 非严格模式

将datetime的microsend部分丢弃，然后将年、月、日、小时、分钟、秒按顺序拼接成一个整数，月、日、小时、分钟、秒都当成两位数，不足10的在前面补一个0。然后将这个整数static\_cast成double。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| datetime                   | double          | Comment        |
| -------------------------- | --------------- | -------------- |
| 2025-03-14 17:00:01.123456 |  20250314170001 | 14位有效数字，不会丢失精度 |
| 9999-12-31 23:59:59.999999 |  99991231235959 |                |

## From time

### 严格模式

报错

### 非严格模式

转换成以微秒为单位的float/double数字。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Time             | float         | Comment |
| ---------------- | ------------- | ------- |
| 00:00:01         | 1000000       |         |
| 838:59:58        | 3020398000000 |         |
| 838:59:58.123456 | 3020398123456 |         |

## From其它类型

不支持