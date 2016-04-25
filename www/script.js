'use strict';

//
// JS fixups
//

RegExp.escape = function(str) {
	return String(str).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1");
};

Array.prototype.clone = function(x) {
	return this.slice(0);
}

Array.prototype.remove = function(x) {
	return this.splice(x, 1)[0];
}

Array.prototype.insert = function(x, v) {
	this.splice(x, 0, v);
}

Array.prototype.swap = function (x,y) {
	let b = this[x];
	this[x] = this[y];
	this[y] = b;
	return this;
}

Array.prototype.repeat = function(times) {
	let arrays = [];
	for(let i =0; i < times; ++i) {
		arrays.push(this);
	}
	return Function.prototype.call.apply(Array.prototype.concat, arrays);
}

Array.range = function(a, b, s) {
	let start = b === undefined ? 0 : a;
	let end = b === undefined ? a : b;
	let step = s === undefined ? 1 : s;
	let result = [];
	for(let n = start; n < end; n += step) {
		result.push(n);
	}
	return result;
}

Array.prototype.permutations = function() {
	return this.reduce(function permute(res, item, key, arr) {
		return res.concat(arr.length > 1
			&& arr.slice(0, key)
				.concat(arr.slice(key + 1))
				.reduce(permute, [])
				.map(perm => [item].concat(perm))
			|| item);
	}, []);
}

Array.prototype.equals = function(other, equality) {
	if(equality === undefined) {
		equality = (a, b) => a === b;
	}
	return this.length === other.length && this.every((e, i) => equality(e, other[i]));
}

Array.prototype.unique = function(equality) {
	if(equality === undefined) {
		equality = (a, b) => a === b;
	}
	return this.filter((e,i,a) => i == a.findIndex(f => equality(e, f)));
}

// An improved join that understands a final_interjection to
// create sentences like "A, B, and C".
Array.prototype.join = function(interjection, final_interjection) {
	if(this.length == 0)
		return undefined;
	if(this.length == 1)
		return this[0];
	let result = this[0] !== undefined ? this[0] : '';
	for(let i = 1; i < this.length; ++i) {
		if(interjection !== undefined) {
			if(i < this.length - 1) {
				result += interjection;
			} else if(i === this.length - 1) {
				if(final_interjection !== undefined) {
					result += final_interjection;
				} else {
					result += interjection;
				}
			}
		}
		if(this[i] !== undefined) {
			result += this[i];
		}
	}
	return result;
}

Array.prototype.equals = function(other) {
	return this.every((e,i) => e == other[i]);
}

// Take element at position x and move it to position y, shifting
// all elements in between.
Array.prototype.reorder = function(from, to) {
	// @note this could also be done in place using a loop
	//       and a temp variable.
	// @todo test for to < from and from > to
	this.insert(to, this.remove(from));
}

let HTMLEscapeElement = document.createElement('div');
function HTMLEscape(str) {
	HTMLEscapeElement.textContent = str;
	return HTMLEscapeElement.innerHTML;
}
function HTMLUnescape(str) {
	HTMLEscapeElement.innerHTML = str;
	return HTMLEscapeElement.textContent;
}

// Work around chrome bug
// https://code.google.com/p/chromium/issues/detail?id=401699
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];


function rescale_array(node, size) {
	let template = node.children[0];
	for(var i = node.children.length; i < size + 1; ++i) {
		let inst = template.cloneNode(true);
		inst.removeAttribute('hidden');
		node.appendChild(inst);
	}
	while(node.children.length > size + 1)
		node.removeChild(node.children[node.children.length - 1]);
}

//
// Deep copy object
//

function deep_copy_object(obj) {
	return JSON.parse(JSON.stringify(obj));
}

//
// Parse URLs
//

function parse_url(url) {
	var a = document.createElement('a');
	a.href = url;
	var obj = {
		prot: a.protocol,
		host: a.hostname,
		port: a.port,
		path: a.pathname.split('/').filter(function(e){return e.length > 0;}),
		hash: a.hash.slice(1),
		query: {},
		toString: function(){return a.href},
	};
	var q = a.search.slice(1).split('&');
	for (var i = 0; i < q.length; i++) {
		var b = q[i].split('=');
		obj.query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
	}
	return obj;
}

//
// Auto scale textareas
//

function auto_scale_textarea() {
	var border = this.offsetHeight - this.clientHeight;
	var height = this.scrollHeight + border;
	height = height < 95 ? 95 : height;
	this.style.height = height + "px";
}

function rescale_textareas() {
	for(var el of document.getElementsByTagName('textarea'))
		auto_scale_textarea.call(el, []);
}

window.addEventListener('DOMContentLoaded', function() {
	rescale_textareas();
	for(var el of document.getElementsByTagName('textarea'))
		el.addEventListener('input', auto_scale_textarea);
});


