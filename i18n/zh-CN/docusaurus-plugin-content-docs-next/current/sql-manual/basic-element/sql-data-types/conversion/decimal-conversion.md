---
{
    "title": "转换为 DECIMAL 类型",
    "language": "zh-CN",
    "description": "如果源类型是nullable，返回nullable类型；"
}
---

## From string

### 严格模式

如果源类型是nullable，返回nullable类型；

如果源类型是非nullable，返回非nullable类型；

#### BNF定义

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

#### 规则描述

* 只支持十进制数字；

* 支持科学计数法；

* 支持四舍五入；

* 字符串允许有任意数量的前缀空格和后缀空格，空格字符包括：" ", "\t",  "\n", "\r", "\f", "\v"。

* 整数部分溢出时报错；

* 非法格式报错。

#### 例子

| 字符串                               | Decimal(18, 6) | comment         |
| --------------------------------- | -------------- | --------------- |
| "123.1234567"                     | 123.123457     | 四舍五入            |
| "12345."                          | 12345.000000   |                 |
| "12345"                           | 12345.000000   |                 |
| ".123456"                         | 0.123456       |                 |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 带前缀和后缀空白字符，带负号。 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学计数法。          |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 科学计数法，指数带正号。    |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 科学计数法，指数带负号。    |
| "123.456a"                        | 报错             | 非法格式。           |
| "1234567890123.123456"            | 报错             | 溢出              |

### 非严格模式

始终返回nullable类型；

#### BNF定义

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

#### 规则描述

* 支持严格模式下的所有合法格式；

* 溢出时转成NULL值；

* 非法格式转成NULL值。

#### 例子

| 字符串                               | Decimal(18, 6) | comment         |
| --------------------------------- | -------------- | --------------- |
| "123.1234567"                     | 123.123457     | 四舍五入            |
| "12345."                          | 12345.000000   |                 |
| "12345"                           | 12345.000000   |                 |
| ".123456"                         | 0.123456       |                 |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 带前缀和后缀空白字符，带负号。 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 科学计数法。          |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 科学计数法，指数带正号。    |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 科学计数法，指数带负号。    |
| "123.456a"                        | NULL             | 非法格式。           |
| "1234567890123.123456"            | NULL             | 溢出              |

## From bool

true转成1，false转成0。

### 严格模式

溢出时报错（比如`cast bool as decimal(1, 1)`）。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

### 非严格模式

溢出时转成NULL。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出（比如`cast bool as decimal(1, 1)`），返回nullable类型；

* 否则返回非nullable类型。

## From integer

### 严格模式

溢出时报错。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | 报错             | 溢出      |

### 非严格模式

溢出时转成NULL值。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出(比如`cast int as decimal(1, 0)`)，返回nullable类型；

* 否则返回非nullable类型（比如`cast int as decimal(18, 0)`）。

#### 例子

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | NULL           | 溢出      |

## From float/double

支持四舍五入。

### 严格模式

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

* Infinity和NaN报错。

* 溢出时报错。

#### 例子

| float/double | Decimal(18, 3) | Comment |
| ------------ | -------------- | ------- |
| 1.1239       | 1.124          | 四舍五入    |
| 3.40282e+38  | 报错             | 溢出      |
| Infinity     | 报错             |         |
| NaN          | 报错             |         |

### 非严格模式

始终返回nullable类型。

* +/-Inf转成NULL；

* NaN转成NULL；

* 溢出时转成NULL。

#### 例子

| float/double | Decimal(18, 6)      | Comment |
| ------------ | ------------------- | ------- |
| 1.123456     | 1.123456            |         |
| 3.40282e+38  | NULL                | 溢出     |
| Infinity     | NULL                |         |
| NaN          | NULL                |         |

## Cast  between decimals

支持四舍五入。

### 严格模式

溢出报错。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 四舍五入    |
| 12345.12345678 | 报错             | 整数部分溢出  |

### 非严格模式

溢出转成NULL值。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出(比如`cast decimal(18, 0) as decimal(9, 0)`)，返回nullable类型；

* 否则返回非nullable类型（比如`cast decimal(9, 0) as decimal(18, 0)`）。

#### 例子

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 四舍五入    |
| 12345.12345678 | NULL           | 整数部分溢出  |

## From  date

不支持。

## From datetime

不支持。

## From time

不支持。

## From其它类型

不支持
