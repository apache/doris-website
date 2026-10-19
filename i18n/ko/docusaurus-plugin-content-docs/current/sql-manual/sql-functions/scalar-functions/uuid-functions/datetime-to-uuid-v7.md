---
{
    "title": "DATETIME_TO_UUID_V7",
    "language": "ko",
    "description": "날짜와 시간으로부터 네이티브 UUID v7을 생성하며, 입력이 `NULL`이면 `NULL`을 반환합니다."
}
---

## 설명 {#description}

날짜와 시간으로부터 네이티브 UUID v7을 생성하며, 입력이 `NULL`이면 `NULL`을 반환합니다.

## 별칭 {#alias}

`dateTimeToUUIDv7`.

## 사용 시 참고 사항 {#usage-notes}

이 함수는 `UUID_V7()`과 별도의 카운터를 사용합니다. BE 간의 전역 순서를 보장하지 않으며, 날짜와 시간을 결정론적으로 인코딩하지 않습니다. 연속으로 동일한 값이 입력되어 카운터가 오버플로되면 인코딩된 타임스탬프가 한 밀리초 앞으로 이동합니다.

## 구문 {#syntax}

```sql
DATETIME_TO_UUID_V7(<datetime>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<datetime>` | DATETIME 값으로, 소수 초 정밀도를 지정할 수 있으며 세션의 `time_zone`을 기준으로 해석됩니다. |

## 반환 값 {#return-value}

`UUID` 타입을 반환합니다. 입력이 `NULL`이거나 유효하지 않은 날짜이거나 UTC로 변환한 날짜와 시간이 Unix epoch 이전이면 `NULL`을 반환합니다. 밀리초 미만의 자릿수는 버립니다. 이 함수는 비결정적이므로 같은 날짜와 시간으로 반복 호출하면 새로운 UUID가 생성됩니다.

## 예제 {#example}

```sql
SET time_zone = 'UTC';
SELECT UUID_VERSION(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6)))) AS version,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6))), 'UTC') AS restored;
```

```text
+---------+-------------------------+
| version | restored                |
+---------+-------------------------+
| 7       | 2026-09-10 12:34:56.789 |
+---------+-------------------------+
```

```sql
SET time_zone = 'UTC';
SELECT DATETIME_TO_UUID_V7(CAST(NULL AS DATETIME)) AS null_input,
       DATETIME_TO_UUID_V7(CAST('1969-12-31 23:59:59' AS DATETIME)) AS before_epoch,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('1970-01-01 00:00:00' AS DATETIME)), 'UTC') AS epoch;
```

```text
+------------+--------------+-------------------------+
| null_input | before_epoch | epoch                   |
+------------+--------------+-------------------------+
| NULL       | NULL         | 1970-01-01 00:00:00.000 |
+------------+--------------+-------------------------+
```
