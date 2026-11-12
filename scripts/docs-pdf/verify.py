"""Check an exported archive against its source-coverage manifest."""
import argparse
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('directory', type=Path)
parser.add_argument('--allow-missing-images', action='store_true')
args = parser.parse_args()
directory = args.directory
manifest = json.loads((directory / 'manifest.json').read_text())
assert manifest['files'], 'No PDF files in manifest'
for item in manifest['files']:
    assert args.allow_missing_images or not item['imageWarnings'], item['filename']
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
    sample = sorted({index for index in [0, 1, 30, len(reader.pages) // 2, len(reader.pages) - 1] if index < len(reader.pages)})
    for index in sample:
        text = reader.pages[index].extract_text()
        assert text.strip(), (file, index)
        assert '\ufffd' not in text, (file, index)
    print(json.dumps({'file': item['filename'], 'pages': len(reader.pages),
                      'documents': item['documents'], 'imageWarnings': len(item['imageWarnings']),
                      'status': 'pass'}))
