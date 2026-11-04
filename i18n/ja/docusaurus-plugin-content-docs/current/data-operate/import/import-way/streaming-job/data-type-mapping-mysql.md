---
{
    "title": "データ型マッピング",
    "language": "ja",
    "description": "Doris Streaming Job CDC のデータ型マッピング: 自動テーブル作成時に上流の MySQL 型が Doris の列型にどのようにマッピングされるか、および Doris に書き込む際に値がどのように変換されるか。"
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Reference / data type mapping -->

以下のテーブルは、上流 MySQL の各列型が Doris の列型にどのようにマッピングされるかを示します。マッピングは単一で、どちらの同期方式でも共有されます。違いはターゲットテーブルを作成する主体だけです。

- **自動テーブル作成同期 (Auto Table Creation Sync)**: Doris は上流スキーマを読み取り、これらの Doris 列型でターゲットテーブルを自動的に作成します。
- **SQL マッピング同期 (SQL Mapping Sync)**: 自分でターゲットテーブルを作成し、各列に互換性のある Doris 型を使用します。

どちらの場合も、値は同じマッピングに従って書き込まれます。サポートされていない型については、[制限事項](./continuous-load-overview.md#limitations) を参照してください。

## JDBC URL パラメータの正規化 {#jdbc-url-parameter-normalization}

MySQL データソースで Streaming Job を作成する場合（または `cdc_stream()` テーブル関数を使用する場合）、`jdbc_url` に以下のパラメータを明示的に設定していない限り、Doris はそれらを自動的に追加します。

| パラメータ | 注入値 | 効果 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` は `BOOLEAN`（`true` / `false`）ではなく、`TINYINT`（`1` / `0`）として読み取られます |
| `yearIsDateType` | `false` | `YEAR` は日付ではなく整数年として読み取られます |
| `useUnicode` | `true` | Unicode エンコーディングを使用します |
| `characterEncoding` | `utf-8` | 文字セットとして UTF-8 を使用します |

これらのパラメータが `jdbc_url` に明示的に設定されている場合、Doris はその値を保持し、上書きしません。PostgreSQL の `jdbc_url` は正規化されません。

:::caution アップグレードの影響

`TINYINT(1)` を `BOOLEAN` として、または `YEAR` を日付として読み取るには、`jdbc_url` にそれぞれ `tinyInt1isBit=true` または `yearIsDateType=true` を明示的に設定します。

:::

## MySQL から Doris へ {#mysql-to-doris}

| MySQL 型 | Doris 型 | 注記 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | `TINYINT` にマッピングされます（値は `1` / `0`）。理由については [JDBC URL パラメータの正規化](#jdbc-url-parameter-normalization) を参照してください |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 値は日付ではなく整数年として読み取られます。MySQL のゼロ年（`0000`）は `0` のまま保持されます |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 非常に高い精度の場合は `STRING` にフォールバックします |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | マイクロ秒スケール（0–6）を保持します |
| `TIMESTAMP` | `DATETIME(s)` | サーバーのタイムゾーンに正規化されます |
| `TIME` | `STRING` | 文字列としてシリアル化されます。例: `12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 エンコードされた文字列 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 エンコードされた文字列 |
| `JSON` | `STRING` | JSON テキストとして格納されます |
| `ENUM` | `STRING` | ラベル値に解決されます |
| `SET` | `STRING` | カンマ区切りのラベルに解決されます |
| 空間型（`GEOMETRY`、`POINT` など）およびその他の型 | サポート対象外 | このような列を含むテーブルでは自動テーブル作成が失敗します。SQL マッピング同期（`SELECT` でキャスト）を使用するか、列を除外してください |
