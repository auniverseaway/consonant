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

export function decorateButtons(el) {
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

export function decorateIcons(el, displayText = true) {
  const regex = /[^{\{]+(?=}\})/g; // {{value}}
  const placeholders = el.textContent.match(regex);
  placeholders?.forEach((str) => {
    // todo: get this placeholder data from docs
    const svg = `<img width="40" alt="Adobe Illustrator CC icon" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Adobe_Illustrator_CC_icon.svg/512px-Adobe_Illustrator_CC_icon.svg.png">`;
    const url = `#`;
    el.innerHTML = el.innerHTML.replace(`{{${str}}}`, `<a class="body-S icon ${str}" href="${url}">${svg} ${displayText ? str.split('-')[1] : ""}</a>`);
  });
  const icons = el.querySelectorAll('.icon');
  if (icons.length > 0) {
    icons[0].closest('p').classList.add('product-area');
  }
}

export function decorateText(el, size) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  if (!size || size === 'small') {
    heading.classList.add('heading-XS');
    heading.nextElementSibling.classList.add('body-S');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-M');
    }
  }
  if (size === 'medium') {
    heading.classList.add('heading-M');
    heading.nextElementSibling.classList.add('body-S');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-M');
    }
  }
  if (size === 'large') {
    heading.classList.add('heading-XL');
    heading.nextElementSibling.classList.add('body-M');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-L');
    }
  }
}

// decorate text content in block by passing array of classes [ detail, heading, body ]
export function decorateContent(el, classList) {
  if (el && classList.length == 3) {
    const text = el.querySelector('h1, h2, h3, h4, h5, h6')?.closest('div');
    text?.classList.add('text');
    text?.querySelector(':scope img')?.closest('p')?.classList.add('product-area');
    const headings = text.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const heading = headings[headings.length - 1];
    heading.classList.add(classList[1]);
    heading.nextElementSibling.classList.add(classList[2]);
    if (heading.previousElementSibling) heading.previousElementSibling.classList.add(classList[0]);
    el?.querySelector(':scope > div:not([class])')?.classList.add('image');
  }
}

export function decorateLayout(elems) {
  const foreground = elems[elems.length - 1];
  foreground.classList.add('foreground', 'container');
  if (elems.length > 1) {
    const background = elems[0];
    background.classList.add('background');
    if (!background.querySelector(':scope img')) {
      background.children[0].style.display = 'none';
      background.setAttribute('style', `background: ${background.textContent}`);
    }
  }
  return foreground;
}

export function getBlockSize(el) {
  if (el.classList.contains('medium')) {
    return 'medium';
  } else if (el.classList.contains('large')) {
    return 'large';
  } else {
    return 'small';
  }
}
