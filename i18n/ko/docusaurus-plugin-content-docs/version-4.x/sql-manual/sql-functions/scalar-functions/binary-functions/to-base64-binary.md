---
{
    "title": "TO_BASE64_BINARY",
    "language": "ko",
    "description": "TOBASE64BINARY 함수는 입력 바이너리 문자열을 Base64 인코딩 형식으로 변환합니다."
}
---

## 설명 {#description}

TO_BASE64_BINARY 함수는 입력 바이너리 문자열을 Base64 인코딩 형식으로 변환합니다. Base64 인코딩은 임의의 바이너리 데이터를 64개의 문자로 구성된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
TO_BASE64_BINARY(<bin>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                    |
| --------- | ---------------------------------------------- |
| `<bin>` | Base64로 인코딩할 바이너리입니다. 타입: VARBINARY |

## 반환 값 {#return-value}

Base64로 인코딩된 문자열을 VARCHAR 타입으로 반환합니다.

특수한 경우:
- 입력이 NULL이면 NULL을 반환합니다.
- 입력이 빈 VARBINARY(영 바이트)이면 빈 문자열을 반환합니다.

## 예제 {#examples}

1. 단일 문자 인코딩
```sql
SELECT to_base64_binary(x'12');
```
```text
+-------------------------+
| to_base64_binary(x'12') |
+-------------------------+
| Eg==                    |
+-------------------------+
```

2. 여러 문자 인코딩
```sql
SELECT to_base64_binary(x'234AAA');
```
```text
+-----------------------------+
| to_base64_binary(x'234AAA') |
+-----------------------------+
| I0qq                        |
+-----------------------------+
```
