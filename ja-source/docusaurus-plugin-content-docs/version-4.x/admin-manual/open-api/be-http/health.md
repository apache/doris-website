---
{
  "title": "生存確認",
  "language": "ja",
  "description": "監視サービスに提供され、BEが生きているかどうかをチェックするために使用される。生きている場合、BEが応答する。"
}
---
# Check Alive

## Request

`GET /api/health`

## 詳細

監視サービスがBEが生きているかどうかをチェックするために提供されます。生きている場合、BEは応答します。

## Query parameters

なし

## Request body

なし

## Response

    ```
    {"status": "OK","msg": ""}
    ```
## 例

    ```
    curl http://127.0.0.1:8040/api/health
    ```
