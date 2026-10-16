---
{
    "title": "データ型のマッピング",
    "language": "ja",
    "description": "Doris Streaming Job CDC におけるデータ型のマッピング。テーブルの自動作成時に PostgreSQL の型が Doris の列型にどう対応し、Doris への書き込み時に値がどう変換されるかを説明します。"
}
---

<!-- Knowledge type: Reference / data type mapping -->

以下の表は、PostgreSQL の各列型が Doris のどの列型に対応するかを示します。このマッピングは両方の同期方式で共通です。異なるのはターゲットテーブルを作成する主体だけです。

- **自動テーブル作成同期（Auto Table Creation Sync）**: Doris がソース側のスキーマを読み取り、以下の Doris 列型でターゲットテーブルを自動的に作成します。
- **SQL マッピング同期（SQL Mapping Sync）**: 各列に互換性のある Doris の型を指定して、ターゲットテーブルを自分で作成します。

どちらの方式でも、値は同じマッピングに従って書き込まれます。サポートされていない型については、[制限事項](./continuous-load-overview.md#limitations)を参照してください。

## PostgreSQL から Doris への型マッピング

| PostgreSQL の型 | Doris の型 | 備考 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 精度の上限は 38。スケールを指定しない場合のデフォルトは 9 |
| `bpchar(n)`（つまり `CHAR(n)`） | `CHAR` / `VARCHAR` | 長さを ×3 に拡大して UTF-8 に対応。`> 255` の場合は `VARCHAR` |
| `varchar` / `text` | `STRING` | PostgreSQL の `varchar` は `STRING` にマッピングされる（長さ指定なし） |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | スケールは 0–6。`timestamptz` はサーバーのタイムゾーンに正規化される |
| `time` / `timetz` / `interval` | `STRING` | `timetz` は UTC に正規化されたオフセットを保持する |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64 でエンコードされた文字列 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| ジオメトリ型（`point`、`line`、`polygon`、…） | `STRING` | GeoJSON 文字列としてシリアライズされる（`type` / `coordinates` / `srid`） |
| 配列型（例: `int4[]`、`text[]`） | `ARRAY<T>` | 一次元のみ |
| その他 / ユーザー定義型 | `STRING` | |
