---
{
    "title": "SHOW CATALOG RECYCLE BIN",
    "language": "ko",
    "description": "이 문은 휴지통에 있는 데이터베이스, 테이블 또는 파티션의 복구 가능한 메타데이터를 표시합니다."
}
---

## 설명 {#description}

이 문은 휴지통에 있는 데이터베이스, 테이블 또는 파티션의 복구 가능한 메타데이터를 표시합니다.

## 구문 {#syntax}

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```

## 선택적 매개변수 {#optional-parameters}

이름으로 필터링

**1. `<name>`**
> 데이터베이스, 테이블 또는 파티션의 이름입니다.

패턴 매칭으로 필터링

**1. `<name_matcher>`**
> 데이터베이스, 테이블 또는 파티션 이름에 적용할 매칭 패턴입니다.

## 반환 값 {#return-values}

| 열             | 유형     | 설명                                                                                                                                                                             |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Type           | String   | 메타데이터 유형: Database, Table, Partition                                                                                                                                        |
| Name           | String   | 메타데이터 이름                                                                                                                                                                    |
| DbId           | Bigint   | 데이터베이스의 ID                                                                                                                                                               |
| TableId        | Bigint   | 테이블의 ID                                                                                                                                                                  |
| PartitionId    | Bigint   | 파티션의 ID                                                                                                                                                              |
| DropTime       | DateTime | 메타데이터가 휴지통으로 이동된 시각                                                                                                                              |
| DataSize       | Bigint   | 데이터 크기입니다. 메타데이터 유형이 데이터베이스인 경우, 이 값에는 휴지통에 있는 모든 테이블과 파티션의 데이터 크기가 포함됩니다.                                                   |
| RemoteDataSize | Decimal  | 원격 스토리지(HDFS 또는 객체 스토리지)의 데이터 크기입니다. 메타데이터 유형이 데이터베이스인 경우, 이 값에는 휴지통에 있는 모든 테이블과 파티션의 원격 데이터 크기가 포함됩니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한        | 객체   | 설명  |
|-------------|--------|-------|
| ADMIN_PRIV  |        |       |

## 예제 {#examples}

1. 휴지통에 있는 모든 메타데이터 표시

    ```sql
    SHOW CATALOG RECYCLE BIN;
    ```

2. 휴지통에서 이름이 'test'인 메타데이터 표시

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
    ```

3. 휴지통에서 이름이 'test'로 시작하는 메타데이터 표시

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
    ```
