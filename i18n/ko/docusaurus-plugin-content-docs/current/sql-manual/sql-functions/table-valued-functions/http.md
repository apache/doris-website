---
{
    "title": "HTTP",
    "language": "ko",
    "description": "Apache Doris HTTP 테이블 반환 함수(TVF)를 사용하면 REST API 응답, 원격 데이터 파일, Hugging Face 데이터셋 등 모든 HTTP/HTTPS 엔드포인트의 데이터를 SQL로 직접 쿼리할 수 있습니다. JSON, CSV, Parquet, ORC 형식 파싱을 지원합니다."
}
---

HTTP 테이블 반환 함수(TVF)를 사용하면 모든 HTTP 엔드포인트에서 반환하는 데이터를 관계형 테이블 데이터처럼 읽을 수 있습니다. 반환된 데이터가 지원되는 형식이면 SQL로 직접 쿼리하고 분석할 수 있습니다. 현재 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 데이터 형식을 지원합니다.

대표적인 사용 사례는 다음과 같습니다.

- HTTP/HTTPS에서 호스팅되는 데이터 파일 쿼리(예: GitHub, S3 등).
- JSON 형식의 데이터를 반환하는 HTTP API 엔드포인트 직접 쿼리.
- Hugging Face에서 호스팅되는 데이터셋 접근.

:::note
버전 4.0.2부터 지원됩니다.
:::

## 구문 {#syntax}

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```

### 필수 매개변수 {#required-parameters}

| 매개변수         | 설명                  |
|-------------------|------------------------------|
| uri               | 접근할 HTTP 주소입니다. `http`, `https`, `hf` 프로토콜을 지원합니다. 데이터 파일의 URL이나 데이터를 반환하는 API 엔드포인트를 지정할 수 있습니다. |
| format            | 데이터 형식으로, HTTP 엔드포인트에서 반환하는 콘텐츠를 파싱하는 방식을 지정합니다. `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`를 지원합니다. |

`hf://`(Hugging Face)에 대한 자세한 내용은 [Hugging Face 데이터 분석](../../../lakehouse/huggingface.md)을 참조하세요.

### 선택적 매개변수 {#optional-parameters}

| 매개변수      | 설명    | 참고 사항    |
|-------|-----------|------------------------|
| `http.header.xxx`  | 임의의 HTTP 헤더를 지정하는 데 사용하며, 지정한 헤더는 HTTP 클라이언트에 그대로 전달됩니다. | 예를 들어 `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`로 지정하면 헤더는 `Authorization: Bearer hf_MWYzOJJoZEymb...`가 됩니다. |
| `http.enable.range.request` | HTTP 서비스에 접근할 때 범위 요청을 사용할지 여부입니다. 기본값은 `true`입니다. | |
| `http.max.request.size.bytes` | 범위 요청을 사용하지 않는 모드에서 접근할 수 있는 최대 데이터 크기입니다. 기본값은 100 MB입니다. | |

`http.enable.range.request`가 `true`이면 시스템은 먼저 범위 요청으로 HTTP 서비스에 접근을 시도합니다. HTTP 서비스가 범위 요청을 지원하지 않으면 범위 요청을 사용하지 않는 모드로 자동 전환됩니다. 접근할 수 있는 최대 데이터 크기는 `http.max.request.size.bytes`로 제한됩니다.

## 예제 {#examples}

### HTTP를 통해 데이터 파일 읽기 {#reading-data-files-over-http}

- GitHub에서 CSV 데이터 읽기

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```

- GitHub에서 Parquet 데이터 읽기

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```

- GitHub에서 JSON 데이터를 읽고 `DESC FUNCTION`으로 스키마 확인하기

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```

### HTTP API 엔드포인트 쿼리 {#querying-http-api-endpoints}

HTTP 테이블 함수를 사용하면 JSON 형식의 데이터를 반환하는 HTTP API 엔드포인트를 직접 쿼리할 수 있습니다. 다음은 JSON 데이터를 반환하는 REST API를 쿼리하는 예제입니다.

```sql
SELECT * FROM
HTTP(
    "uri" = "https://api.example.com/v1/data",
    "format" = "json",
    "http.header.Authorization" = "Bearer your_token",
    "strip_outer_array" = "true"
);
```

:::tip
범위 요청을 지원하지 않는 HTTP API 엔드포인트에서는 시스템이 범위 요청을 사용하지 않는 모드로 자동 전환됩니다. `http.enable.range.request` 매개변수로 범위 요청을 수동으로 비활성화할 수 있습니다.
:::
