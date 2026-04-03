---
{
  "title": "PARSE_DATA_SIZE",
  "description": "PARSEDATASIZE関数は、ストレージ単位を含む文字列（\"1.5GB\"など）を解析し、バイト単位の数値に変換します。",
  "language": "ja"
}
---
## 説明

PARSE_DATA_SIZE関数は、ストレージ単位を含む文字列（"1.5GB"など）を解析し、バイト単位の数値に変換します。

## 構文

```sql
PARSE_DATA_SIZE(<str>)
```
## パラメータ

| Parameter | デスクリプション |
| -------- | ----------------------------------------- |
| `<str>` | 単位付きのデータサイズ文字列（例："100MB"、"2.5GB"）。型：VARCHAR |

## Return Value

BIGINT型を返し、バイトに変換された数値を表します。

特別なケース：
- サポートされている単位（大文字小文字を区別しない）：B、kB、MB、GB、TB、PB、EB、ZB、YB
- 単位は基数1024を使用（例：1kB = 1024B）
- 小数をサポート（例："2.5MB"）
- パラメータの形式が無効な場合、エラーを返す
- パラメータがNULLの場合、NULLを返す

**サポートされている単位の表：**

| Unit | Name | Bytes |
|------|------|-------|
| B    | Bytes      | 1          |
| kB   | Kilobytes  | 1024       |
| MB   | Megabytes  | 1024²      |
| GB   | Gigabytes  | 1024³      |
| TB   | Terabytes  | 1024⁴      |
| PB   | Petabytes  | 1024⁵      |
| EB   | Exabytes   | 1024⁶      |

## Examples

1. 基本的な使用法：バイトを解析

```sql
SELECT parse_data_size('1024B');
```
```text
+--------------------------+
| parse_data_size('1024B') |
+--------------------------+
| 1024                     |
+--------------------------+
```
2. キロバイトを解析する

```sql
SELECT parse_data_size('1kB');
```
```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```
3. 小数点付きのメガバイトを解析する

```sql
SELECT parse_data_size('2.5MB');
```
```text
+--------------------------+
| parse_data_size('2.5MB') |
+--------------------------+
| 2621440                  |
+--------------------------+
```
4. ギガバイトを解析する

```sql
SELECT parse_data_size('1GB');
```
```text
+------------------------+
| parse_data_size('1GB') |
+------------------------+
| 1073741824             |
+------------------------+
```
5. テラバイトを解析する

```sql
SELECT parse_data_size('1TB');
```
```text
+------------------------+
| parse_data_size('1TB') |
+------------------------+
| 1099511627776          |
+------------------------+
```
6. サポートされていない単位、エラー

```sql
SELECT parse_data_size('1iB');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Invalid Input argument "1iB" of function parse_data_size
```
7. NULL入力

```sql
SELECT parse_data_size(NULL);
```
```text
+-----------------------+
| parse_data_size(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
### Keywords

    PARSE_DATA_SIZE
