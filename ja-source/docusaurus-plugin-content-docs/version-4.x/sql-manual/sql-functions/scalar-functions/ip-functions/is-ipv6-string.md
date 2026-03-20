---
{
  "title": "IS_IPV6_STRING",
  "description": "入力文字列が有効なIPv6アドレス形式かどうかを確認します。有効なIPv6アドレスの場合は1を返し、そうでない場合は0を返します。",
  "language": "ja"
}
---
## is_ipv6_string

## 説明
入力文字列が有効なIPv6アドレス形式かどうかをチェックします。有効なIPv6アドレスの場合は1を返し、そうでない場合は0を返します。

## エイリアス
- IS_IPV6

## 構文

```sql
IS_IPV6_STRING(<ipv6_str>)
```
### パラメータ
- `<ipv6_str>`: チェック対象の文字列

### 戻り値
戻り値の型: TINYINT

戻り値の意味:
- 1を返す: 入力が有効なIPv6アドレス形式であることを示す
- 0を返す: 入力が有効でないIPv6アドレス形式であることを示す
- 入力がNULLの場合はNULLを返す

### 使用上の注意
- 文字列形式がIPv6アドレス仕様に準拠しているかどうかのみをチェックする
- 実際のIPアドレス変換は行わず、形式の検証のみを実行する
- NULL入力をサポートし、NULLを返す

## 例

有効なIPv6アドレス形式をチェックする。

```sql
SELECT is_ipv6_string('2001:db8::1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```
様々なIPv6アドレス形式を確認します。

```sql
SELECT 
  is_ipv6_string('::1') as localhost,
  is_ipv6_string('2001:db8::1') as standard,
  is_ipv6_string('2001:db8:0:0:0:0:0:1') as expanded;
+-----------+----------+----------+
| localhost | standard | expanded |
+-----------+----------+----------+
| 1         | 1        | 1        |
+-----------+----------+----------+
```
無効なIPv6アドレス形式をチェックします。

```sql
SELECT 
  is_ipv6_string('2001:db8::1::2') as double_colon,
  is_ipv6_string('2001:db8:1') as too_short,
  is_ipv6_string('2001:db8:1:2:3:4:5:6:7') as too_long,
  is_ipv6_string('not-an-ipv6') as not_ipv6;
+--------------+-----------+----------+----------+
| double_colon | too_short | too_long | not_ipv6 |
+--------------+-----------+----------+----------+
| 0            | 0         | 0        | 0        |
+--------------+-----------+----------+----------+
```
NULL入力をチェックします。

```sql
SELECT is_ipv6_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```
### キーワード

IS_IPV6_STRING
