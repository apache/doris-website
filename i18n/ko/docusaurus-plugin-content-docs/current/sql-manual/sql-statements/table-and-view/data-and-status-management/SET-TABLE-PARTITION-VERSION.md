---
{
    "title": "SET TABLE PARTITION VERSION",
    "language": "ko",
    "description": "컴퓨팅과 스토리지가 결합된 모드에서 지정된 파티션의 표시 버전을 수동으로 변경하는 데 사용하는 문입니다. 일부 특수한 경우,"
}
---

## 설명 {#description}

컴퓨팅과 스토리지가 결합된 모드에서 지정된 파티션의 표시 버전을 수동으로 변경하는 데 사용하는 문입니다. 일부 특수한 경우 메타데이터에 있는 파티션의 버전이 실제 복제본의 버전과 일치하지 않을 수 있습니다.

이 명령으로 메타데이터에 있는 파티션의 버전을 수동으로 변경할 수 있습니다. 이 명령은 일반적으로 장애 발생 시 긴급 복구 용도로만 사용됩니다. 신중하게 실행하세요.

## 구문 {#syntax}

```sql
ADMIN SET TABLE <table_name> PARTITION VERSION PROPERTIES ("<partition_id>" = "visible_version>");
```

## 필수 매개변수 {#required-parameters}

<table_name>

> 설정할 테이블의 이름입니다.

<partition_id>

> 파티션 ID를 지정합니다.

<visible_version>

> 버전을 지정합니다.

## 예제 {#examples}

1. FE 메타데이터에서 partition_id가 10075인 파티션의 버전을 100으로 설정합니다.

  ```sql
  ADMIN SET TABLE __internal_schema.audit_log PARTITION VERSION PROPERTIES("partition_id" = "10075", "visible_version" = "100");
  ```
## 사용 시 유의 사항 {#usage-note}

1. 파티션 버전을 설정하기 전에 BE 머신에 있는 실제 복제본의 버전을 확인해야 합니다. 이 명령은 일반적으로 장애 발생 시 긴급 복구 용도로만 사용됩니다. 신중하게 실행하세요.
2. 이 명령은 스토리지와 컴퓨팅이 분리된 모드에서는 지원되지 않습니다. 설정해도 적용되지 않습니다.
