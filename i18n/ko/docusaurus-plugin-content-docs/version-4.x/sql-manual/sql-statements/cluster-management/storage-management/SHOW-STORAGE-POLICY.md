---
{
    "title": "SHOW STORAGE POLICY",
    "language": "ko",
    "description": "전체 또는 지정된 스토리지 정책과 연결된 테이블 및 파티션을 조회합니다."
}
---

## 설명 {#description}

전체 또는 지정된 스토리지 정책과 연결된 테이블 및 파티션을 조회합니다.

## 구문 {#syntax}

```sql
SHOW STORAGE POLICY [ USING [ FOR <storage_policy_name> ] ]
```

## 필수 매개변수 {#required-parameters}

<storage_policy_name>

> 조회할 스토리지 정책의 이름입니다.

이 SQL 명령을 성공적으로 실행하려면 ADMIN_PRIV 권한이 있어야 합니다.
권한 문서를 참고하세요.

| 권한 (권한) | 객체 (객체)                      | 참고 (참고)                   |
|-----------------------|--------------------------------------|---------------------------------|
| ADMIN_PRIV            | 전체 클러스터 관리 권한 | NODE_PRIV를 제외한 모든 권한 |

## 예제 {#example}

1. 스토리지 정책이 활성화된 모든 객체를 조회합니다.

   ```sql
   show storage policy using;
   ```
   ```text
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | PolicyName            | Database                                | Table                                  | Partitions |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | table_with_storage_policy_1            | ALL        |
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201701    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201702    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | table_with_storage_policy_2            | ALL        |
   | test_policy           | db2                                     | db2_test_1                             | ALL        |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   ```

2. test_storage_policy 스토리지 정책을 사용하는 객체를 조회합니다.

   ```sql
   show storage policy using for test_storage_policy;
   ```
   ```text
   +---------------------+-----------+---------------------------------+------------+
   | PolicyName          | Database  | Table                           | Partitions |
   +---------------------+-----------+---------------------------------+------------+
   | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
   | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
   +---------------------+-----------+---------------------------------+------------+
   ```

3. 모든 스토리지 정책의 속성을 조회합니다.

   ```sql
   show storage policy;
   ```
   ```text
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | PolicyName  | Id       | Version | Type    | StorageResource | CooldownDatetime | CooldownTtl |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | test_policy | 14589252 | 0       | STORAGE | remote_s3       | -1               | 300         |
   | dev_policy  | 14589521 | 0       | STORAGE | remote_s3       | -1               | 3000        |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   ```
