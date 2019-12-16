import { Component, h, cloneElement } from 'preact';
import delve from 'dlv';

/** Check if an object is not null or undefined
 *	@private
 */
function defined(obj) {
	return obj!==null && obj!==undefined;
}


/** A simpler Object.assign
 *  @private
 */
function assign(obj, props) {
	for (var i in props) {
		obj[i] = props[i];
	}
	return obj;
}


/** Recursively copy keys from `source` to `target`, skipping truthy values already in `target`.
 *	@private
 */
function deepAssign(target, source) {
	var out = assign({}, target);
	for (var i in source) {
		if (source.hasOwnProperty(i)) {
			if (target[i] && source[i] && typeof target[i]==='object' && typeof source[i]==='object') {
				out[i] = deepAssign(target[i], source[i]);
			}
			else {
				out[i] = target[i] || source[i];
			}
		}
	}
	return out;
}

/** select('foo,bar') creates a mapping: `{ foo, bar }`
 *	@private
 */
function select(properties) {
	properties = properties || {};
	if (typeof properties==='string') {
		properties = properties.split(',');
	}
	if ('join' in properties) {
		var selected = {};
		for (var i=0; i<properties.length; i++) {
			var val = properties[i].trim();
			if (val) { selected[val.split('.').pop()] = val; }
		}
		return selected;
	}
	return properties;
}

