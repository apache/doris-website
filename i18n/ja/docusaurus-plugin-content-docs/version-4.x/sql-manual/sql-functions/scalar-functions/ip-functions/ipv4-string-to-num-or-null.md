---
{
    "title": "IPV4_STRING_TO_NUM_OR_NULL",
    "language": "ja",
    "description": "A.B.C.D 形式の IPv4 アドレス文字列を、ビッグエンディアンの数値に変換します。"
}
---

## 説明
A.B.C.D 形式（ドットで区切られた 十進数）の IPv4 アドレス文字列を受け取り、対応する IPv4 アドレスをビッグエンディアンの BIGINT 値で返します。

## 別名
- INET_ATON

## 構文
```sql
IPV4_STRING_TO_NUM_OR_NULL(<ipv4_string>)
```

## パラメータ
| パラメータ | 説明 |
|-----------|--------------------------------------------------|
| `<ipv4_string>` | 'A.B.C.D' 形式の IPv4 文字列 |

## 戻り値
対応する IPv4 アドレスをビッグエンディアンの BIGINT 値で返します。
- 入力文字列が有効な IPv4 アドレスでない場合は `NULL` を返します。

## 例
```sql
select ipv4_string_to_num_or_null('192.168.0.1'); 
```
```text
+-------------------------------------------+ 
| ipv4_string_to_num_or_null('192.168.0.1') | 
+-------------------------------------------+ 
| 3232235521                                | 
+-------------------------------------------+ 
```

<!-- setup-sql
CREATE TABLE ipv4_str (str VARCHAR(50)) DISTRIBUTED BY HASH(str) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO ipv4_str VALUES ('0.0.0.0'),('127.0.0.1'),('255.255.255.255'),('invalid');
-->

```sql
select str, ipv4_string_to_num_or_null(str) from ipv4_str; 
```
```text
+-----------------+---------------------------------+ 
|str              | ipv4_string_to_num_or_null(str) | 
+-----------------+---------------------------------+ 
| 0.0.0.0         | 0                               | 
| 127.0.0.1       | 2130706433                      | 
| 255.255.255.255 | 4294967295                      | 
| invalid         | NULL                            | 
+-----------------+---------------------------------+ 
```