//
// Super simple template engine
//

function join(node, data) {
	if(node === undefined || node === null) {
		console.error('Node undefined or null');
		return node;
	}
	if(node.constructor === String)
		return join(document.getElementById(node), data);
	if(node.dataset !== undefined) {
		if(node.dataset.arrayInstance) {
			return node; // These are handled by a preceding data-array
		}
		if(node.dataset.value !== undefined) {
			if(node.dataset.value === '')
				node.value = data;
			else if(node.dataset.value in data)
				node.value = data[node.dataset.value];
			return node;
		}
		if(node.dataset.content !== undefined) {
			if(node.dataset.content === '')
				node.textContent = data;
			else if(node.dataset.content in data)
				node.textContent = data[node.dataset.content];
			return node;
		}
		if(node.dataset.join !== undefined) {
			eval('(function(data){'+node.dataset.join+'})').apply(node, [data]);
			return node;
		}
		if(node.dataset.array !== undefined) {
			if(!('content' in node)) {
				console.error('data-array must be used on a <template> element', node);
				return node;
			}
			let a = node.dataset.array === '' ? data : data[node.dataset.array];
			if(!(a instanceof Array)) {
				console.error('Data is not an array', node, a);
				return node;
			}
			
			// Remove previous instances
			while(node.nextElementSibling && node.nextElementSibling.dataset.arrayInstance) {
				node.parentNode.removeChild(node.nextElementSibling);
			}
			
			// Create new instances
			let t = node.content.children[0];
			for(var i = 0; i < a.length; ++i) {
				join(t, a[a.length - i - 1]);
				var clone = document.importNode(t, true);
				clone.dataset.arrayInstance = true;
				node.parentNode.insertBefore(clone, node.nextSibling);
			}
			return node;
		}
	}
	if(node.join !== undefined && node.join !== Node.prototype.join) {
		node.join(data);
		return node;
	}
	for(let child of node.children)
		join(child, data);
	return node;
}

function extract(node) {
	function objectify(name, value) {
		if(value === "undefined")
			value = undefined;
		if(value === "null")
			value = null;
		if(name === '')
			return value;
		let r = {};
		r[name] = value;
		return r;
	}
	if(node.constructor == String)
		return extract(document.getElementById(node));
	if(node.dataset !== undefined) {
		if(node.dataset.value !== undefined)
			return objectify(node.dataset.value, node.value);
		if(node.dataset.content !== undefined)
			return objectify(node.dataset.content, node.textContent);
		if(node.dataset.extract !== undefined)
			return eval('(function(){'+node.dataset.extract+'})').apply(node, []);
		if(node.dataset.array !== undefined) {
			let a = [];
			for(var i = 1; i < node.children.length; ++i)
				a.push(extract(node.children[i]));
			return objectify(node.dataset.array, a);
		}
	}
	if(node.extract && node.extract !== Node.prototype.extract)
		return node.extract();
	let acc = undefined;
	for(let child of node.children) {
		let data = extract(child);
		if(data === undefined)
			continue;
		if(data instanceof Array)
			return data;
		if(!(data instanceof Object))
			return data;
		if(acc === undefined)
			acc = {};
		acc = Object.assign(acc, data);
	}
	return acc;
}

//
// Authentication using Auth0
//
// <button id="auth0-login"></button>
// <button id="auth0-logout"></button>
// <button id="auth0-register"></button>
//
var user_token = null;
var user_profile = null;
var lock = new Auth0Lock('AZmtkBN5zDGERJesFZGFS8vYJYyZTrDo', 'openeth.auth0.com');
var lock_options = {
	icon: 'buddha.png',
	authParams: {
		scope: 'openid role userid'
	}
};
function lock_callback(err, profile, token) {
	console.log(err, profile, token);
	if(err) {
		console.error(err);
		return;
	}
	
	// Store in global variables
	user_token = token;
	user_profile = profile;
	
	// Store the token for re-use
	localStorage.setItem('id_token', token);
}
function lock_try_token(token) {
	try {
		// Fetch the user profile
		lock.getProfile(token, function(err, profile) {
			lock_callback(err, profile, token);
		});
	} catch(error) {
		lock_callback(error);
	}
}

// Log in using hash token
function lock_try_hash_token() {
	var hash = lock.parseHash(window.location.hash);
	if(hash && hash.id_token) {
		// Remove the hash from the url
		window.location.hash = '';
		window.history.replaceState("", document.title,
			window.location.pathname + window.location.search);
		console.log("Hash token: ", hash.id_token);
		lock_try_token(hash.id_token);
		return true;
	}
	return false;
}

// Log in using store token
function lock_try_stored_token() {
	var token = localStorage.getItem('id_token');
	if(token) {
		console.log("LocalStorage token: ", token);
		lock_try_token(token);
		return true;
	}
	return false;
}

