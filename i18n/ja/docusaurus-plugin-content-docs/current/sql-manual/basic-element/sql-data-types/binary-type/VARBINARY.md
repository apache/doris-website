---
{
    "title": "VARBINARY",
    "language": "ja",
    "description": "可変長のバイナリバイト列です。M は最大長（バイト単位）を表します。"
}
---

## VARBINARY {#varbinary}
### 説明 {#description}
可変長のバイナリバイト列です。M は最大長（バイト単位）を表します。

VARCHAR とは異なり、文字セットや照合順序による解釈を行わずに生のバイト列を保持します。そのため、ファイルの断片、ハッシュ、暗号化・圧縮されたデータなど、任意のバイナリデータに適しています。最大長は 2,147,483,647 です。

現在、VARBINARY カラムは、作成するマテリアライズドビューのカラムとして、また Group By キー、Join キー、比較述語での使用には対応していません。

バージョンと制約：4.0 以降でサポートされていますが、現在、Doris でのテーブル作成やデータ保存に使用するカラム型としてはサポートされていません。Catalogs を介して外部システムの BINARY/VARBINARY フィールドを Doris の VARBINARY にマッピングし、クエリで使用できます。

### 4.1.5 以降の外部型と制約 {#external-types-and-restrictions-since-415}

4.1.5 以降、Catalogs は外部のバイナリ型を常に `VARBINARY` として保持します。`enable.mapping.varbinary=false` を指定しても、`STRING` へのマッピングには戻りません。Iceberg の `fixed(N)` は、Block のシリアル化とデータ交換を経由する場合も含め、`VARBINARY(N)` にマッピングされます。開発版では、Iceberg の UUID は、4.1.5 で使用されていた `VARBINARY(16)` ではなく、ネイティブの `UUID` にマッピングされます。File TVFs でも、開発版ではバイナリマッピングが常に有効です。`enable_mapping_varbinary` は互換性のために受け付けられますが、その値は無視されます。4.1.5 では、この TVF オプションは引き続き設定可能で、デフォルト値は `false` です。

Hive Text のバイナリフィールドでは、Hive と互換性のある Base64 エンコードとデコードを使用します。16 進数表現を伴う変換では、`0x` プレフィックスと、偶数個の有効な 16 進数字が必要です。無効な入力に対しては `Invalid VARBINARY hex representation` が返されます。

このサポートによって、Doris の内部テーブルでネイティブのバイナリカラムを保存できるようになるわけではありません。VARBINARY は、Hash Join や Group By のキー、比較述語、`IN` や `NOT IN`、またはバイナリデータに対する意味づけが定義されていない `collect_set` などの操作には使用できません。Doris 4.1.5 では、これらの使用は明示的に拒否されます。

### キーワード {#keywords}
VARBINARY
