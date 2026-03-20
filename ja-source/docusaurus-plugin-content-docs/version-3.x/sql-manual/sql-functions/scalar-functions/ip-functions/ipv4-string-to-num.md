---
{
  "title": "IPV4_STRING_TO_NUM",
  "description": "IPv4アドレスをA.B.C.D形式（10進数をドット区切りにした形式）で含む文字列を受け取ります。",
  "language": "ja"
}
---
## 説明
A.B.C.D形式（10進数をドット区切りで表現）のIPv4アドレスを含む文字列を受け取ります。対応するIPv4アドレスをビッグエンディアンで表現したBIGINT数値を返します。

## 構文

```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | 'A.B.C.D'のようなipv4のString型  |

## Return Value
ビッグエンディアンでの対応するIPv4アドレスを表すBIGINT数値を返します。
- 入力文字列が有効なIPv4アドレスでない場合や`NULL`の場合、エラーが返されます

## Example

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
