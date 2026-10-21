---
{
    "title": "DATE | 날짜 및 시간",
    "language": "ko",
    "description": "DATE 타입은 날짜를 저장하며, 값의 범위는 [0000-01-01, 9999-12-31]이고 기본 출력 형식은 'yyyy-MM-dd'입니다.",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## 설명 {#description}

DATE 타입은 날짜를 저장하며, 값의 범위는 `[0000-01-01, 9999-12-31]`이고 `0000-02-29`는 제외됩니다. 기본 출력 형식은 'yyyy-MM-dd'입니다.

Doris는 그레고리력 규칙을 사용하며, `0000`년은 기원전 1년(BCE 1)을 나타냅니다. 특수 경계 날짜인 `0000-02-29`는 지원하지 않습니다.

4.1.5부터 Arrow, Parquet 및 ORC V2에서 DATE의 epoch-day 변환 시 영년의 첫 두 달에 발생하던 오프셋이 수정되었습니다. 기존 Doris 인코딩을 사용하는 파일은 자동으로 식별할 수 없습니다. `0000-01-01`부터 `0000-02-28`까지의 날짜가 포함된 파일은 파일을 작성한 프로그램을 확인하고 [업그레이드 가이드](../../../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)에 설명된 방법으로 마이그레이션하세요.

DATE 타입은 기본 키, 파티션 컬럼 또는 버킷 컬럼으로 사용할 수 있습니다. DATE 타입 필드는 Doris에서 실제로 4바이트를 차지합니다. 런타임에는 DATE를 연도, 월, 일로 나누어 저장하므로 DATE 컬럼에 `months_add` 연산을 수행하는 것이 `unix_timestamp`보다 더 효율적입니다.

다른 타입을 DATE로 변환하는 방법과 변환 시 허용되는 입력은 [DATE로 변환](../conversion/date-conversion.md)을 참고하세요.

날짜 및 시간 타입은 수학 연산자를 직접 사용한 산술 연산을 지원하지 않습니다. 수학 연산을 수행하면 먼저 날짜 및 시간 타입을 숫자 타입으로 암시적으로 변환한 다음 연산을 수행합니다. 시간 타입에 덧셈, 뺄셈 또는 반올림을 수행해야 한다면 [DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md), [DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md), [TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md), [DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) 등의 함수를 사용하세요.

DATE 타입은 시간대를 저장하지 않습니다. 따라서 세션 변수 `time_zone`을 변경해도 DATE 타입에 저장된 값은 영향을 받지 않습니다.

## 예제 {#examples}

```sql
select cast('2020-01-02' as date);
```

```text
+----------------------------+
| cast('2020-01-02' as date) |
+----------------------------+
| 2020-01-02                 |
+----------------------------+
```

```sql
select cast('0120-02-29' as date);
```

```text
+----------------------------+
| cast('0120-02-29' as date) |
+----------------------------+
| 0120-02-29                 |
+----------------------------+
```
