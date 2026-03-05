---
{
    "title": "PAD ROWSET",
    "language": "en"
}
---

# PAD ROWSET
## description
   
    Pad one empty rowset as one substitute for error replica.

    METHOD: POST
    URI: http://be_host:be_http_port/api/pad_rowset?tablet_id=xxx&start_version=xxx&end_version=xxx

## example

    curl -X POST "http://hostname:8088/api/pad_rowset?tablet_id=123456\&start_version=1111111\$end_version=1111112"

## keyword

    ROWSET,TABLET,ROWSET,TABLET
