---
{
    "title": "CREATE ROUTINE LOAD",
    "language": "ko",
    "description": "Routine Load 기능을 사용하면 지정된 데이터 소스에서 데이터를 지속적으로 읽어 데이터 적재를 수행하는 상주 작업을 제출할 수 있습니다."
}
---

## 설명 {#description}

Routine Load 기능을 사용하면 지정된 데이터 소스에서 데이터를 지속적으로 읽어 Doris로 데이터 적재를 수행하는 상주 작업을 제출할 수 있습니다.

현재는 인증을 사용하지 않거나 SSL 인증을 사용하는 방식으로 Kafka에서 CSV 또는 Json 형식의 데이터를 가져오는 기능만 지원합니다. [Json 형식 데이터 적재 예제](../../../../data-operate/import/import-way/routine-load-manual.md#import-examples)

## 구문 {#syntax}

```sql
CREATE ROUTINE LOAD [<db>.]<job_name> [ON <tbl_name>]
[<merge_type>]
[<load_properties>]
[<job_properties>]
FROM <data_source> [<data_source_properties>]
[COMMENT "<comment>"]
```

## 필수 매개변수 {#required-parameters}

**1. `[<db>.]<job_name>`**

> 데이터 적재 작업의 이름입니다. 동일한 데이터베이스에서는 같은 이름의 작업을 하나만 실행할 수 있습니다.

**2. `FROM <data_source>`**

> 데이터 소스의 유형입니다. 현재 지원하는 유형은 KAFKA입니다.

**3. `<data_source_properties>`**

> 1. `<kafka_broker_list>`
>
>    Kafka 브로커 연결 정보입니다. 형식은 ip:host이며, 여러 브로커는 쉼표로 구분합니다.
>    
>    ```text
>    "kafka_broker_list" = "broker1:9092,broker2:9092"
>    ```
>
> 2. `<kafka_topic>`
>
>    구독할 Kafka 토픽을 지정합니다.
>    ```text
>    "kafka_topic" = "my_topic"
>    ```

## 선택적 매개변수 {#optional-parameters}

**1. `<tbl_name>`**

> 데이터 적재 대상 테이블의 이름을 지정합니다. 선택적 매개변수이며, 지정하지 않으면 동적 테이블 방식을 사용합니다. 이 경우 Kafka의 데이터에 테이블 이름 정보가 포함되어 있어야 합니다.
>
> 현재는 Kafka의 Value에서 테이블 이름을 가져오는 방식만 지원하며, 다음 형식을 따라야 합니다. json의 예는 `table_name|{"col1": "val1", "col2": "val2"}`입니다.
> 여기서 `tbl_name`은 테이블 이름이며, `|`는 테이블 이름과 테이블 데이터를 구분하는 구분자입니다.
>
> csv 형식의 데이터도 마찬가지로 `table_name|val1,val2,val3` 형식을 사용합니다. 여기서 `table_name`은 Doris의 테이블 이름과 일치해야 하며, 일치하지 않으면 데이터 적재가 실패합니다.
>
> 참고: 동적 테이블은 `columns_mapping` 매개변수를 지원하지 않습니다. 사용 중인 테이블 구조가 Doris의 테이블 구조와 일치하고 데이터 적재할 테이블 정보가 많다면 이 방식이 가장 적합합니다.

**2. `<merge_type>`**

> 데이터 병합 유형입니다. 기본값은 APPEND로, 가져온 데이터에 대해 일반적인 추가 쓰기 작업을 수행합니다. MERGE와 DELETE 유형은 Unique Key 모델 테이블에서만 사용할 수 있습니다. MERGE 유형은 [DELETE ON] 문과 함께 사용하여 Delete Flag 열을 표시해야 합니다. DELETE 유형은 가져온 모든 데이터가 삭제할 데이터임을 의미합니다.
>
> 참고: 여러 동적 테이블을 사용하는 경우 이 매개변수는 각 동적 테이블의 유형과 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다.

**3. `<load_properties>`**

> 가져올 데이터를 설명하는 데 사용합니다. 구성은 다음과 같습니다.
>
> ```SQL
> [column_separator],
> [columns_mapping],
> [preceding_filter],
> [where_predicates],
> [partitions],
> [DELETE ON],
> [ORDER BY]
> ```
>
> 1. `<column_separator>`
>
>    열 구분자를 지정합니다. 기본값은 `\t`입니다.
>
>    `COLUMNS TERMINATED BY ","`
>
> 2. `<columns_mapping>`
>
>    파일의 열과 테이블의 열 간 매핑 관계 및 다양한 열 변환을 지정하는 데 사용합니다. 자세한 내용은 [열 매핑, 변환 및 필터링] 문서를 참조하세요.
>
>    `(k1, k2, tmpk1, k3 = tmpk1 + 1)`
>
>    참고: 동적 테이블은 이 매개변수를 지원하지 않습니다.
>
> 3. `<preceding_filter>`
>
>    원시 데이터를 필터링합니다. 자세한 내용은 [열 매핑, 변환 및 필터링] 문서를 참조하세요.
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    참고: 동적 테이블은 이 매개변수를 지원하지 않습니다.
>
> 4. `<where_predicates>`
>
>    조건에 따라 가져올 데이터를 필터링합니다. 자세한 내용은 [열 매핑, 변환 및 필터링] 문서를 참조하세요.
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    참고: 여러 동적 테이블을 사용하는 경우 이 매개변수는 각 동적 테이블의 열과 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다. 여러 동적 테이블을 사용할 때는 공통 열에 대해서만 이 매개변수를 사용하는 것을 권장합니다.
>
> 5. `<partitions>`
>
>    데이터 적재 대상 테이블의 파티션을 지정합니다. 지정하지 않으면 데이터가 해당 파티션으로 자동 적재됩니다.
>
>    `PARTITION(p1, p2, p3)`
>
>    참고: 여러 동적 테이블을 사용하는 경우 이 매개변수는 각 동적 테이블과 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다.
>
> 6. `<DELETE ON>`
>
>    MERGE 데이터 적재 모드와 함께 사용해야 하며, Unique Key 모델 테이블에만 적용됩니다. 가져올 데이터의 Delete Flag 열과 계산 관계를 지정하는 데 사용합니다.
>
>    `DELETE ON v3 >100`
>
>    참고: 여러 동적 테이블을 사용하는 경우 이 매개변수는 각 동적 테이블과 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다.
>
> 7. `<ORDER BY>`
>
>    Unique Key 모델 테이블에만 적용됩니다. 가져올 데이터의 Sequence Col 열을 지정하는 데 사용하며, 주로 데이터 적재 시 데이터 순서를 보장하는 데 사용합니다.
>
>    참고: 여러 동적 테이블을 사용하는 경우 이 매개변수는 각 동적 테이블과 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다.

**4. `<job_properties>`**

> Routine Load 작업의 일반 매개변수를 지정하는 데 사용합니다.
>
>    ```text
>    PROPERTIES (
>        "key1" = "val1",
>        "key2" = "val2"
>    )
>    ```
>
> 현재 지원하는 매개변수는 다음과 같습니다.
>
> 1. `<desired_concurrent_number>`
>
>     원하는 동시 실행 수입니다. Routine Load 작업은 여러 하위 작업으로 나뉘어 실행됩니다. 이 매개변수는 하나의 작업에서 동시에 실행할 수 있는 하위 작업의 수를 지정합니다. 0보다 커야 하며, 기본값은 5입니다.
>
>    이 값이 실제 동시 실행 수를 의미하지는 않습니다. 실제 동시 실행 수는 클러스터 노드 수, 부하 상태, 데이터 소스 상태를 고려하여 결정됩니다.
>
>    `"desired_concurrent_number" = "3"`
>
> 2. `<max_batch_interval>/<max_batch_rows>/<max_batch_size>`
>
>    이 세 매개변수는 각각 다음을 나타냅니다.
>
>     1. 각 하위 작업의 최대 실행 시간으로, 단위는 초입니다. 1 이상이어야 하며, 기본값은 10입니다.
>     2. 각 하위 작업에서 읽을 최대 행 수입니다. 200000 이상이어야 하며, 기본값은 20000000입니다.
>     3. 각 하위 작업에서 읽을 최대 바이트 수입니다. 단위는 바이트이며, 범위는 100MB에서 10GB까지입니다. 기본값은 1G입니다.
>
>     이 세 매개변수는 하위 작업의 실행 시간과 처리량을 제어하는 데 사용합니다. 어느 하나라도 임계값에 도달하면 작업이 종료됩니다.
>
>     ```text
>     "max_batch_interval" = "20",
>     "max_batch_rows" = "300000",
>     "max_batch_size" = "209715200"
>     ```
>
> 3. `<max_error_number>`
>
>     샘플링 구간 내에서 허용되는 최대 오류 행 수입니다. 0 이상이어야 합니다. 기본값은 0이며, 오류 행을 허용하지 않음을 의미합니다.
>
>     샘플링 구간은 `max_batch_rows * 10`입니다. 샘플링 구간 내 오류 행 수가 `max_error_number`를 초과하면 Routine Load 작업이 일시 중지되며, 사용자가 직접 데이터 품질 문제를 확인해야 합니다.
>
>     where 조건으로 필터링된 행은 오류 행으로 집계하지 않습니다.
>
> 4. `<strict_mode>`
>
>     엄격 모드의 활성화 여부를 지정하며, 기본값은 비활성화입니다. 활성화하면 null이 아닌 원본 데이터가 열 유형 변환 후 NULL이 되는 경우 해당 데이터를 필터링합니다. 다음과 같이 지정합니다.
>
>     `"strict_mode" = "true"`
>
>     엄격 모드는 데이터 적재 과정에서 열 유형 변환을 엄격하게 검사하여 필터링하는 것을 의미합니다. 엄격한 필터링 정책은 다음과 같습니다.
>
>     1. 열 유형 변환 시 엄격 모드가 true이면 오류 데이터를 필터링합니다. 여기서 오류 데이터란 원본 데이터가 null이 아니지만 열 유형 변환 후 null 값이 되는 데이터를 의미합니다.
>     2. 데이터 적재 중 함수 변환으로 생성되는 열에는 엄격 모드가 영향을 미치지 않습니다.
>     3. 범위 제한이 있는 열에서 원본 데이터가 유형 변환은 통과하지만 범위 제한을 통과하지 못하는 경우에는 엄격 모드가 영향을 미치지 않습니다. 예를 들어 유형이 decimal(1,0)이고 원본 데이터가 10이면 유형 변환은 통과할 수 있지만 열에 선언된 범위를 벗어납니다. 엄격 모드는 이러한 데이터에 영향을 미치지 않습니다.
>
>     **엄격 모드와 원본 데이터 적재의 관계**
>
>     TinyInt 열 유형을 사용한 예는 다음과 같습니다.
>
>     참고: 테이블의 열이 null 값을 허용하는 경우입니다.
>
>     | 원본 데이터 | 원본 데이터 예 | string을 int로 변환 | strict_mode   | 결과                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true 또는 false | NULL                   |
>     | null이 아님    | aaa 또는 2000        | NULL          | true          | 유효하지 않은 데이터(필터링됨) |
>     | null이 아님    | aaa                | NULL          | false         | NULL                   |
>     | null이 아님    | 1                  | 1             | true 또는 false | 정상 데이터           |
>
>     Decimal(1,0) 열 유형을 사용한 예는 다음과 같습니다.
>
>     참고: 테이블의 열이 null 값을 허용하는 경우입니다.
>
>     | 원본 데이터 | 원본 데이터 예 | string을 int로 변환 | strict_mode   | 결과                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true 또는 false | NULL                   |
>     | null이 아님    | aaa                | NULL          | true          | 유효하지 않은 데이터(필터링됨) |
>     | null이 아님    | aaa                | NULL          | false         | NULL                   |
>     | null이 아님    | 1 또는 10            | 1             | true 또는 false | 정상 데이터           |
>
>     참고: 10은 범위를 초과하는 값이지만 유형이 decimal의 요구 사항을 충족하므로 엄격 모드는 영향을 미치지 않습니다. 10은 결국 다른 ETL 처리 과정에서 필터링되지만, 엄격 모드에 의해 필터링되지는 않습니다.
>
> 5. `<timezone>`
>
>     데이터 적재 작업에 사용할 시간대를 지정합니다. 기본값은 세션의 timezone 매개변수입니다. 이 매개변수는 데이터 적재에 사용되는 모든 시간대 관련 함수의 결과에 영향을 미칩니다.
>
>     `"timezone" = "Asia/Shanghai"`
>
> 6. `<format>`
>
>     데이터 적재 형식을 지정합니다. 기본값은 csv이며, json 형식을 지원합니다.
>
>     `"format" = "json"`
>
> 7. `<jsonpaths>`
>
>     json 형식의 데이터를 가져올 때 jsonpaths를 사용하여 Json 데이터에서 추출할 필드를 지정할 수 있습니다.
>
>     `-H "jsonpaths: [\"$.k2\", \"$.k1\"]"`
>
> 8. `<strip_outer_array>`
>
>     json 형식의 데이터를 가져올 때 strip_outer_array를 true로 설정하면 Json 데이터가 배열 형태임을 나타내며, 배열의 각 요소를 하나의 행으로 처리합니다. 기본값은 false입니다.
>
>     `-H "strip_outer_array: true"`
>
> 9. `<json_root>`
>
>     json 형식의 데이터를 가져올 때 json_root를 사용하여 Json 데이터의 루트 노드를 지정할 수 있습니다. Doris는 json_root를 통해 루트 노드에서 추출한 요소를 파싱합니다. 기본값은 비어 있습니다.
>
>     `-H "json_root: $.RECORDS"`
>  
> 10. `<send_batch_parallelism>`
>
>     정수 유형으로, 배치 데이터 전송의 병렬도를 설정하는 데 사용합니다. 병렬도 값이 BE 설정의 `max_send_batch_parallelism_per_job`을 초과하면 조정 역할을 하는 BE는 `max_send_batch_parallelism_per_job`의 값을 사용합니다.
>
>     `"send_batch_parallelism" = "10"`
>
> 11. `<load_to_single_tablet>`
>
>     Boolean 유형으로, true는 하나의 작업이 해당 파티션의 tablet 하나에만 데이터 적재를 수행하도록 지원함을 나타냅니다. 기본값은 false입니다. 이 매개변수는 랜덤 버킷팅을 사용하는 olap 테이블에 데이터 적재를 수행할 때만 설정할 수 있습니다.
>
>     `"load_to_single_tablet" = "true"`
>
> 12. `<partial_columns>`
>
>     Boolean 유형으로, true는 부분 열 업데이트를 사용함을 나타냅니다. 기본값은 false입니다. 이 매개변수는 테이블 모델이 Unique이고 Merge on Write를 사용하는 경우에만 설정할 수 있습니다. 여러 동적 테이블은 이 매개변수를 지원하지 않습니다.
>
>     `"partial_columns" = "true"`
>
> 13. `<max_filter_ratio>`
>
>     샘플링 구간 내에서 허용되는 최대 필터링 비율입니다. 0 이상 1 이하여야 하며, 기본값은 0입니다.
>
>     샘플링 구간은 `max_batch_rows * 10`입니다. 샘플링 구간 내에서 오류 행 수/전체 행 수가 `max_filter_ratio`를 초과하면 Routine Load 작업이 일시 중지되며, 사용자가 직접 데이터 품질 문제를 확인해야 합니다.
>
>     where 조건으로 필터링된 행은 오류 행으로 집계하지 않습니다.
>
> 14. `<enclose>`
>
>     필드를 감싸는 문자입니다. csv 데이터 필드에 행 구분자나 열 구분자가 포함된 경우, 데이터가 의도치 않게 잘리는 것을 방지하기 위해 단일 바이트 문자를 필드 감싸기 문자로 지정할 수 있습니다. 예를 들어 열 구분자가 ","이고 필드 감싸기 문자가 "'"이면, 데이터 "a,'b,c'"에서 "b,c"는 하나의 필드로 파싱됩니다.
>
>     참고: enclose를 `"`로 설정하면 trim_double_quotes를 true로 설정해야 합니다.
>
> 15. `<escape>`
>
>     이스케이프 문자입니다. csv 필드에서 필드 감싸기 문자와 동일한 문자를 이스케이프하는 데 사용합니다. 예를 들어 데이터가 "a,'b,'c'"이고 필드 감싸기 문자가 "'"일 때 "b,'c"를 하나의 필드로 파싱하려면 `\`와 같은 단일 바이트 이스케이프 문자를 지정하고 데이터를 `a,'b,\'c'`로 수정해야 합니다.
>
**5. `data_source_properties`의 선택적 속성**

> 1. `<kafka_partitions>/<kafka_offsets>`
>
>     구독할 kafka 파티션과 각 파티션의 시작 오프셋을 지정합니다. 시간을 지정하면 해당 시간 이상인 가장 가까운 오프셋부터 데이터를 소비합니다.
>
>     오프셋은 0 이상의 특정 값으로 지정하거나 다음과 같이 지정할 수 있습니다.
>
>     - `OFFSET_BEGINNING`: 데이터가 존재하는 위치부터 구독을 시작합니다.
>     - `OFFSET_END`: 끝에서부터 구독을 시작합니다.
>     - 시간 형식. 예: "2021-05-22 11:00:00"
>
>     지정하지 않으면 기본적으로 토픽의 모든 파티션을 `OFFSET_END`부터 구독합니다.
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"
>     ```
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00,2021-05-22 11:00:00"
>     ```
>
>    참고: 시간 형식과 OFFSET 형식은 혼용할 수 없습니다.
>
> 2. `<property>`
>
>     사용자 지정 kafka 매개변수를 지정합니다. kafka shell의 "--property" 매개변수와 동일하게 작동합니다.
>
>     매개변수 값이 파일인 경우 값 앞에 "FILE:" 키워드를 추가해야 합니다.
>
>     파일을 생성하는 방법은 [CREATE FILE](../../security/CREATE-FILE) 명령 문서를 참조하세요.
>
>     지원되는 다른 사용자 지정 매개변수는 librdkafka의 공식 CONFIGURATION 문서에 있는 클라이언트 설정 항목을 참조하세요. 예를 들면 다음과 같습니다.
>
>     ```text
>     "property.client.id" = "12345",
>     "property.ssl.ca.location" = "FILE:ca.pem"
>     ```
>
>     2.1 SSL을 사용하여 Kafka에 연결할 때는 다음 매개변수를 지정해야 합니다.
>
>        ```text
>        "property.security.protocol" = "ssl",
>        "property.ssl.ca.location" = "FILE:ca.pem",
>        "property.ssl.certificate.location" = "FILE:client.pem",
>        "property.ssl.key.location" = "FILE:client.key",
>        "property.ssl.key.password" = "abcdefg"
>        ```
>
>        Among them:
>
>        `property.security.protocol` and `property.ssl.ca.location` are required, used to specify the connection method as SSL and the location of the CA certificate.
>
>        If client authentication is enabled on the Kafka server side, the following also need to be set:
>
>        ```text
>        "property.ssl.certificate.location"
>        "property.ssl.key.location"
>        "property.ssl.key.password"
>        ```
>
>        Used to specify the client's public key, private key, and private key password respectively.
>
>     2.2 kafka 파티션의 기본 시작 오프셋 지정
>
>     `<kafka_partitions>/<kafka_offsets>`를 지정하지 않으면 기본적으로 모든 파티션의 데이터를 소비합니다.
>
>     이 경우 `<kafka_default_offsets>`를 지정하여 시작 오프셋을 설정할 수 있습니다. 기본값은 `OFFSET_END`이며, 끝에서부터 구독을 시작함을 의미합니다.
>
>     예:
>
>     ```text
>     "property.kafka_default_offsets" = "OFFSET_BEGINNING"
>     ```

**6. `COMMENT`**

>     Comment information for the routine load task.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 설명 |
| :-------- | :----- | :---- |
| LOAD_PRIV | 테이블 | CREATE ROUTINE LOAD는 테이블의 LOAD 작업에 해당합니다 |

## 사용 시 참고 사항 {#usage-notes}

- 동적 테이블은 `columns_mapping` 매개변수를 지원하지 않습니다
- 여러 동적 테이블을 사용하는 경우 merge_type, where_predicates 등의 매개변수는 각 동적 테이블의 요구 사항을 충족해야 합니다
- 시간 형식과 OFFSET 형식은 혼용할 수 없습니다
- `kafka_partitions`와 `kafka_offsets`는 일대일로 대응해야 합니다
- `enclose`를 `"`로 설정하면 `trim_double_quotes`를 true로 설정해야 합니다.

## 예제 {#examples}

Kafka CSV/JSON 데이터 적재, SSL 인증, Merge 모드, 시퀀스 열 등을 다루는 전체 예제는 데이터 적재 가이드의 [Routine Load](../../../../data-operate/import/import-way/routine-load-manual.md)를 참조하세요.
