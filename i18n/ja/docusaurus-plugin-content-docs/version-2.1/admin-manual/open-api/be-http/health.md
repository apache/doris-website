---
{
  "title": "生存確認",
  "language": "ja",
  "description": "監視サービスに提供され、BEが生きているかどうかをチェックし、生きている場合はBEが応答します。"
}
---
# Check Alive

## Request

`GET /api/health`

## Description

監視サービスがBEが生きているかどうかをチェックするために提供されており、生きている場合はBeが応答します。

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
