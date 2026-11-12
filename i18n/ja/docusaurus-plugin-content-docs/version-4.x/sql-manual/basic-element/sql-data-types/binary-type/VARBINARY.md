---
{
    "title": "VARBINARY",
    "language": "ja",
    "description": "可変長のバイナリバイト列で、M は最大長（バイト単位）を示します。"
}
---

## VARBINARY {#varbinary}
### 説明 {#description}
可変長のバイナリバイト列で、M は最大長（バイト単位）を示します。

VARCHAR とは異なり、文字セットや照合順序を使用して解釈せず、生のバイトを保持します。任意のバイナリデータ（ファイル断片、ハッシュ値、暗号化/圧縮データなど）に適しており、最大長は 2,147,483,647 です。

現在、VARBINARY 列は、作成済みのマテリアライズドビューではサポートされておらず、Group By キー、Join Keys、比較述語にも使用できません。

バージョンと制限事項: 4.0 以降でサポートされています。現在、Doris でのテーブル作成および格納用の列型としてはサポートされていません。クエリ用に、外部システムの BINARY/VARBINARY フィールドを Catalogs 経由で Doris の VARBINARY にマッピングできます。

### 4.1.5 以降の外部型と制限 {#external-types-and-restrictions-since-415}

4.1.5 以降、Catalogs は外部バイナリ型を常に `VARBINARY` として保持します。`enable.mapping.varbinary=false` を設定しても、`STRING` へのマッピングには戻りません。Iceberg の `fixed(N)` は `VARBINARY(N)` に、UUID は `VARBINARY(16)` にマッピングされ、Block のシリアル化およびデータ交換を経る場合も同様です。ファイル TVF のオプション `enable_mapping_varbinary` は独立しており、既定値は引き続き `false` です。必要に応じて明示的に有効にしてください。

Hive Text のバイナリフィールドでは、Hive 互換の Base64 エンコードおよびデコードを使用します。十六進表現を伴う変換では、`0x` プレフィックスと、偶数個の有効な十六進数字が必要です。無効な入力の場合は `Invalid VARBINARY hex representation` が返されます。

このサポートによって、Doris の内部テーブルでネイティブなバイナリ列ストレージが有効になるわけではありません。VARBINARY は Hash Join または Group By キー、比較述語、`IN` または `NOT IN`、またはバイナリセマンティクスを持たない `collect_set` などの操作には使用できません。Doris 4.1.5 では、これらの用途は明示的に拒否されます。

### キーワード {#keywords}
VARBINARY
