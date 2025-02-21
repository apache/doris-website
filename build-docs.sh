set -eo pipefail

echo "Building Docs..."

# clone common docs to versioned_docs
cp -rf benchmark versioned_docs/version-3.0
cp -rf ecosystem versioned_docs/version-3.0
cp -rf faq versioned_docs/version-3.0
cp -rf releasenotes versioned_docs/version-3.0
cp -rf get-starting versioned_docs/version-3.0

npm install -g yarn
yarn cache clean
yarn && yarn build


echo "***************************************"
echo "Docs build success"
echo "***************************************"