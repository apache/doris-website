---
{
    "title": "IPV4",
    "language": "ko",
    "description": "IPv4 주소를 표현하는 데 사용하는 IPv4 타입으로, 4바이트 크기의 UInt32 형식으로 저장됩니다. 값의 범위는 ['0.0.0.0', '255.255.255.255']입니다."
}
---

## IPV4 {#ipv4}

### 설명 {#description}

IPv4 주소를 표현하는 데 사용하는 IPv4 타입으로, 4바이트 크기의 UInt32 형식으로 저장됩니다.
값의 범위는 ['0.0.0.0', '255.255.255.255']입니다.

`Inputs that exceed the value range or have invalid format will return NULL`

### 예제 {#example}

테이블 생성 예제:

```
CREATE TABLE ipv4_test (
  `id` int,
  `ip_v4` ipv4
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

데이터 삽입 예제:

```
insert into ipv4_test values(1, '0.0.0.0');
insert into ipv4_test values(2, '127.0.0.1');
insert into ipv4_test values(3, '59.50.185.152');
insert into ipv4_test values(4, '255.255.255.255');
insert into ipv4_test values(5, '255.255.255.256'); // invalid data
```

데이터 조회 예제:

```
mysql> select * from ipv4_test order by id;
+------+-----------------+
| id   | ip_v4           |
+------+-----------------+
|    1 | 0.0.0.0         |
|    2 | 127.0.0.1       |
|    3 | 59.50.185.152   |
|    4 | 255.255.255.255 |
|    5 | NULL            |
+------+-----------------+
```

### 키워드 {#keywords}

IPV4
