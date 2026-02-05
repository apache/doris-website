---
{
    "title": "转换为 INT 类型",
    "language": "zh-CN",
    "description": "如果源类型是nullable，返回nullable类型；"
}
---

## From string

### 严格模式

如果源类型是nullable，返回nullable类型；

如果源类型是非nullable，返回非nullable类型。

#### BNF定义

```xml
<integer>       ::= <whitespace>* <sign>? <decimal_digit>+ <whitespace>*

<sign>          ::= "+" | "-"

<decimal_digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 规则描述

* 只支持十进制格式的数字；

* 数字前面可以带有正负符号字符；

* 字符串允许有任意数量的前缀空格和后缀空格，空格字符包括：' ', '\t',  '\n', '\r', '\f', '\v'；

* 不支持科学计数法；

* 其它格式报错；

* 数值溢出报错。

#### 例子

| 字符串                                 | Cast as int 结果 | Comment         |
| ----------------------------------- | -------------- | --------------- |
| "2147483647"                        | 2147483647     |                 |
| "-2147483648"                       | -2147483648    |                 |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647     | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647     | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648    | 带前缀和后缀空白字符，带负号。 |
| 'abc'                               | 报错             | 非法格式            |
| '123.456'                           | 报错             | 不支持小数格式         |
| '1.23456e5'                         | 报错             | 不支持科学计数法        |
| '2147483648'                        | 报错             | 溢出              |
| '-2147483649'                       | 报错             | 溢出              |

### 非严格模式

始终返回nullable类型。

#### BNF定义

```xml
<integer_non_strict> ::= <whitespace_char>* <sign>? <number> <whitespace_char>*

<sign>               ::= "+" | "-"

<number>             ::= <decimal_number> | <decimal_number> "." <decimal_number> | <decimal_number> "." | "." <decimal_number>

<decimal_number>     ::= <decimal_digit>+

<decimal_digit>      ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace_char>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 规则描述

* 支持严格模式下的所有合法格式；

* 支持严格模式格式后面带有小数部分，转换结果直接把小数部分丢弃；

* 科学计数法格式转成NULL；

* 其他格式情况都转成NULL；

* 溢出的时候转成NULL。

#### 例子

| 字符串                                 | Cast as int 结果 | Comment         |
| ----------------------------------- | -------------- | --------------- |
| "2147483647"                        | 2147483647     |                 |
| "-2147483648"                       | -2147483648    |                 |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647     | 带前缀和后缀空白字符      |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647     | 带前缀和后缀空白字符，带正号。 |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648    | 带前缀和后缀空白字符，带负号。 |
| '123.456'                           | 123            |                 |
| '1.23456e5'                         | NULL           | 科学计数法        |
| 'abc'                               | NULL           | 非法格式            |
| '2147483648'                        | NULL           | 溢出              |
| '-2147483649'                       | NULL           | 溢出              |

## From bool

true转成1，false转成0。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

## From  integer to  integer

支持任意整数类型之间相互转换。

### 严格模式

溢出时报错。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | 报错         | 溢出      |
| -2147483649 | 报错         | 溢出      |

### 非严格模式

:::caution 行为变更
自 4.0 起，溢出时结果不再是未定义值，而是NULL。
:::

溢出时返回NULL值。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出(比如`cast bigint as int`)，返回nullable类型；

* 否则返回非nullable类型（比如`cast int as bigint`）。

#### 例子

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | NULL       | 溢出      |
| -2147483649 | NULL       | 溢出      |

## From date

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

### 规则描述

:::caution 行为变更
自 4.0 起，不再支持date类型转换成tinyint和smallint。
:::

* 不支持cast到tinyint和smallint，因为一定会溢出。

* 支持cast成int, bigint和largeint。将date的年月日的数字按顺序拼成整数，月、日都当成两位数，不足10的在前面补一个0。

### 例子

| date       | int      |
| ---------- | -------- |
| 2025-03-14 | 20250314 |

## From datetime

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

### 规则描述

:::caution 行为变更
自 4.0 起，不再支持datetime类型转换成tinyint、smallint和int类型。
:::

* 不支持cast到tinyint, smallint, int，因为一定会溢出；

* 支持cast成bigint, largeint。将datetime的microsend部分丢弃，然后将年、月、日、小时、分钟、秒按顺序拼接成一个整数，月、日、小时、分钟、秒都当成两位数，不足10的在前面补一个0。

### 例子

| datetime                   | int            |
| -------------------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 |
| 9999-12-31 23:59:59.999999 | 99991231235959 |

## From float/double

不支持四舍五入。

### 严格模式

#### 规则描述

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

* 溢出时报错；

* Inf和NaN值报错。

#### 例子

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 截断      |
| 1.79769E308  | 报错          | 溢出      |
| Infinity     | 报错          |         |
| NaN          | 报错          |         |

### 非严格模式

始终返回nullable类型。

#### 规则描述

:::caution 行为变更
自 4.0 起，溢出时结果不再是未定义值，而是NULL。
:::

* 溢出时转成NULL值；

* Inf转成NULL值；

* NaN转成NULL值。

#### 例子

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 截断      |
| 1.79769E308  | NULL        | 溢出      |
| Infinity     | NULL        |         |
| -Infinity    | NULL        |         |
| NaN          | NULL        |         |

## From  decimal

不支持四舍五入。

### 严格模式

溢出时报错。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Decimal(18, 6)  | int | comment |
| --------------- | --- | ------- |
| 1.654321        | 1   | 截断      |
| 12345678901.123 | 报错  | 溢出      |

### 非严格模式

溢出时转成NULL值。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出(比如`cast decimal(18, 0) as int`)，返回nullable类型；

* 否则返回非nullable类型（比如`cast decimal(9, 0) as bigint`）。

#### 例子

| Decimal(18, 6)  | int  | comment |
| --------------- | ---- | ------- |
| 1.654321        | 1    | 截断      |
| 12345678901.123 | NULL | 溢出      |

## From  time

转换为微秒数。

### 严格模式

溢出时报错。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable，返回非nullable类型。

#### 例子

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | 报错      | 溢出      |

### 非严格模式

:::caution 行为变更
自 4.0 起，溢出时结果不再是未定义值，而是NULL。
:::

溢出时转成NULL值。

如果源类型是nullable，返回nullable类型。

如果源类型是非nullable：

* 如果可能溢出(比如`cast time as tinyint`)，返回nullable类型；

* 否则返回非nullable类型（比如`cast time as bigint`）。

#### 例子

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | NULL    | 溢出      |

## 其它类型

不支持
