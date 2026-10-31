---
{
    "title": "Backends Action",
    "language": "en",
    "description": "Backends Action returns the Backends list, including Backend's IP, PORT and other information."
}
---

# Backends Action

## Request

```
GET /api/backends
```

## Description

Backends Action returns the Backends list, including Backend's IP, PORT and other information.

## Path parameters

None

## Query parameters

* `is_alive`

    Optional parameters. Whether to return the surviving BE nodes. The default is false, which means that all BE nodes are returned.

## Request body

None

## Response

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "backends": [
            {
                "ip": "192.1.1.1",
                "http_port": 8040,
                "is_alive": true
            }
        ]
    },
    "count": 0
}
```
