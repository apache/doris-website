---
{
    "title": "VARBINARY",
    "language": "ko",
    "description": "가변 길이 바이너리 바이트 시퀀스로, M은 최대 길이(바이트 단위)를 나타냅니다."
}
---

## VARBINARY {#varbinary}
### 설명 {#description}
가변 길이 바이너리 바이트 시퀀스로, M은 최대 길이(바이트 단위)를 나타냅니다.

VARCHAR와 달리 문자 집합이나 정렬 규칙에 따라 해석하지 않고 원시 바이트를 그대로 보존하므로, 임의의 바이너리 데이터(예: 파일 조각, 해시, 암호화/압축된 데이터)에 적합합니다. 최대 길이는 2,147,483,647입니다.

현재 구체화된 뷰 생성 시 VARBINARY 컬럼은 지원되지 않으며, Group By 키, Join Keys 및 비교 조건식에도 사용할 수 없습니다.

버전 및 제한 사항: 4.0부터 지원됩니다. 현재 Doris에서 테이블을 생성하고 데이터를 저장할 때 사용하는 컬럼 타입으로는 지원되지 않습니다. 외부 시스템의 BINARY/VARBINARY 필드를 Catalog를 통해 Doris VARBINARY로 매핑하여 쿼리할 수 있습니다.

### 4.1.5부터 적용되는 외부 타입 및 제한 사항 {#external-types-and-restrictions-since-415}

4.1.5부터 Catalog는 외부 바이너리 타입을 항상 `VARBINARY`로 유지하며, `enable.mapping.varbinary=false`를 설정해도 더 이상 `STRING` 매핑으로 되돌아가지 않습니다. Iceberg의 `fixed(N)`은 Block 직렬화와 데이터 교환 과정에서도 `VARBINARY(N)`으로 매핑됩니다. dev 버전에서는 Iceberg UUID가 네이티브 `UUID`로 매핑되며, 4.1.5에서 사용되는 `VARBINARY(16)`으로 매핑되지 않습니다. dev 버전에서는 File TVF도 항상 바이너리 매핑을 활성화합니다. `enable_mapping_varbinary`는 호환성을 위해 허용되지만 설정값은 무시됩니다. 4.1.5에서는 이 TVF 옵션을 계속 설정할 수 있으며, 기본값은 `false`입니다.

Hive Text 바이너리 필드는 Hive와 호환되는 Base64 인코딩과 디코딩을 사용합니다. 십육진수 표현을 사용하는 변환에는 `0x` 접두사와 짝수 개의 유효한 십육진수 숫자가 필요하며, 입력이 유효하지 않으면 `Invalid VARBINARY hex representation`을 반환합니다.

이 기능이 지원되더라도 Doris 내부 테이블에 바이너리 컬럼을 네이티브로 저장할 수는 없습니다. VARBINARY는 Hash Join 또는 Group By 키, 비교 조건식, `IN` 또는 `NOT IN`, 바이너리 의미 체계를 지원하지 않는 `collect_set` 등의 연산에 사용할 수 없습니다. Doris 4.1.5는 이러한 사용을 명시적으로 거부합니다.

### 키워드 {#keywords}
VARBINARY
