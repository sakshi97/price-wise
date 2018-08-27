/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {PRICE_CHECK_TIMEOUT_INTERVAL} from 'commerce/config';
import {updateProductWithExtracted, updatePrices} from 'commerce/background/prices';
import store from 'commerce/state';
import {extractedProductShape} from 'commerce/state/products';
import {loadStateFromStorage} from 'commerce/state/sync';
import {validatePropType} from 'commerce/utils';

const FIRST_RUN_URL = browser.extension.getURL('/first_run/index.html');
const PAGE_ACTION_URL = browser.extension.getURL('/page_action/index.html');

/**
 * Triggers background tasks when a product is extracted from a webpage. Along
 * with normal page navigation, this is also run when the prices are being
 * updated in the background.
 *
 * @param {ExtractedProduct} extracted
 * @param {MessageSender} sender
 *  The sender for the content script that extracted this product
 */
function handleExtractedProductData(extractedProduct, sender) {
  // Do nothing if the extracted product is missing fields.
  const result = validatePropType(extractedProduct, extractedProductShape);
  if (result !== undefined) {
    return;
  }

  // Display pageAction if we can
  if (sender.tab) {
    const url = new URL(PAGE_ACTION_URL);
    url.searchParams.set('extractedProduct', JSON.stringify(extractedProduct));

    browser.pageAction.setPopup({
      popup: url.href,
      tabId: sender.tab.id,
    });
    browser.pageAction.show(sender.tab.id);
  }

  // Update saved product data if it exists
  updateProductWithExtracted(extractedProduct);
}

(async function main() {
  // Setup product extraction listener
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.from === 'content' && message.subject === 'ready') {
      handleExtractedProductData(message.extractedProduct, sender);
    }
  });

  // Enable content scripts now that the background listener is registered.
  // Store the return value globally to avoid destroying it, which would
  // unregister the content scripts.
  window.registeredContentScript = browser.contentScripts.register({
    matches: ['<all_urls>'],
    js: [
      {file: 'product_info.bundle.js'},
    ],
    runAt: 'document_idle',
    allFrames: true,
  });

  // Display first run page if we were just installed
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      browser.tabs.create({url: FIRST_RUN_URL});
    }
  });

  // Make sure the store is loaded before we check prices.
  await store.dispatch(loadStateFromStorage());

  // Update product prices while the extension is running, including once during
  // startup.
  updatePrices();
  setInterval(updatePrices, PRICE_CHECK_TIMEOUT_INTERVAL);
}());