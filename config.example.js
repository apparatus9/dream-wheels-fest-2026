/**
 * TEMPLATE — copy this file to `config.js` and fill in your real values.
 *
 *     copy config.example.js config.js
 *
 * `config.js` is listed in .gitignore, so your real values never get committed.
 * This file (config.example.js) is committed so anyone cloning the repo knows
 * what to fill in.
 *
 * IMPORTANT: config.js is gitignored, which means it will NOT come down from a
 * `git clone` or a git-linked deploy. You must upload it to your host alongside
 * index.html, or the form will fall back to saving entries on-device only.
 */
window.DWF_CONFIG = {

  // Your Instagram handle, WITHOUT the @
  igHandle: 'dreamwheelsfest',

  // Google Apps Script Web App URL — ends in /exec. See SETUP.md step 2.
  // Leave as '' to test locally; entries still save on the device either way.
  submitEndpoint: '',

  // Prefix for entry ticket numbers, e.g. DW26-0001
  eventCode: 'DW26'
};
