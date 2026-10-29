"""Check an exported archive against its source-coverage manifest."""
import hashlib
import json
import sys
from pathlib import Path
from pypdf import PdfReader

directory = Path(sys.argv[1] if len(sys.argv) > 1 else 'output/pdf/archived-docs')
manifest = json.loads((directory / 'manifest.json').read_text())
for item in manifest['files']:
    file = directory / item['filename']
    data = file.read_bytes()
    assert len(data) == item['bytes'], file
    assert hashlib.sha256(data).hexdigest() == item['sha256'], file
    reader = PdfReader(file)
    assert len(reader.pages) == item['pages'], file
    assert len(reader.outline) == item['documents'] + 1, file
    assert len(set(item['sourceFiles'])) == item['documents'], file
    assert reader.metadata.author == 'Apache Doris', file
    for page in reader.pages:
        for ref in page.get('/Annots', []):
            uri = str(ref.get_object().get('/A', {}).get('/URI', ''))
            assert 'archive.invalid' not in uri, (file, uri)
    sample = [0, 1, 30, len(reader.pages) // 2, len(reader.pages) - 1]
    for index in sample:
        text = reader.pages[index].extract_text()
        assert text.strip(), (file, index)
        assert '\ufffd' not in text, (file, index)
    print(json.dumps({'file': item['filename'], 'pages': len(reader.pages),
                      'documents': item['documents'], 'imageWarnings': len(item['imageWarnings']),
                      'status': 'pass'}))
