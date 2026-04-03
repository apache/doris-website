---
{
  "title": "BOOLEAN型へのキャスト",
  "description": "BOOLEAN型は真または偽の値を表し、true値とfalse値の2つの状態のみが可能です。",
  "language": "ja"
}
---
BOOLEAN型は真または偽の値を表し、2つの可能な状態のみを持ちます：true値とfalse値。

## FROM String

:::caution Behavior Change
以前は、'1.11'のような文字列をboolean型の'true'にキャストできましたが、4.0以降では、これらはnullに変換される（非strict mode）か、エラーが報告される（strict mode）ようになります。
以前は、'on'、'off'、'yes'、'no'のような値はnullに変換されていましたが、4.0以降では、対応するboolean値に変換できるようになります。
:::

### Strict Mode

#### BNF Definition

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```
#### ルールの説明

Boolean値は以下の形式で指定できます: 0, 1, yes, no, on, off, true, false で、大文字小文字は区別されません。さらに、Boolean値の前後には任意の数の空白文字（スペース、タブ、改行など）を含めることができます。

これらの形式に準拠しない場合、エラーが報告されます。

#### 例

| 文字列 | bool結果へのキャスト | コメント |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | 先頭と末尾に空白文字あり |
| "1.1" | Error | 無効な形式 |
| "YeS" | true | 大文字小文字を区別しない |
| '+0' | Error | 無効な形式 |

### 非厳密モード

#### BNF定義

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```
#### ルールの説明

Boolean値は以下の形式で指定できます：0、1、yes、no、on、off、true、false。大文字小文字は区別されません。また、Boolean値の前後には任意の数の空白文字（スペース、タブ、改行など）を含めることができます。

適合しない形式の場合、nullが返されます。

#### 例

| String | Cast as bool Result | Comment |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | 前後の空白文字あり |
| "1.1" | null | 無効な形式 |
| "YeS" | true | 大文字小文字を区別しない |
| '+0' | null | 無効な形式 |

## FROM Numeric

:::caution 動作の変更
以前は、date/datetimeのような非数値型もboolean型に変換することができましたが、4.0からはサポートされません。
:::

### Strict Mode

#### ルールの説明

数値型（int/double/decimal）の場合、0以外の値はtrueとみなされます。

浮動小数点数の正と負の零はfalseに変換されます。

#### 例

| Numeric タイプ | Cast as bool Result | Comment |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | 浮動小数点数の正の零 |
| -0.0 | false | 浮動小数点数の負の零 |
| -1 | true | |
| 1 | true | |

### Non-Strict Mode

#### ルールの説明

数値型（int/double/decimal）の場合、0以外の値はtrueとみなされます。

浮動小数点数の正と負の零はfalseに変換されます。

#### 例

| Numeric タイプ | Cast as bool Result | Comment |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | 浮動小数点数の正の零 |
| -0.0 | false | 浮動小数点数の負の零 |
| -1 | true | |
| 1 | true | |
