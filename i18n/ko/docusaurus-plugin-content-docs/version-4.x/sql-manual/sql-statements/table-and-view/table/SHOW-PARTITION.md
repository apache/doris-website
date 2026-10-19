---
{
    "title": "SHOW PARTITION",
    "language": "ko",
    "description": "SHOW PARTITION은 지정된 파티션의 상세 정보를 표시하는 데 사용됩니다. 여기에는 관련 데이터베이스의 이름과 ID가 포함됩니다."
}
---

## 설명 {#description}

SHOW PARTITION은 지정된 파티션의 상세 정보를 표시하는 데 사용됩니다. 여기에는 관련 데이터베이스의 이름과 ID, 관련 테이블의 이름과 ID, 파티션 이름이 포함됩니다.

## 구문 {#syntax}

```sql
SHOW PARTITION <partition_id>
```

## 필수 매개변수 {#required-parameters}

**<partition_id>**

> 파티션의 ID입니다. 파티션 ID는 SHOW PARTITIONS 등의 방법으로 확인할 수 있습니다. 자세한 내용은 "SHOW PARTITIONS" 섹션을 참고하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 `ADMIN_PRIV` 권한이 있어야 합니다.

## 예시 {#examples}

파티션 ID가 13004인 파티션의 정보를 쿼리합니다:

```sql
SHOW PARTITION 13004;
```

해당 ID의 파티션이 있으면 다음과 같은 결과가 출력됩니다. 표시된 ID는 예시이므로 `13004`를 실제 파티션 ID로 바꾸세요(`SHOW PARTITIONS` 참조). 일치하는 파티션이 없으면 `SHOW PARTITION`은 빈 결과 집합을 반환합니다.

```sql
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```
