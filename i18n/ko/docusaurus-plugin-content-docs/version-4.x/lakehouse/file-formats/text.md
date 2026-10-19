---
{
    "title": "Text/CSV/JSON",
    "language": "ko",
    "description": "이 문서는 Doris에서 텍스트 파일 형식을 읽고 쓰는 기능의 지원 현황을 소개합니다."
}
---

이 문서는 Doris에서 텍스트 파일 형식을 읽고 쓰는 기능의 지원 현황을 소개합니다.

## Text/CSV {#textcsv}

* Catalog

  `org.apache.hadoop.mapred.TextInputFormat` 형식의 Hive 테이블 읽기를 지원합니다.

  다음 SerDes를 지원합니다:

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (2.1.7부터 지원)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (3.1.0부터 지원)  

* 테이블 반환 함수

* 가져오기

  가져오기 기능은 Text/CSV 형식을 지원합니다. 자세한 내용은 가져오기 문서를 참조하세요.

* 내보내기

  내보내기 기능은 Text/CSV 형식을 지원합니다. 자세한 내용은 내보내기 문서를 참조하세요.

### 지원되는 압축 형식 {#supported-compression-formats}

* 비압축
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

## JSON {#json}

### Catalog {#catalog}

- `org.apache.hadoop.hive.serde2.JsonSerDe` (3.0.4부터 지원)

- `org.apache.hive.hcatalog.data.JsonSerDe` (3.0.4부터 지원)

  1. 기본 타입과 복합 타입을 모두 지원합니다.
  2. `timestamp.formats` SERDEPROPERTIES는 지원하지 않습니다.

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) 형식의 Hive 테이블 (3.0.6부터 지원)

  1. 기본 타입과 복합 타입을 모두 지원합니다.
  2. SERDEPROPERTIES: [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data)만 지원하며, 이 JsonSerDe에서와 동일하게 동작합니다. 다른 SERDEPROPERTIES는 적용되지 않습니다.
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays)는 지원하지 않습니다(Text/CSV 형식과 유사하게 모든 열 데이터를 하나의 배열에 넣는 방식).
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array)는 지원하지 않습니다(스칼라를 요소가 하나인 배열로 변환하는 기능).
  5. 기본적으로 Doris는 테이블 스키마를 올바르게 인식할 수 있습니다. 그러나 일부 매개변수를 지원하지 않아 자동 스키마 인식에 실패할 수 있습니다. 이 경우 `read_hive_json_in_one_column = true`로 설정하여 JSON 행 전체를 첫 번째 열에 넣으면 원본 데이터를 빠짐없이 읽을 수 있습니다. 이후 사용자가 수동으로 처리할 수 있습니다. 이 기능을 사용하려면 첫 번째 열의 데이터 타입이 `String`이어야 합니다.

### 가져오기 {#import}

가져오기 기능은 JSON 형식을 지원합니다. 자세한 내용은 가져오기 문서를 참조하세요.

## 문자 집합 {#character-set}

현재 Doris는 UTF-8 문자 집합 인코딩만 지원합니다. 하지만 Hive Text 형식 테이블의 데이터와 같은 일부 데이터에는 UTF-8이 아닌 인코딩으로 작성된 내용이 포함될 수 있습니다. 이 경우 읽기에 실패하고 다음 오류가 발생합니다:

```text
Only support csv data in utf8 codec
```

이 경우 세션 변수를 다음과 같이 설정할 수 있습니다:

```text
SET enable_text_validate_utf8 = false
```

이렇게 설정하면 UTF-8 인코딩 검사를 건너뛰어 해당 내용을 읽을 수 있습니다. 이 매개변수는 검사만 건너뛰므로 UTF-8이 아닌 인코딩으로 작성된 내용은 여전히 깨진 문자로 표시됩니다.

이 매개변수는 3.0.4 버전부터 지원됩니다.
