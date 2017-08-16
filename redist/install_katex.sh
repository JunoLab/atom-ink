#!/bin/bash

curl -L 'https://github.com/Khan/KaTeX/releases/download/v0.8.1/katex.tar.gz' > katex.tar.gz
tar -xzvf katex.tar.gz
cp -r ./katex/fonts ./katex/images ./katex/katex.css ../styles
rm katex.tar.gz
