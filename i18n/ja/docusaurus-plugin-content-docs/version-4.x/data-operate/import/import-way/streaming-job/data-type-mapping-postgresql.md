---
{
    "title": "データ型のマッピング",
    "language": "ja",
    "description": "Doris Streaming Job CDC のデータ型マッピング。テーブルの自動作成時に上流の PostgreSQL の型が Doris の列型にどう対応するか、および Doris への書き込み時に値がどう変換されるかを説明します。"
}
---

:::caution 実験的な機能

Doris の継続的なデータロードは実験的な機能で、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Reference / data type mapping -->

以下の表は、上流の PostgreSQL の各列型が Doris のどの列型に対応するかを示しています。どちらの同期方式でも同じマッピングを使用します。違いは、対象テーブルを作成する方法だけです。

- **テーブル自動作成による同期**：Doris が上流のスキーマを読み取り、対応する Doris の列型で対象テーブルを自動的に作成します。
- **SQL マッピングによる同期**：各列に互換性のある Doris の型を使用して、対象テーブルを自分で作成します。

どちらの場合も、値は同じマッピングに従って書き込まれます。サポートされていない型については、[制限事項](./continuous-load-overview.md#limitations)を参照してください。

## PostgreSQL から Doris へのマッピング {#postgresql-to-doris}

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
| `bpchar(n)`（`CHAR(n)`） | `CHAR` / `VARCHAR` | UTF-8 に対応するため長さを ×3 に拡大。`> 255` の場合は `VARCHAR` |
| `varchar` / `text` | `STRING` | PostgreSQL の `varchar` は、長さの指定がない `STRING` にマッピングされる |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | スケールは 0～6。`timestamptz` はサーバーのタイムゾーンに正規化される |
| `time` / `timetz` / `interval` | `STRING` | `timetz` は UTC に正規化されたオフセットを保持する |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64 でエンコードされた文字列 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| ジオメトリ型（`point`、`line`、`polygon` など） | `STRING` | GeoJSON 文字列としてシリアライズされる（`type` / `coordinates` / `srid`） |
| 配列型（例：`int4[]`、`text[]`） | `ARRAY<T>` | 一次元のみ |
| その他 / ユーザー定義型 | `STRING` | |
