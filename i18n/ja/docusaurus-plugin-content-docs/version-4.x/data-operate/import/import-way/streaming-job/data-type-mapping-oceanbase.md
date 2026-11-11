---
{
    "title": "OceanBase データ型マッピング",
    "language": "ja",
    "sidebar_label": "データ型マッピング",
    "description": "CDC 自動テーブル作成同期中に、MySQL 互換の OceanBase 列型が Doris 列型にどのようにマッピングされるかを説明します。"
}
---

:::caution 実験的機能

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Reference / data type mapping -->

OceanBase CDC の継続データロードは MySQL 互換モードのみをサポートし、MySQL の型変換パスを使用します。次の表に、自動テーブル作成時に OceanBase の列型が Doris の列型にどのようにマッピングされるかを示します。

## JDBC URL パラメータの正規化 {#jdbc-url-parameter-normalization}

OceanBase Streaming Job を作成すると、`jdbc_url` に次のパラメータを明示的に設定していない限り、Doris はそれらを自動的に追加します。

| パラメータ | 注入される値 | 効果 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` を `BOOLEAN` (`true` / `false`) ではなく `TINYINT` (`1` / `0`) として読み取ります。 |
| `yearIsDateType` | `false` | `YEAR` を日付ではなく整数の年として読み取ります。 |
| `useUnicode` | `true` | Unicode エンコーディングを使用します。 |
| `characterEncoding` | `utf-8` | UTF-8 を文字セットとして使用します。 |

`jdbc_url` でこれらのパラメータのいずれかを明示的に設定した場合、Doris は設定された値を保持します。

## OceanBase から Doris へのマッピング {#oceanbase-to-doris}

| OceanBase の型（MySQL 互換モード） | Doris の型 | 備考 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | 値はデフォルトで `1` / `0` です。`tinyInt1isBit=true` を設定すると、JDBC の読み取り動作を変更できます。 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 整数の年として読み取ります。ゼロ年（`0000`）は `0` として保持されます。 |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 非常に高い精度の場合は `STRING` にフォールバックします。 |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | マイクロ秒のスケール（0～6）を保持します。 |
| `TIMESTAMP` | `DATETIME(s)` | サーバーのタイムゾーンに正規化されます。 |
| `TIME` | `STRING` | 文字列として保存されます。例：`12:34:56.000000`。 |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 エンコードされた文字列。 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 エンコードされた文字列。 |
| `JSON` | `STRING` | JSON テキストとして保存されます。 |
| `ENUM` | `STRING` | ラベル値に解決されます。 |
| `SET` | `STRING` | カンマ区切りのラベルに解決されます。 |
| 空間型（`GEOMETRY`、`POINT` など）およびその他の型 | サポート対象外 | このような列を含むテーブルでは自動テーブル作成に失敗します。`table.<table_name>.exclude_columns` を使用して、非キー列を除外してください。 |

## 考慮事項 {#considerations}

- 型のマッピングは、OceanBase が MySQL Connector/J を介して返すメタデータに基づきます。
- サポートされていない型が任意の Doris 型にフォールバックすることはありません。本番ジョブを作成する前に、ターゲットテーブルのスキーマを確認してください。
- `TIMESTAMP` はソースのタイムゾーンと JDBC URL パラメータ `serverTimezone` の影響を受けます。タイムゾーンをまたぐデプロイでは、タイムゾーンを明示的に設定して確認してください。
- 主キー列は `table.<table_name>.exclude_columns` で除外できません。

## 関連ドキュメント {#related-documents}

- [OceanBase CDC の自動テーブル作成](./continuous-load-oceanbase-database.md)
- [OceanBase Schema Change の同期](./schema-change-oceanbase.md)
- [継続データロードの概要](./continuous-load-overview.md)
