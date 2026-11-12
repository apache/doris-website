---
{
    "title": "データ型マッピング",
    "language": "ja",
    "description": "Doris Streaming Job CDC のデータ型マッピング：自動テーブル作成時に上流の PostgreSQL 型が Doris の列型にどのようにマッピングされるか、および Doris に書き込む際に値がどのように変換されるか。"
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Reference / data type mapping -->

下表は、上流の PostgreSQL の各列型が Doris の列型にどのようにマッピングされるかを示します。同期方法がどちらであってもマッピングは単一で、違いはターゲットテーブルを誰が作成するかだけです：

- **自動テーブル作成同期**：Doris が上流のスキーマを読み取り、これらの Doris 列型でターゲットテーブルを自動的に作成します。
- **SQL マッピング同期**：自分でターゲットテーブルを作成し、各列に互換性のある Doris 型を使用します。

どちらの場合も、値は同じマッピングに従って書き込まれます。サポートされていない型については、[制限事項](./continuous-load-overview.md#limitations)を参照してください。

## PostgreSQL から Doris へ {#postgresql-to-doris}

| PostgreSQL 型 | Doris 型 | 備考 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 精度の上限は 38。scale が未指定の場合は 9 |
| `bpchar(n)`（つまり `CHAR(n)`） | `CHAR` / `VARCHAR` | UTF-8 に対応するため長さを ×3 にスケーリングし、`> 255` は `VARCHAR` になります |
| `varchar` / `text` | `STRING` | PostgreSQL の `varchar` は長さなしの `STRING` にマッピングされます |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | スケール 0–6。`timestamptz` はサーバーのタイムゾーンに正規化されます |
| `time` / `timetz` / `interval` | `STRING` | `timetz` は UTC に正規化されたオフセットを保持します |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64 でエンコードされた文字列 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| ジオメトリ型（`point`、`line`、`polygon` など） | `STRING` | GeoJSON 文字列（`type` / `coordinates` / `srid`）としてシリアル化されます |
| 配列型（例：`int4[]`、`text[]`） | `ARRAY<T>` | 一次元のみ |
| その他 / ユーザー定義型 | `STRING` | |
