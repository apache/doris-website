---
{
    "title": "ALTER STORAGE POLICY",
    "language": "ko",
    "description": "이 문은 기존 핫-콜드 계층형 마이그레이션 정책을 수정하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 수정할 수 있습니다."
}
---

## 설명 {#description}

이 문은 기존 핫-콜드 계층형 마이그레이션 정책을 수정하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 수정할 수 있습니다.

## 구문 {#syntax}
```sql
ALTER STORAGE POLICY  '<policy_name>' PROPERTIES ("<key>"="<value>"[, ... ]);
```

## 필수 매개변수 {#required-parameters}


1.`<policy_name>`  
> 스토리지 정책의 이름입니다. 수정하려는 스토리지 정책의 고유 식별자로, 기존 정책의 이름을 지정해야 합니다. 

## 선택 매개변수 {#optional-parameters}
`PROPERTIES ("<key>"="<value>"[, ... ])` 

1.`retention_days`  
> 데이터 보존 기간입니다. 스토리지에 데이터를 보관하는 기간을 정의합니다. 이 기간이 지난 데이터는 자동으로 삭제됩니다. 

2.`redundancy_level`
> 중복 수준입니다. 고가용성과 내결함성을 보장하기 위한 데이터 복제본 수를 정의합니다. 예를 들어 값이 2이면 각 데이터 블록에 두 개의 복제본이 있습니다. 

3.`storage_type`   
> 스토리지 유형입니다. SSD, HDD 또는 하이브리드 스토리지 등 사용할 저장 매체를 지정합니다. 성능과 비용에 영향을 줍니다. 

4.`cooloff_time`    
> 삭제 대기 시간입니다. 데이터가 삭제 대상으로 표시된 시점부터 실제로 삭제될 때까지의 시간 간격입니다. 실수로 인한 데이터 손실을 방지하는 데 도움이 됩니다. 

5.`location_policy` 
> 지리적 위치 정책입니다. 재해 복구를 위한 리전 간 복제 등 데이터의 지리적 배치를 정의합니다. 

## 예제 {#examples}

1. 핫-콜드 계층형 데이터 마이그레이션의 cooldown_datetime 수정:
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. 핫-콜드 계층형 데이터 마이그레이션까지의 대기 시간을 설정하는 cooldown_ttl 수정:

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
