---
{
    "title": "Tablet 메타데이터 관리 도구",
    "language": "ko",
    "description": "최신 코드 버전에서는 tablet의 메타정보를 저장하기 위해 BE에 RocksDB를 도입했습니다."
}
---

# Tablet 메타데이터 관리 도구 {#tablet-metadata-management-tool}

## 배경 {#background}

최신 코드 버전에서는 header 파일을 통해 메타정보를 저장하면서 발생하는 다양한 기능 및 성능 문제를 해결하기 위해 BE에 RocksDB를 도입하여 tablet의 메타정보를 저장하도록 했습니다. 현재 각 데이터 디렉터리(root path)에는 해당 경로의 모든 tablet을 키-값 방식으로 저장하는 RocksDB 인스턴스가 있습니다.

이러한 메타데이터를 쉽게 유지 관리할 수 있도록 관련 관리 작업을 수행하는 온라인 HTTP 인터페이스와 오프라인 meta tool을 제공합니다.

HTTP 인터페이스는 온라인으로 tablet 메타데이터를 조회하는 용도로만 사용하며, BE 프로세스가 실행 중일 때 사용할 수 있습니다.

반면 meta tool은 오프라인 메타데이터 관리 작업에만 사용합니다. 사용하기 전에 BE를 중지해야 합니다.

meta tool은 BE의 Lib / 디렉터리에 있습니다.

## 사용법 {#operation}

### Tablet Meta 조회 {#view-tablet-meta}

Tablet Meta 정보를 조회하는 방법에는 온라인 방식과 오프라인 방식이 있습니다.

#### 온라인 {#online}

BE의 HTTP 인터페이스에 접근하여 해당 Tablet Meta 정보를 가져옵니다.

API:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`


> Host: be 호스트 이름
>
> port: BE의 HTTP 포트
>
> tablet id: tablet ID
>
> schema hash: tablet의 schema hash

예시:

`http://be_host:8040/api/meta/header/14156/2458238340`

쿼리가 성공하면 Tablet Meta가 json 형식으로 반환됩니다.

#### 오프라인 {#offline}

meta tool을 사용하여 디스크에 저장된 Tablet Meta를 가져옵니다.

명령어:

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```

> root_path: be.conf에 설정된 해당 root_path 경로입니다.

결과는 온라인 방식과 마찬가지로 JSON 형식의 Tablet Meta로 표시됩니다.

### header 로드 {#load-header}

tablet을 수동으로 마이그레이션할 수 있도록 header 로드 기능을 제공합니다. 이 기능은 JSON 형식의 Tablet Meta를 사용하므로 shard 필드와 버전 정보를 변경해야 하는 경우 Tablet Meta의 JSON 내용을 직접 수정할 수 있습니다. 그런 다음 아래 명령어로 로드합니다.

명령어:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```

### header 삭제 {#delete-header}

BE의 디스크에서 tablet 메타데이터를 삭제하는 기능입니다. 개별 삭제와 일괄 삭제를 지원합니다.

개별 삭제:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```

일괄 삭제:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```

`tablet_file.txt`의 각 줄은 tablet 하나의 정보를 나타냅니다. 형식은 다음과 같습니다.

`root_path,tablet_id,schema_hash`

각 열은 쉼표로 구분합니다.

`tablet_file` 예시:

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```

일괄 삭제 시 `tablet_file`에서 tablet 정보의 형식이 잘못된 줄은 건너뜁니다. 실행이 완료되면 삭제 성공 건수와 오류 건수가 표시됩니다.

### Pb 형식의 TabletMeta {#tabletmeta-in-pb-format}

이 명령어는 이전 파일 기반 관리 방식의 PB 형식 Tablet Meta를 조회하고, Tablet Meta를 JSON 형식으로 표시합니다.

명령어:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```

### Pb 형식의 Segment 메타데이터 {#segment-meta-in-pb-format}

이 명령어는 PB 형식의 segment 메타데이터를 조회하고, segment 메타데이터를 JSON 형식으로 표시합니다.

명령어:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
