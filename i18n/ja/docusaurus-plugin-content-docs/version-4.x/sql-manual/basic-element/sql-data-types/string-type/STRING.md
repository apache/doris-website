---
{
    "title": "STRING",
    "language": "ja",
    "description": "可変長文字列。デフォルトでは 10485760 バイト（10 MiB）をサポートし、最大 2147483643 バイト（2G）まで調整できます。",
}
---

## STRING {#string}
### 説明 {#description}
デフォルトの長さのソフト上限が 10485760 バイト（10 MiB）の可変長文字列です。BE で `string_type_length_soft_limit_bytes` を設定すると、この上限を最大 2147483643 バイト（約 2 GiB）まで引き上げられます。STRING は value 列にのみ使用でき、key 列、パーティション列、バケット列には使用できません。

注：可変長文字列は UTF-8 で保存されるため、通常、英語の文字は 1 バイト、中国語の文字は 3 バイトを占めます。

### キーワード {#keywords}
STRING

### 型の別名とメタデータでの表示 {#type-aliases-and-metadata-display}

`STRING` と `TEXT` は同じ Doris の型を定義します。インターフェースによって、この型の表示名は異なります。

| インターフェース | `STRING` 列の表示 |
| --- | --- |
| `SHOW CREATE TABLE` と `DESC` | `text` |
| `information_schema.columns.DATA_TYPE` | MySQL との互換性のため `varchar` |
| `information_schema.columns.COLUMN_TYPE` | `string` |

これらの名前によって、保存される型や長さの上限が変わることはありません。メタデータで Doris の `STRING` 列と長さに上限がある `VARCHAR` 列を区別するには、`COLUMN_TYPE` を確認してください。
