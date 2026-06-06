#!/usr/bin/env python3
import sys

from PIL import Image


def convert(input_path, output_path):
    im = Image.open(input_path).convert('RGBA')
    # create sizes commonly used for ico
    sizes = [(16,16),(32,32),(48,48),(64,64),(128,128)]
    # ensure image is square by padding
    max_side = max(im.size)
    bg = Image.new('RGBA', (max_side, max_side), (255,255,255,0))
    bg.paste(im, ((max_side - im.size[0])//2, (max_side - im.size[1])//2), im)
    # resize and save as ico with multiple sizes
    icons = [bg.resize(s, Image.LANCZOS) for s in sizes]
    icons[0].save(output_path, format='ICO', sizes=sizes)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: convert_favicon.py <input_image> <output_ico>')
        sys.exit(2)
    convert(sys.argv[1], sys.argv[2])
