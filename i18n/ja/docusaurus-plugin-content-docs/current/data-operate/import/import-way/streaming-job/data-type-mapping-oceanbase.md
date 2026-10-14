---
{
    "title": "OceanBase のデータ型マッピング",
    "language": "ja",
    "sidebar_label": "データ型マッピング",
    "description": "CDC の自動テーブル作成同期で、MySQL 互換モードの OceanBase の列型が Doris の列型にどうマッピングされるかを説明します。"
}
---

<!-- Knowledge type: Reference / data type mapping -->

OceanBase CDC の継続的なロードは MySQL 互換モードのみをサポートし、MySQL の型変換処理を使用します。以下の表は、テーブルの自動作成時に OceanBase の列型が Doris の列型にどうマッピングされるかを示します。

:::caution 実験的機能

OceanBase CDC の継続的なロードは、Doris 4.1.4 以降で実験的機能として利用できます。

:::

## JDBC URL パラメータの正規化

OceanBase Streaming Job を作成すると、`jdbc_url` で明示的に設定していない限り、Doris は次のパラメータを自動的に追加します。

| パラメータ | 追加される値 | 効果 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` を `TINYINT`（`1` / `0`）として読み取ります。`BOOLEAN`（`true` / `false`）としては読み取りません。 |
| `yearIsDateType` | `false` | `YEAR` を日付ではなく、整数の年として読み取ります。 |
| `useUnicode` | `true` | Unicode エンコーディングを使用します。 |
| `characterEncoding` | `utf-8` | 文字セットに UTF-8 を使用します。 |

これらのパラメータを `jdbc_url` で明示的に設定した場合、Doris は設定された値をそのまま使用します。

## OceanBase から Doris への型マッピング

| OceanBase の型（MySQL 互換モード） | Doris の型 | 備考 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | デフォルトでは値は `1` / `0` です。JDBC の読み取り動作を変更するには、`tinyInt1isBit=true` を設定します。 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 整数の年として読み取られます。ゼロ年（`0000`）は `0` として保持されます。 |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 精度が非常に高い場合は `STRING` にフォールバックします。 |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | マイクロ秒のスケールを 0 から 6 まで保持します。 |
| `TIMESTAMP` | `DATETIME(s)` | サーバーのタイムゾーンに正規化されます。 |
| `TIME` | `STRING` | 文字列として格納されます。例: `12:34:56.000000`。 |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 でエンコードされた文字列。 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 でエンコードされた文字列。 |
| `JSON` | `STRING` | JSON テキストとして格納されます。 |
| `ENUM` | `STRING` | ラベルの値に変換されます。 |
| `SET` | `STRING` | カンマ区切りのラベルに変換されます。 |
| 空間型（`GEOMETRY`、`POINT` など）およびその他の型 | サポート対象外 | このような列があるテーブルでは、自動テーブル作成に失敗します。主キー以外の列は `table.<table_name>.exclude_columns` で除外できます。 |

## 注意事項

- 型マッピングは、MySQL Connector/J を介して OceanBase から返されるメタデータに基づきます。
- サポートされていない型が任意の Doris の型にフォールバックすることはありません。本番環境のジョブを作成する前に、ターゲットテーブルのスキーマを確認してください。
- `TIMESTAMP` はソースのタイムゾーンと JDBC URL パラメータ `serverTimezone` の影響を受けます。異なるタイムゾーンにまたがる環境では、タイムゾーンを明示的に設定して確認してください。
- 主キー列は `table.<table_name>.exclude_columns` で除外できません。

## 関連ドキュメント

- [自動テーブル作成を使用した OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase のスキーマ変更同期](./schema-change-oceanbase.md)
- [継続的なロードの概要](./continuous-load-overview.md)
