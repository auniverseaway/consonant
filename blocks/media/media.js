/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Z-Pattern - v0.0.1
 */

import { decorateText, decorateIcons, decorateButtons} from "../../scripts/decorate";

function getBlockSize(el) {
  if (el.classList.contains('medium')) {
    return 'medium';
  }else if (el.classList.contains('large')) {
    return 'large';
  }else{
    return 'small';
  }
}

const init = async (block) => {
    const toggleClassStr = 'media-reverse-mobile';
    const children = block.querySelectorAll(':scope > div');
    if (children.length > 1) {
      if(children[0].childNodes.length == 1) {
        children[0].classList.add('background');
        const bgImg = children[0].querySelector(':scope img');
        if (!bgImg) {
          const bgColor = children[0].textContent;
          block.style.background = bgColor;
          children[0].remove();
        }
      }
    }

    const zpattern = block.classList.contains('z-pattern');
    const size = getBlockSize(block);
    const media = block.querySelectorAll(':scope > div:not([class])');
    media.forEach((row, i) => {

        if(zpattern && i % 2) {
          row.classList.add(toggleClassStr);
        }
        row.classList.add(`media-row`);
        const text = row.querySelector('h1, h2, h3, h4, h5, h6').closest('div');
        text.classList.add('text');
        const image = row.querySelector(':scope > div:not([class])');
        if (image) {
          image.classList.add('image');
        }

        decorateText(text, size);
        decorateIcons(text);
        decorateButtons(text);
    });

    const mediaRowReversed  = block.querySelector(':scope > div.media-row > div').classList.contains('text');
    if(mediaRowReversed) {
      block.classList.add(toggleClassStr);
    }

    const multiple = block.classList.contains('multiple');
    if(multiple) {
      const mediaContainer = document.createElement('div');
      mediaContainer.classList.add('media-container');
      media.forEach(function (row, index) {
        mediaContainer.append(row);
      });
      block.append(mediaContainer);
    }
}

export default init;
