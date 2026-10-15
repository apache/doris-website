---
{
    "title": "データ型のマッピング",
    "language": "ja",
    "description": "Doris Streaming Job CDC のデータ型マッピング。テーブルの自動作成時に上流の MySQL の型が Doris のカラム型にどう対応するか、および Doris への書き込み時に値がどう変換されるかを説明します。"
}
---

<!-- Knowledge type: Reference / data type mapping -->

以下の表に、上流の MySQL の各カラム型と Doris のカラム型の対応を示します。どちらの同期方法でも同じマッピングを使用し、異なるのはターゲットテーブルの作成者だけです。

- **テーブル自動作成による同期（Auto Table Creation Sync）**：Doris が上流のスキーマを読み取り、この表に示す Doris のカラム型でターゲットテーブルを自動的に作成します。
- **SQL マッピングによる同期（SQL Mapping Sync）**：各カラムに互換性のある Doris の型を使用して、ターゲットテーブルを自分で作成します。

どちらの場合も、値の書き込みには同じマッピングが適用されます。サポートされていない型については、[制限事項](./continuous-load-overview.md#limitations)を参照してください。

## JDBC URL パラメータの正規化 {#jdbc-url-parameter-normalization}

> バージョン 4.1.4 以降でサポートされます。

MySQL データソースを使用する Streaming Job を作成する場合（または `cdc_stream()` テーブル関数を使用する場合）、`jdbc_url` で明示的に設定しない限り、Doris は次のパラメータを自動的に追加します。

| パラメータ | 自動追加される値 | 効果 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` を `TINYINT`（`1` / `0`）として読み取り、`BOOLEAN`（`true` / `false`）としては読み取らない |
| `yearIsDateType` | `false` | `YEAR` を日付ではなく整数の年として読み取る |
| `useUnicode` | `true` | Unicode エンコーディングを使用する |
| `characterEncoding` | `utf-8` | 文字セットに UTF-8 を使用する |

これらのパラメータのいずれかを `jdbc_url` で明示的に設定した場合、Doris はその値を保持し、上書きしません。PostgreSQL の `jdbc_url` は正規化されません。

:::caution アップグレード時の影響

4.1.3 以前からアップグレードすると、既存の MySQL CDC ジョブの `TINYINT(1)` カラムは `1` / `0` として報告され、以前の `true` / `false` とは異なります。また、`YEAR` カラムは日付ではなく整数の年として報告されます。以前の動作を維持するには、`tinyInt1isBit=true` と `yearIsDateType=true` を `jdbc_url` で明示的に設定してください。

:::

## MySQL から Doris へのマッピング

| MySQL の型 | Doris の型 | 備考 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | **バージョン 4.1.4 以降**は `TINYINT`（値は `1` / `0`）にマッピングされる。4.1.4 より前は `BOOLEAN`（`true` / `false`）にマッピングされていた。理由については、[JDBC URL パラメータの正規化](#jdbc-url-parameter-normalization)を参照 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | **バージョン 4.1.4 以降**は値を日付ではなく整数の年として読み取る。MySQL のゼロ年（`0000`）は `0` として保持される |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 精度が非常に高い場合は `STRING` にフォールバックする |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | マイクロ秒単位の精度（0～6 桁）が保持される |
| `TIMESTAMP` | `DATETIME(s)` | サーバーのタイムゾーンに正規化される |
| `TIME` | `STRING` | 文字列としてシリアライズされる。例：`12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 でエンコードされた文字列 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 でエンコードされた文字列 |
| `JSON` | `STRING` | JSON テキストとして保存される |
| `ENUM` | `STRING` | ラベル値に変換される |
| `SET` | `STRING` | コンマ区切りのラベルに変換される |
| 空間型（`GEOMETRY`、`POINT` など）およびその他の型 | サポートされていない | このようなカラムを含むテーブルでは、テーブル自動作成が失敗する。SQL マッピングによる同期を使用して `SELECT` でキャストするか、そのカラムを除外する |
