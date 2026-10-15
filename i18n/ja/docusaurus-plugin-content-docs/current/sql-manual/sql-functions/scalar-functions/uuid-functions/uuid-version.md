---
{
    "title": "UUID_VERSION",
    "language": "ja",
    "description": "ネイティブ UUID の 4 ビットのバージョンフィールドを TINYINT として取得します。NULL、全ビットが 0 の UUID、全ビットが 1 の UUID の動作も説明します。"
}
---

## 説明

UUID の四ビットのバージョンフィールドを取得します。入力が `NULL` の場合は `NULL` を返します。

## 構文

```sql
UUID_VERSION(<uuid>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<uuid>` | UUID 型の値。 |

## 戻り値

0～15 の範囲の `TINYINT` を返します。バリアントや UUID のバージョン仕様への適合性は検証せず、バージョンビットを読み取ります。全ビットがゼロの UUID は 0、全ビットが立っている UUID は 15 を返します。入力が `NULL` の場合は `NULL` を返します。

## 例

```sql
SELECT UUID_VERSION(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS v4,
       UUID_VERSION(CAST('018f0f59-1010-7abc-9234-001122334455' AS UUID)) AS v7,
       UUID_VERSION(CAST('00000000-0000-0000-0000-000000000000' AS UUID)) AS zero_version,
       UUID_VERSION(CAST('ffffffff-ffff-ffff-ffff-ffffffffffff' AS UUID)) AS max_version,
       UUID_VERSION(CAST(NULL AS UUID)) AS null_version;
```

```text
+----+----+--------------+-------------+--------------+
| v4 | v7 | zero_version | max_version | null_version |
+----+----+--------------+-------------+--------------+
| 4  | 7  | 0            | 15          | NULL         |
+----+----+--------------+-------------+--------------+
```
