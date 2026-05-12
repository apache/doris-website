---
{
    "title": "View Tablet Compaction Score",
    "language": "en",
    "description": "It is used to view tablet compaction scores on a BE node."
}
---

# View Tablet Compaction Score

## Request

`GET /api/compaction_score?top_n={int}`

## Description

It is used to view tablet compaction scores on a BE node. The compaction score is calculated as the sum of the compaction scores of all rowsets in each tablet. The response is sorted by `compaction_score` in descending order.

## Query parameters

* `top_n`

    Optional. A non-negative integer. If specified, only the top N tablets with the highest compaction scores are returned. If not specified, all tablets on the BE node are returned. `top_n=0` returns an empty array.

## Request body

None

## Response

Returns a JSON array. Each element contains the following fields:

* `tablet_id`: Tablet ID. The value is returned as a string.
* `compaction_score`: Tablet compaction score. The value is returned as a string.

Example response:

```json
[
    {
        "compaction_score": "5",
        "tablet_id": "42595"
    },
    {
        "compaction_score": "4",
        "tablet_id": "10034"
    }
]
```

## Error handling

If `top_n` is not a valid non-negative integer, the API returns HTTP 400 with an error such as `invalid argument: top_n=wrong`.

## Examples

View the top 10 tablets with the highest compaction scores:

```shell
curl "http://127.0.0.1:8040/api/compaction_score?top_n=10"
```
