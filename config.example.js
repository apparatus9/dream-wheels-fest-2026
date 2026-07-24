/**
 * TEMPLATE — copy this file to `config.js` and fill in your real values.
 *
 *     copy config.example.js config.js
 *
 * `config.js` is listed in .gitignore, so your values never get committed.
 * This file is committed so anyone cloning the repo knows what to fill in.
 *
 * NOTE: config.js is gitignored, which means it will NOT come down from a
 * `git clone` or a git-linked deploy. Upload it to your host alongside
 * index.html, or the form falls back to saving entries on-device only.
 */
window.DWF_CONFIG = {

  // Your Instagram handle, WITHOUT the @
  igHandle: 'goldenmilechrysler',

  // Google review link for the optional "leave a review" button on the
  // thank-you screen. Leave '' to hide it. From Google Business Profile >
  // Ask for reviews > copy link (looks like https://g.page/r/XXXX/review).
  googleReviewUrl: '',

  // Prefix for entry ticket numbers, e.g. DW26-0001
  eventCode: 'DW26',

  // ---- Firebase / Firestore ----
  // From Firebase console > Project settings > General > Your apps > SDK setup.
  // These two are NOT secrets — they identify your project, nothing more.
  // What actually protects your data is firestore.rules, which allows
  // creating entries but forbids reading, editing or deleting them.
  firebase: {
    projectId: '',
    apiKey: '',
    collection: 'entries'
  }
};
