#!/bin/bash
VERSION=$(cat package.json | grep '"version"' | sed 's/.*"version": "\(.*\)".*/\1/')
git tag "v$VERSION"
git push origin "v$VERSION"
echo "Created and pushed tag v$VERSION" 