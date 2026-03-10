---
{
  "title": "IPV4_STRING_TO_NUM",
  "language": "ja",
  "description": "A.B.C.D形式（10進数をドット区切りした形式）のIPv4アドレスを含む文字列を受け取ります。"
}
---
## 説明
A.B.C.D形式（10進数をドット区切りで表記）のIPv4アドレスを含む文字列を受け取ります。対応するIPv4アドレスをビッグエンディアンで表現したBIGINT数値を返します。

## 構文

```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```
## パラメータ
| パラメータ | 説明                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | IPv4の文字列型、'A.B.C.D'のような形式  |

## 戻り値
ビッグエンディアンで対応するIPv4アドレスを表すBIGINT数値を返します。
- 入力文字列が有効なIPv4アドレスでないか`NULL`の場合、エラーが返されます

## 例

```sql
select ipv4_string_to_num('192.168.0.1'); 
```
```text
+-----------------------------------+ 
| ipv4_string_to_num('192.168.0.1') | 
+-----------------------------------+ 
| 3232235521                        | 
+-----------------------------------+ 
```
```sql
select ipv4_string_to_num('invalid');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (172.17.0.2)[CANCELLED][INVALID_ARGUMENT][E33] Invalid IPv4 value
```
