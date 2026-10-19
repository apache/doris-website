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

VARCHAR와 달리 문자 집합이나 콜레이션으로 해석하지 않고 원시 바이트를 보존하므로, 임의의 바이너리 데이터(예: 파일 조각, 해시, 암호화되거나 압축된 데이터)에 적합하며 최대 길이는 2,147,483,647입니다.

현재 VARBINARY 컬럼은 생성된 구체화된 뷰에서 지원되지 않으며, Group By 키, Join 키 및 비교 조건자에도 사용할 수 없습니다.

버전 및 제한 사항: 4.0부터 지원되지만, 현재 Doris에서 테이블 생성 및 저장을 위한 컬럼 타입으로는 지원되지 않습니다. Catalog를 통해 외부 시스템의 BINARY/VARBINARY 필드를 Doris VARBINARY로 매핑하여 쿼리할 수 있습니다.

### 4.1.5부터 적용되는 외부 타입 및 제한 사항 {#external-types-and-restrictions-since-415}

4.1.5부터 Catalog는 외부 바이너리 타입을 항상 `VARBINARY`로 보존합니다. `enable.mapping.varbinary=false`를 설정해도 더 이상 `STRING` 매핑으로 되돌아가지 않습니다. Iceberg의 `fixed(N)`은 `VARBINARY(N)`으로, UUID는 `VARBINARY(16)`으로 매핑되며, 이 매핑은 Block 직렬화와 데이터 교환 과정에서도 유지됩니다. 파일 TVF 옵션인 `enable_mapping_varbinary`는 별도의 설정이며 기본값은 여전히 `false`입니다. 필요한 경우 명시적으로 활성화하세요.

Hive Text 바이너리 필드는 Hive와 호환되는 Base64 인코딩 및 디코딩을 사용합니다. 십육진수 표현과 관련된 변환에는 `0x` 접두사가 필요하며, 유효한 십육진수 자릿수가 짝수여야 합니다. 유효하지 않은 입력은 `Invalid VARBINARY hex representation`을 반환합니다.

이 지원으로 Doris 내부 테이블에서 바이너리 컬럼을 기본적으로 저장할 수 있게 되는 것은 아닙니다. VARBINARY는 Hash Join 또는 Group By 키, 비교 조건자, `IN` 또는 `NOT IN`, 그리고 바이너리 의미 체계를 지원하지 않는 `collect_set` 등의 연산에 사용할 수 없습니다. Doris 4.1.5는 이러한 사용을 명시적으로 거부합니다.

### 키워드 {#keywords}
VARBINARY