var URL_FLAG = /[?&#]intl=show/;


/** `<IntlProvider>` is a nestable internationalization definition provider.
 *	It exposes an Intl scope & definition into the tree,
 *	making them available to descendant components.
 *
 *	> **Note:** When nested, gives precedence to keys higher up the tree!
 *	> This means lower-level components can set their defaults by wrapping themselves
 *	> in an `<IntlProvider>`, but still remain localizable by their parent components.
 *
 *	@name IntlProvider
 *	@param props
 *	@param {String} [props.scope]			Nest `definition` under a root key, and set the active scope for the tree (essentially prefixing all `<Text />` keys).
 *	@param {Boolean} [props.mark=false]		If `true`, all `<Text>` elements will be shown with a red/green background indicating whether they have valid Intl keys.
 *	@param {Object} [props.definition={}]	Merge the given definition into the current intl definition, giving the *current* definition precedence (i.e., only adding keys, acting as defaults)
 *
 *	@example
 *	// generally imported from a JSON file:
 *	let definition = {
 *		foo: 'Le Feux'
 *	};
 *
 *	<IntlProvider scope="weather" definition={definition}>
 *		<Text key="foo">The Foo</Text>
 *	</IntlProvider>
 *
 *	// This will render the text:
 *	"Le Feux"
 */
var IntlProvider = /*@__PURE__*/(function (Component) {
	function IntlProvider () {
		Component.apply(this, arguments);
	}

	if ( Component ) IntlProvider.__proto__ = Component;
	IntlProvider.prototype = Object.create( Component && Component.prototype );
	IntlProvider.prototype.constructor = IntlProvider;

	IntlProvider.prototype.getChildContext = function getChildContext () {
		var ref = this.props;
		var scope = ref.scope;
		var definition = ref.definition;
		var mark = ref.mark;
		var provider = ref.provider;
		var intl = assign({}, this.context.intl || {});

		// set active scope for the tree if given
		if (scope) { intl.scope = scope; }

		// merge definition into current with lower precedence
		if (definition) {
			intl.dictionary = deepAssign(intl.dictionary || {}, definition);
		}

		if (mark || (typeof location!=='undefined' && String(location).match(URL_FLAG))) {
			intl.mark = true;
		}

		intl.provider = provider;

		return { intl: intl };
	};

	IntlProvider.prototype.render = function render (ref) {
		var children = ref.children;

		return children;
	};

	return IntlProvider;
}(Component));

/**
 * Higher-order function that creates an `<IntlProvider />` wrapper component for the given component.  It
 * takes two forms depending on how many arguments it's given:
 * It can take a functional form like:
 * intl(ComponentToWrap, options)
 *
 * or it can take an annotation form like:
 * @intl(options)
 * class ComponentToWrap extends Component {}
 *
 *    @param {Component or Object} args[0] If there are two arguments, the first argument is the Component to wrap in `<IntlProvider/>`. If there is just one argument, this is the options object to pass as `props` to `<IntlProvider/>`. See the definition of the options param below for details.
 *    @param {Object} options If there are two arguments, the second argument is Passed as `props` to `<IntlProvider />`
 *    @param [options.scope]            Nest `definition` under a root key, and set the active scope for the tree (essentially prefixing all `<Text />` keys).
 *    @param [options.definition={}]    Merge the given definition into the current intl definition, giving the *current* definition precedence (i.e., only adding keys, acting as defaults)
 *    @param [options.provider=defaultProvider] Provider function to use to get the plural form to use from the dictionary
 */
function intl(Child, options) {
	if (arguments.length < 2) {
		options = Child;
		return function (Child) { return intl(Child, options); };
	}
	function IntlProviderWrapper(props) {
		return h(
			IntlProvider,
			options || {},
			h(Child, props)
		);
	}

	IntlProviderWrapper.getWrappedComponent = Child && Child.getWrappedComponent || (function () { return Child; });
	return IntlProviderWrapper;
}

var EMPTY = {};

var currentFields;

/** Populate {{template.fields}} within a given string.
 *
 *	@private
 *	@param {String} template	The string containing fields to be resolved
 *	@param {Object} [fields={}]	Optionally nested object of fields, referencable from `template`.
 *	@example
 *		template('foo{{bar}}', { bar:'baz' }) === 'foobaz'
 */
function template(template, fields) {
	currentFields = fields || EMPTY;
	return template && template.replace(/\{\{([\w.-]+)\}\}/g, replacer);
}

/** Replacement callback for injecting fields into a String
 *	@private
 */
function replacer(s, field) {
	var parts = field.split('.'),
		v = currentFields;
	for (var i=0; i<parts.length; i++) {
		v = v[parts[i]];
		if (v == null) { return ''; } // eslint-disable-line eqeqeq
	}
	// allow for recursive {{config.xx}} references:
	if (typeof v==='string' && v.match(/\{\{/)) {
		v = template(v, currentFields);
	}
	return v;
}

/**
 * Default function to determine what plural form to use from the provided dictionary
 * @param dict the dictorary with possible plural forms
 * @param plural the plural count
 * @returns {String | false}
 */
function defaultProvider(dict, plural) {
	// plural forms:
	// key: ['plural', 'singular']
	// key: { none, one, many }
	// key: { singular, plural }
	if ((plural || plural === 0) && dict && typeof dict === 'object') {
		if (dict.splice) {
			return dict[plural] || dict[0];
		}
		else if (plural === 0 && defined(dict.none)) {
			return dict.none;
		}
		else if (plural === 1 && defined(dict.one || dict.singular)) {
			return dict.one || dict.singular;
		}
		return dict.some || dict.many || dict.plural || dict.other || dict;
	}
}

/** Attempts to look up a translated value from a given dictionary.
 *  Also supports json templating using the format: {{variable}}
 *    Falls back to default text.
 *
 *    @private
 *    @param {String} id                Intl field name/id (subject to scope)
 *    @param {String} [scope='']        Scope, which prefixes `id` with `${scope}.`
 *    @param {Object} dictionary        A nested object containing translations
 *    @param {Object} [fields={}]        Template fields for use by translated strings
 *    @param {Number} [plural]        Indicates a quantity, used to trigger pluralization
 *    @param {String|Array} [fallback]    Text to return if no translation is found
 *    @param pluralizer {function: String | false} Provider function to extract the plural form from the dictionary
 *    @returns {String} translated
 */
function translate(id, scope, dictionary, fields, plural, fallback, pluralizer) {
	if ( pluralizer === void 0 ) pluralizer = defaultProvider;

	if (scope) { id = scope + '.' + id; }

	var value = dictionary && delve(dictionary, id);
	value = plural ? pluralizer(value, plural) || defaultProvider(value, plural): value;

	return value && template(value, fields) || fallback || null;
}

/** Highlight/colorize the i18n'd node if `mark` is set on `intl` in context.  If not, just returns `value`
 *
 *	@private
 *	@param {String|VNode} value	The l10n'd text/vnode to highlight or pass through
 *	@param {string} id	The key used to lookup the value in the intl dictionary
 */
function HighlightI18N(ref, ref$1) {
	var value = ref.value;
	var id = ref.id;
	var intl = ref$1.intl;


	if (intl && intl.mark) {
		var dictionaryKey = "dictionary" + (intl && intl.scope ? ("." + (intl.scope)) : '') + "." + id;
		return (
			h( 'mark', {
				style: {
					background: value
						? delve(intl, dictionaryKey)
							? 'rgba(119,231,117,.5)'
							: 'rgba(229,226,41,.5)'
						: 'rgba(228,147,51,.5)'
				}, title: id }, 
				value
			)
		);
	}

	return value;
}

/** `<Text>` renders internationalized text.
 *	It attempts to look up translated values from a dictionary in context.
 *
 *	Template strings can contain `{{field}}` placeholders,
 *	which injects values from the `fields` prop.
 *
 *	When string lookup fails, renders its children as fallback text.
 *
 *	@param {Object} props				props
 *	@param {String} props.id			Key to look up in intl dictionary, within any parent scopes (`$scope1.$scope2.$id`)
 *	@param {Object} [props.fields={}]	Values to inject into template `{{fields}}`
 *	@param {Number} [props.plural]		Integer "count", used to select plural forms
 *	@param {Object} context
 *	@param {Object} context.intl		[internal] dictionary and scope info
 *
 *	@example
 *	// If there is no dictionary in context..
 *	<Text id="foo">The Foo</Text>
 *	// ..produces the text:
 *	"The Foo"
 *
 *	@example
 *	// Given a dictionary and some fields..
 *	<IntlProvider definition={{ foo:'Le Feux {{bar}}' }}>
 *		<Text id="foo" fields={{ bar: 'BEAR' }}>The Foo</Text>
 *	</IntlProvider>
 *	// ..produces the text:
 *	"Le Feux BEAR"
 *
 *	@example
 *	// Within a scope, both `id` and the definition are namespaced..
 *	<IntlProvider scope="weather" definition={{ foo:'Le Feux' }}>
 *		<Text id="foo">The Foo</Text>
 *	</IntlProvider>
 *	// ..produces the text:
 *	"Le Feux"
 */
function Text(ref, ref$1) {
	var id = ref.id;
	var fallback = ref.children;
	var plural = ref.plural;
	var fields = ref.fields;
	var intl = ref$1.intl;


	var value = translate(
		id,
		intl && intl.scope,
		intl && intl.dictionary,
		fields,
		plural,
		fallback,
		intl && intl.provider || defaultProvider
	);

	return h( HighlightI18N, { id: id, value: value });
}

/** Translates the property values in an Object, returning a copy.
 *	**Note:** By default, `String` keys will be treated as Intl ID's.
 *	Pass `true` to return an Object containing *only* translated
 *	values where the prop is a <Text /> node.
 *
 *	@private
 *	@param {Object} props	An object with values to translate
 *	@param {Object} intl	An intl context object (eg: `context.intl`)
 *	@param {Boolean} [onlyTextNodes=false]	Only process `<Text />` values
 *	@returns {Object} translatedProps
 */
function translateMapping(props, intl, onlyTextNodes) {
	var out = {};
	intl = intl || {};
	props = select(props);
	for (var name in props) {
		if (props.hasOwnProperty(name) && props[name]) {
			var def = props[name];

			// if onlyTextNodes=true, skip any props that aren't <Text /> vnodes
			if (!onlyTextNodes && typeof def==='string') {
				out[name] = translate(def, intl.scope, intl.dictionary);
			}
			else if (def.type===Text) {
				// it's a <Text />, just grab its props:
				def = assign({
					// use children as fallback content
					fallback: def.props.children
				}, def.props);
				out[name] = translate(def.id, intl.scope, intl.dictionary, def.fields, def.plural, def.fallback);
			}
		}
	}
	return out;
}

/** `<Localizer />` is a Compositional Component.
 *	It "renders" out any `<Text />` values in its child's props.
 *
 *	@name Localizer
 *	@param {Object} props
 *	@param {Object} props.children	Child components with props to localize.
 *	@param {Object} context
 *	@param {Object} context.intl		[internal] dictionary and scope info
 *	@example
 *	<Localizer>
 *		<input placeholder={<Text id="username.placeholder" />} />
 *	</Localizer>
 *	// produces:
 *	<input placeholder="foo" />
 *
 *	@example
 *	<Localizer>
 *		<abbr title={<Text id="oss-title">Open Source Software</Text>}>
 *			<Text id="oss">OSS</Text>
 *		</abbr>
 *	</Localizer>
 *	// produces:
 *	<abbr title="Open Source Software">OSS</abbr>
 */
function Localizer(ref, ref$1) {
	var children = ref.children;
	var intl = ref$1.intl;

	return children && children.length
		? children.map(function (child) { return cloneElement(child, translateMapping(child.props, intl, true)); })
		: children && cloneElement(children, translateMapping(children.props, intl, true));
}

/* eslint-disable react/no-danger */

/** `<MarkupText>` is just like {@link Text} but it can also contain html markup in rendered strings.  It wraps its contents in a `<span>` tag.
 *
 *	@param {Object} props				props
 *	@param {String} props.id			Key to look up in intl dictionary, within any parent scopes (`$scope1.$scope2.$id`)
 *	@param {Object} [props.fields={}]	Values to inject into template `{{fields}}`
 *	@param {Number} [props.plural]		Integer "count", used to select plural forms
 *	@param {Object} context
 *	@param {Object} context.intl		[internal] dictionary and scope info
 *
 *	@example
 *	// If there is no dictionary in context..
 *	<MarkupText id="foo"><b>The Foo</b></MarkupText>
 *	// ..produces the vnode:
 *	<span><b>The Foo</b></span>
 *
 *	@example
 *	// Given a dictionary and some fields..
 *	<IntlProvider definition={{ foo:'Le Feux <b>{{bar}}</b>' }}>
 *		<MarkupText id="foo" fields={{ bar: 'BEAR' }}>The Foo</MarkupText>
 *	</IntlProvider>
 *	// ..produces the vnode:
 *	<span>Le Feux <b>BEAR</b></span>
 *
 *	@example
 *	// Within a scope, both `id` and the definition are namespaced..
 *	<IntlProvider scope="weather" definition={{ foo:'Le <a href="http://foo.com">Feux</a>' }}>
 *		<MarkupText id="foo">The Foo</MarkupText>
 *	</IntlProvider>
 *	// ..produces the vnode:
 *	<span>Le <a href="http://foo.com">Feux</a></span>
 *
 *	@example
 *	// renders nothing if there is no key match and no fallback
 *	<div><MarkupText /></div>
 *	// ..produces the vnode:
 *	<div/>
 */
function MarkupText(props) {
	return (
		h( Localizer, null, 
			h( Html, { html: h( Text, props), id: props.id })
		)
	);
}

function Html(ref) {
	var html = ref.html;
	var id = ref.id;

	var value = !html ? html : typeof html === 'string' ? h( 'span', { dangerouslySetInnerHTML: { __html: html } }) : h( 'span', null, html ) ;
	return h( HighlightI18N, { id: id, value: value });
}

/** `@withText()` is a Higher Order Component, often used as a decorator.
 *
 *	It wraps a child component and passes it translations
 *	based on a mapping to the dictionary & scope in context.
 *
 *	@param {Object|Function|String} mapping		Maps prop names to intl keys (or `<Text>` nodes).
 *
 *	@example @withText({
 *		placeholder: 'user.placeholder'
 *	})
 *	class Foo {
 *		// now the `placeholder` prop is our localized String:
 *		render({ placeholder }) {
 *			return <input placeholder={placeholder} />
 *		}
 *	}
 *
 *	@example @withText({
 *		placeholder: <Text id="user.placeholder">fallback text</Text>
 *	})
 *	class Foo {
 *		render({ placeholder }) {
 *			return <input placeholder={placeholder} />
 *		}
 *	}
 *
 *	@example @withText('user.placeholder')
 *	class Foo {
 *		// for Strings/Arrays, the last path segment becomes the prop name:
 *		render({ placeholder }) {
 *			return <input placeholder={placeholder} />
 *		}
 *	}
 *
 *	@example <caption>Works with functional components, too</caption>
 *	const Foo = withText('user.placeholder')( props =>
 *		<input placeholder={props.placeholder} />
 *	)
 *
 * 	@example <caption>getWrappedComponent() returns wrapped child Component</caption>
 *	const Foo = () => <div/>;
 *	const WrappedFoo = withText('user.placeholer')(Foo);
 *	WrappedFoo.getWrappedComponent() === Foo; // true
 */
function withText(mapping) {
	return function withTextWrapper(Child) {
		function WithTextWrapper(props, context) {
			var map = typeof mapping==='function' ? mapping(props, context) : mapping;
			var translations = translateMapping(map, context.intl);
			return h(Child, assign(assign({}, props), translations));
		}

		WithTextWrapper.getWrappedComponent = Child && Child.getWrappedComponent || (function () { return Child; });
		return WithTextWrapper;
	};
}

intl.intl = intl;
intl.IntlProvider = IntlProvider;
intl.Text = Text;
intl.MarkupText = MarkupText;
intl.Localizer = Localizer;
intl.withText = withText;

export default intl;
export { IntlProvider, Localizer, MarkupText, Text, intl, withText };
//# sourceMappingURL=preact-i18n.esm.js.map
