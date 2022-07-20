set -e

echo "Downloading Blogs and Docs..."

/bin/bash download_blogs.sh

/bin/bash download_docs.sh

echo "Building Portal..."
npm run build

echo "Building Success"