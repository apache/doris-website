set -eo pipefail

echo "Building Docs..."

# clone common docs to versioned_docs
cp -rf benchmark versioned_docs/version-3.x
cp -rf ecosystem versioned_docs/version-3.x
cp -rf faq versioned_docs/version-3.x
cp -rf releasenotes versioned_docs/version-3.x
cp -rf get-starting versioned_docs/version-3.x

npm install -g yarn
yarn cache clean
yarn && yarn build


echo "***************************************"
echo "Docs build success"
echo "***************************************"