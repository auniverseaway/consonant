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
* Aside - v0.0.1
*/

import { decorateContent } from "../../scripts/decorate.js";

export default function init(el) {
    const children = el.querySelectorAll(':scope > div');

    const foreground = children[children.length - 1];
    foreground.classList.add('foreground', 'container');
    const text = foreground.querySelector('h1, h2, h3, h4, h5, h6')?.closest('div');

    if (children.length > 1) {
        const background = children[0];
        background.classList.add('background');

        if (!background.querySelector(':scope img')) {
            background.children[0].style.display = 'none';
            background.setAttribute('style', `background: ${background.textContent}`);
        }
    }

    text?.classList.add('text');
    text?.querySelector(':scope img')?.classList.add('secondary');
    foreground?.querySelector(':scope > div:not([class])')?.classList.add('image');

    decorateContent(text, ['detail-M', 'heading-XL', 'body-S']);
}
