#!/bin/bash

# Package WTM Ambassador Activity Exporter for Chrome Web Store

echo "Packaging extension for Chrome Web Store..."

# Create a temporary directory
PACKAGE_DIR="wtm-ambassador-exporter-package"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# Copy necessary files
echo "Copying extension files..."
cp manifest.json $PACKAGE_DIR/
cp background.js $PACKAGE_DIR/
cp content.js $PACKAGE_DIR/
cp popup.html $PACKAGE_DIR/
cp popup.css $PACKAGE_DIR/
cp popup.js $PACKAGE_DIR/
cp jszip.min.js $PACKAGE_DIR/
cp xlsx.full.min.js $PACKAGE_DIR/
cp README.md $PACKAGE_DIR/

# Copy icons
echo "Copying icons..."
cp -r icons $PACKAGE_DIR/

# Create the ZIP file
echo "Creating ZIP archive..."
cd $PACKAGE_DIR
zip -r ../wtm-ambassador-exporter.zip ./*
cd ..

# Clean up
rm -rf $PACKAGE_DIR

echo "✅ Package created: wtm-ambassador-exporter.zip"
echo ""
echo "Next steps:"
echo "1. Generate icons using create-wtm-icons.html"
echo "2. Take screenshots for the Chrome Web Store"
echo "3. Host your privacy policy and get the URL"
echo "4. Go to: https://chrome.google.com/webstore/devconsole"
echo "5. Upload wtm-ambassador-exporter.zip"
echo ""
