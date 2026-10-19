---
{
    "title": "WARM UP",
    "language": "ko",
    "description": "WARM UP COMPUTE GROUP 문은 컴퓨트 그룹의 데이터를 워밍업하여 쿼리 성능을 향상시키는 데 사용됩니다."
}
---

## 설명 {#description}

`WARM UP COMPUTE GROUP` 문은 컴퓨트 그룹의 데이터를 워밍업하여 쿼리 성능을 향상시키는 데 사용됩니다. 워밍업 시 다른 컴퓨트 그룹에서 리소스를 가져오거나 워밍업할 특정 테이블과 파티션을 지정할 수 있습니다. 워밍업 작업은 작업 ID를 반환하며, 이 ID로 워밍업 작업의 상태를 추적할 수 있습니다.

> Catalog 쿼리 시나리오에서 캐시를 워밍업하는 방법은 [데이터 캐시 문서](../../../../lakehouse/data-cache.md)를 참조하세요.

## 구문 {#syntax}

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;
```
```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;
```
```sql
warm_up_list ::= warm_up_item [AND warm_up_item...];
```
```sql
warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```
## 매개변수 {#parameters}

| 매개변수 이름                  | 설명                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | 워밍업할 대상 컴퓨트 그룹의 이름입니다.                                   |
| source_compute_group_name  | 리소스를 가져올 원본 컴퓨트 그룹의 이름입니다.                                 |
| warm_up_list              | 워밍업할 특정 항목의 목록으로, 테이블과 파티션을 포함할 수 있습니다.                   |
| table_name                | 워밍업에 사용할 테이블의 이름입니다.                                         |
| partition_name            | 워밍업에 사용할 파티션의 이름입니다.                                       |

## 반환 값 {#return-value}

* JobId:  워밍업 작업의 ID입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

4.1.5부터 워밍업하려면 대상 컴퓨트 그룹에 대한 `USAGE` 권한이 필요하며, 원본 컴퓨트 그룹을 지정한 경우 해당 그룹에 대한 `USAGE` 권한도 필요합니다. `WITH TABLE`로 명시적으로 나열한 각 내부 테이블에는 `SELECT` 권한이 필요합니다. `ON TABLES` 규칙을 사용하는 이벤트 기반 워밍업에는 전역 `ADMIN` 권한이 추가로 필요합니다. 필요한 권한 중 하나라도 없으면 작업이 거부됩니다.

## 예제 {#examples}

1. source_group_name 컴퓨트 그룹을 사용하여 destination_group_name 컴퓨트 그룹을 워밍업합니다.

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. destination_group 컴퓨트 그룹을 사용하여 sales_data 테이블과 customer_info 테이블, orders 테이블의 q1_2024 파티션을 워밍업합니다.

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```
