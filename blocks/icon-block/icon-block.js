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
 * Icon Block - v0.0.1
 */

function decorateButtons(el) {
    const buttons = el.querySelectorAll('em a, strong a');
    buttons.forEach((button) => {
        const parent = button.parentElement;
        const buttonType = parent.nodeName === 'STRONG' ? 'blue' : 'outline';
        button.classList.add('con-button', buttonType);
        parent.insertAdjacentElement('afterend', button);
        parent.remove();
    });
    if (buttons.length > 0) {
        buttons[0].closest('p').classList.add('action-area');
    }
}

function decorateText(el) {
    const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const heading = headings[headings.length - 1];
    heading.classList.add('heading-XL');
    heading.nextElementSibling.classList.add('body-M');
    if (heading.previousElementSibling) {
        heading.previousElementSibling.classList.add('icon-img');
    }
}

function decorateBackground(el) {
    const background = el[0];
    background.classList.add('background');
    if (!background.querySelector(':scope img')) {
        background.children[0].style.display = "none";
        background.setAttribute('style', `background: ${background.textContent}`);
    }
}

export default function init(el) {
    const children = el.querySelectorAll(':scope > div');
    if (children.length > 1) decorateBackground(children);
    const foreground = children[children.length - 1];
    foreground.classList.add('foreground', 'container');
    for (let item of foreground.children) {
        item.classList.add("text");
        const image = item.querySelector(':scope > div:not([class])');
        if (image) image.classList.add('image');
        decorateButtons(item);
        decorateText(item);
    }
}
