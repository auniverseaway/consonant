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
import { decorateBlock, loadBlock } from '../../scripts/scripts.js';

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
    const h1 = block.querySelector('h1');
    if (h1) {
        h1.parentElement.parentElement.classList.add('z-pattern-heading');
        h1.classList.add('heading-L');
    }
    const size = getBlockSize(block);
    const zRows = block.querySelectorAll(':scope > div:not([class])');
    zRows.forEach((mediaBlock, idx) => {
        mediaBlock.classList.add('media');
        decorateBlock(mediaBlock);
        const mediaRow = document.createElement('div');
        const children = mediaBlock.querySelectorAll(':scope > div');
        children.forEach((child) => {
          mediaRow.appendChild(child);
        });
        mediaBlock.classList.add(size);
        mediaBlock.appendChild(mediaRow);
        loadBlock(mediaBlock);
    });

    // // Check how many z-rows are ordered Image/Copy
    let zRowsOddCount = 0;
    zRows.forEach((row) => {
      const mediaWrapper = row.querySelector(':scope > div');
      const rowLeftToRight = mediaWrapper.querySelector(':scope > div:first-of-type').classList.contains('text');
      if (rowLeftToRight) zRowsOddCount++;
    });

    // // If all rows are ordered Image/Copy add alternating rtl class
    if(zRowsOddCount === 0){
      zRows.forEach((row, i) => {
        if ( i % 2 ) row.classList.add('media--reversed');
      });
    }
}

export default init;