if(!lock_try_hash_token())
	lock_try_stored_token();

function register() {
	lock.showSignup(lock_options);
}
function login() {
	lock.show(lock_options);
}
function logout() {
	window.localStorage.removeItem('id_token');
	user_profile = null;
	user_token = null;
	lock.logout({ returnTo: window.location.href });
}

//
// PostgREST
//
// Taken from: https://github.com/calebmer/postgrest-client

function Api(url) {
	this.url = url;
	this.request = function(method, path) {
		let r = {
			method: method,
			path: this.url + path,
			headers: {},
			query: {},
			then_handler: function(data) {console.log(data)},
			catch_handler: function(error) {console.log(error)},
			payload: null,
			match: function(query) {
				Object.keys(query).forEach(key => this.eq(key, query[key]));
				return this
			},
			select: function(select) {
				this.query['select'] = select.replace(/\s/g, '');
				return this
			},
			order: function(property, ascending, nullsFirst) {
				this.query['order'] = `${property}.${ascending ? 'asc' : 'desc'}.${nullsFirst ? 'nullsfirst' : 'nullslast'}`;
				return this
			},
			range: function(from, to) {
				this.headers['Range-Unit'] = 'items';
				this.headers['Range'] = (from || '0') + '-' + (to || '');
				return this;
			},
			single: function() {
				this.headers['Prefer'] = 'plurality=singular';
				return this;
			},
			representation: function() {
				this.headers['Prefer'] = 'return=representation';
				return this;
			},
			body: function(data) {
				this.payload = data;
				return this;
			},
			send: function() {
				if(this.xhr !== undefined) {
					return this;
				}
				
				// Construct the path
				this.path += '?';
				for(let key in this.query) {
					this.path += key + '=' + encodeURIComponent(this.query[key]) +'&';
				}
				
				// Construct the XHR
				this.xhr = new XMLHttpRequest();
				this.xhr.open(this.method, this.path, true);
				
				// Add the headers
				for(let key in this.headers) {
					this.xhr.setRequestHeader(key, this.headers[key]);
				}
				
				// Set the readyState handler
				var x = this.xhr;
				var catch_handler = this.catch_handler;
				var then_handler = this.then_handler;
				this.xhr.onreadystatechange = function() {
					if(x.readyState !== 4)
						return;
					if(x.status >= 200 && x.status < 300) {
						var body = {};
						try {
							body = JSON.parse(x.responseText)
						} catch(e) {
							catch_handler("Response is not valid JSON.");
							return;
						}
						
						// Add range bounds
						var range = x.getResponseHeader('Content-Range');
						var regexp = /^(\d+)-(\d+)\/(\d+)$/
						if(Array.isArray(body) && range && regexp.test(range)) {
							var match = regexp.exec(range);
							body.from = parseInt(match[1], 10);
							body.to = parseInt(match[2], 10);
							body.fullLength = parseInt(match[3], 10);
						}
						
						// Call the handler
						then_handler(body);
					} else {
						var error = x.responseText;
						try {
							error = JSON.parse(error).message;
						}
						catch(e) {
						}
						catch_handler(error);
					}
				};
				
				// Send the request
				if(this.payload !== null) {
					this.xhr.setRequestHeader('Content-Type', 'application/json');
					
					// Work around https://github.com/begriffs/postgrest/issues/501
					function arrayConvert(object) {
						'use strict';
						if(Array.isArray(object)) {
							return '{' + object.map(arrayConvert).join(',') + '}';
						} else {
							return JSON.stringify(object);
						}
					}
					for(let key in this.payload) {
						if(Array.isArray(this.payload[key])) {
							this.payload[key] = arrayConvert(this.payload[key]);
						}
					}
					this.xhr.send(JSON.stringify(this.payload));
				} else {
					this.xhr.send();
				}
				return this;
			},
			then: function(callback) {
				this.then_handler = callback;
				return this.send();
			},
			catch: function(callback) {
				this.catch_handler = callback;
				return this.send();
			}
		}
		
		// Set default headers
		r.headers['Accept'] = 'application/json';
		r.headers['Prefer'] = path.startsWith('/rpc/') ? 'count=none' : '';
		
		// Add the user's JWT token if set
		if(user_token !== null)
			r.headers['Authorization'] = 'Bearer ' + user_token;
		
		// Quickly add all filters
		'eq gt lt gte lte like ilike is in not'.split(' ').map(filter =>
			r[filter] = (name, value) => {
				r.query[name] = `${filter}.${Array.isArray(value) ? value.join(',') : value}`
				return r;
			}
		)
		return r;
	};
	
	// Quickly add all methods
	'POST GET PATCH DELETE OPTIONS'.split(' ').map(method =>
		this[method.toLowerCase()] = (path => this.request(method, path))
	)
}
var api = new Api('/api/');