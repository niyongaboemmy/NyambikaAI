#!/bin/bash

# PWA Icon Generator Script
# This script generates all required PWA icon sizes from a single source image
# Requires ImageMagick: brew install imagemagick

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    print_error "ImageMagick is not installed"
    print_info "Install it with: brew install imagemagick"
    exit 1
fi

# Check if source image is provided
if [ $# -eq 0 ]; then
    print_error "No source image provided"
    echo "Usage: ./generate-pwa-icons.sh <source-image.png>"
    echo "Example: ./generate-pwa-icons.sh logo.png"
    exit 1
fi

SOURCE_IMAGE=$1
OUTPUT_DIR="../public"

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    print_error "Source image not found: $SOURCE_IMAGE"
    exit 1
fi

print_info "Starting PWA icon generation..."
print_info "Source image: $SOURCE_IMAGE"
print_info "Output directory: $OUTPUT_DIR"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Define required icon sizes for PWA
SIZES=(16 32 48 64 96 120 128 144 152 167 180 192 256 384 512 1024)

print_info "Generating ${#SIZES[@]} icon sizes..."

# Generate each icon size
for size in "${SIZES[@]}"; do
    output_file="${OUTPUT_DIR}/icon-${size}x${size}.png"
    convert "$SOURCE_IMAGE" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$output_file"
    
    if [ $? -eq 0 ]; then
        print_success "Generated ${size}x${size} icon"
    else
        print_error "Failed to generate ${size}x${size} icon"
    fi
done

# Generate maskable icons (with safe zone padding)
print_info "Generating maskable icons..."

for size in 192 512; do
    output_file="${OUTPUT_DIR}/icon-${size}x${size}-maskable.png"
    # Add 20% padding for safe zone
    safe_size=$((size * 80 / 100))
    convert "$SOURCE_IMAGE" -resize ${safe_size}x${safe_size} -background none -gravity center -extent ${size}x${size} "$output_file"
    
    if [ $? -eq 0 ]; then
        print_success "Generated ${size}x${size} maskable icon"
    else
        print_error "Failed to generate ${size}x${size} maskable icon"
    fi
done

# Generate Apple Touch Icons
print_info "Generating Apple Touch Icons..."

for size in 180 167 152 120; do
    output_file="${OUTPUT_DIR}/apple-touch-icon-${size}x${size}.png"
    convert "$SOURCE_IMAGE" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$output_file"
    
    if [ $? -eq 0 ]; then
        print_success "Generated Apple Touch Icon ${size}x${size}"
    else
        print_error "Failed to generate Apple Touch Icon ${size}x${size}"
    fi
done

# Generate default apple-touch-icon.png (180x180)
cp "${OUTPUT_DIR}/apple-touch-icon-180x180.png" "${OUTPUT_DIR}/apple-touch-icon.png"
print_success "Created default apple-touch-icon.png"

# Generate favicon.ico (multi-resolution)
print_info "Generating favicon.ico..."
convert "$SOURCE_IMAGE" -resize 16x16 -background none -gravity center -extent 16x16 \
        "$SOURCE_IMAGE" -resize 32x32 -background none -gravity center -extent 32x32 \
        "$SOURCE_IMAGE" -resize 48x48 -background none -gravity center -extent 48x48 \
        "${OUTPUT_DIR}/favicon.ico"

if [ $? -eq 0 ]; then
    print_success "Generated favicon.ico"
else
    print_error "Failed to generate favicon.ico"
fi

# Generate a simple browserconfig.xml for Windows tiles
print_info "Generating browserconfig.xml..."

cat > "${OUTPUT_DIR}/browserconfig.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/icon-128x128.png"/>
            <square150x150logo src="/icon-256x256.png"/>
            <square310x310logo src="/icon-512x512.png"/>
            <TileColor>#6366f1</TileColor>
        </tile>
    </msapplication>
</browserconfig>
EOF

print_success "Generated browserconfig.xml"

# Print summary
echo ""
print_success "========================================="
print_success "Icon generation complete! 🎉"
print_success "========================================="
echo ""
print_info "Generated files in ${OUTPUT_DIR}:"
echo "  - ${#SIZES[@]} standard icons"
echo "  - 2 maskable icons (192x192, 512x512)"
echo "  - 4 Apple Touch icons"
echo "  - 1 favicon.ico"
echo "  - 1 browserconfig.xml"
echo ""
print_warning "Next steps:"
echo "  1. Review generated icons in ${OUTPUT_DIR}"
echo "  2. Update manifest.json with correct icon paths"
echo "  3. Test PWA installation on all platforms"
echo ""
print_info "Icon size reference:"
echo "  - PWA minimum: 192x192 and 512x512"
echo "  - Maskable: Safe zone with 20% padding"
echo "  - Apple: 180x180 (iPhone), 167x167 (iPad)"
echo "  - Favicon: 16x16, 32x32, 48x48"
echo ""
