!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("preact"),require("dlv")):"function"==typeof define&&define.amd?define(["exports","preact","dlv"],t):t((n=n||self).preactLocalize={},n.preact,n.dlv)}(this,function(n,a,l){function r(n){return null!=n}function u(n,t){for(var r in t)n[r]=t[r];return n}l=l&&l.hasOwnProperty("default")?l.default:l;var p=/[?&#]intl=show/,e=function(n){function t(){n.apply(this,arguments)}return n&&(t.__proto__=n),((t.prototype=Object.create(n&&n.prototype)).constructor=t).prototype.getChildContext=function(){var n=this.props,t=n.scope,r=n.definition,e=n.mark,o=n.provider,i=u({},this.context.intl||{});return t&&(i.scope=t),r&&(i.dictionary=function n(t,r){var e=u({},t);for(var o in r)r.hasOwnProperty(o)&&(t[o]&&r[o]&&"object"==typeof t[o]&&"object"==typeof r[o]?e[o]=n(t[o],r[o]):e[o]=t[o]||r[o]);return e}(i.dictionary||{},r)),(e||"undefined"!=typeof location&&String(location).match(p))&&(i.mark=!0),i.provider=o,{intl:i}},t.prototype.render=function(n){return n.children},t}(a.Component);function o(t,r){if(arguments.length<2)return r=t,function(n){return o(n,r)};function n(n){return a.h(e,r||{},a.h(t,n))}return n.getWrappedComponent=t&&t.getWrappedComponent||function(){return t},n}var i,c={};function f(n,t){return i=t||c,n&&n.replace(/\{\{([\w.-]+)\}\}/g,d)}function d(n,t){for(var r=t.split("."),e=i,o=0;o<r.length;o++)if(null==(e=e[r[o]]))return"";return"string"==typeof e&&e.match(/\{\{/)&&(e=f(e,i)),e}function s(n,t){if((t||0===t)&&n&&"object"==typeof n)return n.splice?n[t]||n[0]:0===t&&r(n.none)?n.none:1===t&&r(n.one||n.singular)?n.one||n.singular:n.some||n.many||n.plural||n.other||n}function h(n,t,r,e,o,i,u){void 0===u&&(u=s),t&&(n=t+"."+n);var p=r&&l(r,n);return(p=o?u(p,o)||s(p,o):p)&&f(p,e)||i||null}function v(n,t){var r=n.value,e=n.id,o=t.intl;if(o&&o.mark){var i="dictionary"+(o&&o.scope?"."+o.scope:"")+"."+e;return a.h("mark",{style:{background:r?l(o,i)?"rgba(119,231,117,.5)":"rgba(229,226,41,.5)":"rgba(228,147,51,.5)"},title:e},r)}return r}function y(n,t){var r=n.id,e=n.children,o=n.plural,i=n.fields,u=t.intl,p=h(r,u&&u.scope,u&&u.dictionary,i,o,e,u&&u.provider||s);return a.h(v,{id:r,value:p})}function g(n,t,r){var e={};for(var o in t=t||{},n=function(n){if("string"==typeof(n=n||{})&&(n=n.split(",")),"join"in n){for(var t={},r=0;r<n.length;r++){var e=n[r].trim();e&&(t[e.split(".").pop()]=e)}return t}return n}(n))if(n.hasOwnProperty(o)&&n[o]){var i=n[o];r||"string"!=typeof i?i.type===y&&(i=u({fallback:i.props.children},i.props),e[o]=h(i.id,t.scope,t.dictionary,i.fields,i.plural,i.fallback)):e[o]=h(i,t.scope,t.dictionary)}return e}function t(n,t){var r=n.children,e=t.intl;return r&&r.length?r.map(function(n){return a.cloneElement(n,g(n.props,e,!0))}):r&&a.cloneElement(r,g(r.props,e,!0))}function m(n){return a.h(t,null,a.h(b,{html:a.h(y,n),id:n.id}))}function b(n){var t=n.html,r=n.id,e=t?"string"==typeof t?a.h("span",{dangerouslySetInnerHTML:{__html:t}}):a.h("span",null,t):t;return a.h(v,{id:r,value:e})}function x(o){return function(e){function n(n,t){var r=g("function"==typeof o?o(n,t):o,t.intl);return a.h(e,u(u({},n),r))}return n.getWrappedComponent=e&&e.getWrappedComponent||function(){return e},n}}(o.intl=o).IntlProvider=e,o.Text=y,o.MarkupText=m,o.Localizer=t,o.withText=x,n.IntlProvider=e,n.Localizer=t,n.MarkupText=m,n.Text=y,n.default=o,n.intl=o,n.withText=x,Object.defineProperty(n,"__esModule",{value:!0})});