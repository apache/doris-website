---
{
    "title": "SHOW CHARSET",
    "language": "ko",
    "description": "\"SHOW CHARSET\" 명령은 현재 데이터베이스 관리 시스템에서 사용할 수 있는 문자 집합과 관련된 일부 속성을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

"SHOW CHARSET" 명령은 현재 데이터베이스 관리 시스템에서 사용할 수 있는 문자 집합과 각 문자 집합의 일부 속성을 표시하는 데 사용됩니다.

이러한 속성에는 문자 집합 이름, 기본 정렬 규칙, 최대 바이트 길이 등이 포함될 수 있습니다. "SHOW CHARSET" 명령을 실행하면 시스템에서 지원하는 문자 집합 목록과 세부 정보를 확인할 수 있습니다.

## 구문 {#syntax}
```sql
SHOW CHARSET
```

## 반환 값 {#return-value}
| 열 이름 | 설명 |
| -- |-------------|
| Charset | 문자 집합         |
| Description | 설명          |
| Default Collation | 기본 정렬 규칙 이름      |
| Maxlen | 최대 바이트 길이      |

## 예제 {#examples}

```sql
SHOW CHARSET;
```

```text
+---------+---------------+-------------------+--------+
| Charset | Description   | Default collation | Maxlen |
+---------+---------------+-------------------+--------+
| utf8mb4 | UTF-8 Unicode | utf8mb4_0900_bin  | 4      |
+---------+---------------+-------------------+--------+
```
