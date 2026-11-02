---
{
    "title": "STRING",
    "language": "ja",
    "description": "可変長文字列。デフォルトで10485760バイト（10 MiB）をサポートし、最大2147483643バイト（2G）まで調整可能です。"
}
---

## STRING {#string}
### 説明 {#description}
デフォルトのソフト長さ制限が10485760バイト（10 MiB）の可変長文字列です。BE で `string_type_length_soft_limit_bytes` を設定すると、この制限を最大2147483643バイト（約2 GiB）まで引き上げられます。STRING は value 列でのみ使用でき、key 列、パーティション列、バケット列では使用できません。

注: 可変長文字列は UTF-8 エンコーディングで保存されるため、通常、英字は1バイト、中国語文字は3バイトを占有します。

### キーワード {#keywords}
STRING
