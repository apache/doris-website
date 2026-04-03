---
{
  "title": "STRING",
  "description": "STRING (M) 可変長文字列。デフォルトサポートは1048576バイト（1M）で、最大2147483643バイト（2G）まで調整可能。",
  "language": "ja"
}
---
## STRING
### 説明
STRING (M)
可変長文字列。デフォルトサポートは1048576バイト（1M）で、最大2147483643バイト（2G）まで調整可能です。Stringタイプの長さはbeのstring_type_length_soft_limit_bytes（文字列タイプ長のソフトリミット）設定によっても制限されます。Stringタイプはvalue列でのみ使用でき、key列、partition列、bucket列では使用できません。

注意：可変長文字列はUTF-8エンコーディングで格納されるため、通常英語文字は1バイト、中国語文字は3バイトを占めます。

### キーワード
STRING
