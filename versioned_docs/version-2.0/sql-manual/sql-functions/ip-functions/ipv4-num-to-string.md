---
{
"title": "IPV4_NUM_TO_STRING",
"language": "en"
}
---

## IPV4_NUM_TO_STRING

IPV4_NUM_TO_STRING

### description

#### Syntax

`VARCHAR IPV4_NUM_TO_STRING(BIGINT ipv4_num)`

Takes a Int16, Int32, Int64 number. Interprets it as an IPv4 address in big endian. Returns a string containing the corresponding IPv4 address in the format A.B.C.d (dot-separated numbers in decimal form).
### notice

`will return NULL if the input parameter is negative or larger than 4294967295(num value of '255.255.255.255')`

### example

```
mysql> select IPV4_NUM_TO_STRING(3232235521);
+-----------------------------+
| IPV4_NUM_TO_STRING(3232235521) |
+-----------------------------+
| 192.168.0.1                 |
+-----------------------------+
1 row in set (0.01 sec)

mysql> select num,IPV4_NUM_TO_STRING(num) from ipv4_bi;
+------------+------------------------+
| num        | IPV4_NUM_TO_STRING(`num`) |
+------------+------------------------+
|         -1 | NULL                   |
|          0 | 0.0.0.0                |
| 2130706433 | 127.0.0.1              |
| 4294967295 | 255.255.255.255        |
| 4294967296 | NULL                   |
+------------+------------------------+
7 rows in set (0.01 sec)
```

### keywords

IPV4_NUM_TO_STRING, IP
