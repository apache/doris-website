---
{
    "title": "View Tablet Compaction Score",
    "language": "en",
    "description": "View and rank tablet compaction scores on a BE node, with optional metadata synchronization in storage-compute decoupled mode."
}
---

# View Tablet Compaction Score

## Description

Use this read-only API to find tablets with high compaction scores on one BE node. A tablet's score is the sum of the scores of its rowsets. Results are sorted by `compaction_score` in descending order. In storage-compute decoupled mode, the API inspects running tablets currently cached by this BE, rather than every tablet in the cluster.

## Prerequisites

Connect directly to the BE HTTP port (8040 by default). If the BE configuration `enable_all_http_auth` is enabled, use a Doris account with the global `ADMIN` privilege. Replace the credentials in the examples with that account.

## Request

```text
GET /api/compaction_score?top_n=<integer>&sync_meta=<boolean>
```

The request has no body.

## Query parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `top_n` | Non-negative integer | No | All available tablets | Return at most the N tablets with the highest scores. `0` returns `[]`. The value must fit in a signed 64-bit integer. |
| `sync_meta` | Boolean: `true` or `false` | No | `false` | Storage-compute decoupled mode only. When `true`, synchronize metadata and rowsets for the BE's cached running tablets from Meta Service before calculating scores. Omit this parameter entirely in storage-compute coupled mode, including `sync_meta=false`. |

## Basic usage

The following request checks connectivity and parameter handling without returning tablet rows:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=0'
```

```json
[]
```

## Response

A successful request returns HTTP 200 and a JSON array. Each element has two string-valued fields:

| Field | Description |
|---|---|
| `tablet_id` | Tablet ID. |
| `compaction_score` | Sum of the compaction scores of the tablet's rowsets. |

For example, return up to 10 tablets:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10'
```

The following output is illustrative; the IDs, scores, and number of returned tablets depend on the BE:

```json
[
    {"compaction_score": "5", "tablet_id": "42595"},
    {"compaction_score": "4", "tablet_id": "10034"}
]
```

In storage-compute decoupled mode, request fresh cached-tablet metadata before calculating scores:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10&sync_meta=true'
```

The response uses the same JSON format, calculated after synchronization.

## Error handling and caveats

- An unparseable or negative `top_n` returns HTTP 400, for example `invalid argument: top_n=wrong`.
- A nonempty `sync_meta` in storage-compute coupled mode returns HTTP 400: ``param `sync_meta` is only available for cloud mode``.
- In storage-compute decoupled mode, a nonempty `sync_meta` other than `true` or `false` returns HTTP 400, for example `invalid argument: sync_meta=wrong`.
- A metadata synchronization failure returns HTTP 500. If authentication is enabled, missing or invalid credentials can return HTTP 401 or 403.
- `top_n` limits the response size, not the number of tablets inspected or synchronized. A score is an observation of this BE's tablet state, rather than an atomic cluster-wide snapshot.

## Best practices

Start with a small `top_n` and the default `sync_meta=false` to identify tablets for further investigation. Use `sync_meta=true` when fresh metadata is necessary; it synchronizes all cached running tablets before applying `top_n` and can increase latency and Meta Service load.
