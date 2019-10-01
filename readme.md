[![Support](https://www.totaljs.com/img/button-support.png)](https://www.totaljs.com/support/)

- [__Live chat with professional support__](https://messenger.totaljs.com)
- [__HelpDesk with professional support__](https://helpdesk.totaljs.com)
- [Documentation](https://docs.totaljs.com)

# Bufferwall: BlogEngine template

[![MIT License][license-image]][license-url]

First you need to obtain Bufferwall token: <https://bufferwall.com>. Then download the source-code or `bundle` only (recommendation).

- open terminal / command-line
- open app directory
- install latest version of Total.js from NPM `$ npm install total.js`
- modify `/config` file
- run `$ node debug.js`
- open browser `http://127.0.0.1:8000`

__Requirements__:

- Total.js `+v3.3.0`

## Extend template via components

The template supports extending body or panel via Total.js components. Each component must have defined group called `blogengine`.

__Parts__:

- `body-top`
- `body-bottom`
- `panel-top`
- `panel-bottom`

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: license.txt
