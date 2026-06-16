"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.ContentWrapper = void 0;

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _styledTheme = require("styled-theme");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n  padding: 30px 0;\n"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n    padding:50px 31px;\n    background-color: white;\n    .larger {\n    font-size: 24px; /* Adjust the font size as needed */\n    }\n    .ant-typography{\n        margin : 0 !important;\n    }\n.job-header{\n    display : flex;\n    flex-direction : column;\n    gap : 2rem;\n   \n\n}\n.darkened {\n  color: #333; \n}\n.des-header{\n    display : flex;\n    justify-content: space-between;\n    align-items: center;\n    .ant-btn{\n        border-radius : 2rem !important;\n    }\n    .job-header-buttons{\n        display : flex;\n        justify-content: space-around;\n        align-items: center;\n        gap : 0.7rem;\n    }\n}\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var Wrapper = _styledComponents["default"].div(_templateObject());

var ContentWrapper = _styledComponents["default"].div(_templateObject2());

exports.ContentWrapper = ContentWrapper;
var _default = Wrapper;
exports["default"] = _default;