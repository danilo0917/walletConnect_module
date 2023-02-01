import { Subject, take, firstValueFrom } from 'rxjs';
import { v as validateUserEmail } from './index-455620ef.js';
import { SofiaProRegular, SofiaProLight } from '@web3-onboard/common';
import 'joi';

function noop() { }
const identity = x => x;
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}
function append(target, node) {
    target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
    const append_styles_to = get_root_for_style(target);
    if (!append_styles_to.getElementById(style_sheet_id)) {
        const style = element('style');
        style.id = style_sheet_id;
        style.textContent = styles;
        append_stylesheet(append_styles_to, style);
    }
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element.sheet;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
    return style.sheet;
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, cancelable, detail);
    return e;
}

// we need to store the information for multiple documents because a Svelte application could also contain iframes
// https://github.com/sveltejs/svelte/issues/3624
const managed_styles = new Map();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_style_information(doc, node) {
    const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
    managed_styles.set(doc, info);
    return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
    if (!rules[name]) {
        rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        managed_styles.forEach(info => {
            const { ownerNode } = info.stylesheet;
            // there is no ownerNode if it runs on jsdom.
            if (ownerNode)
                detach(ownerNode);
        });
        managed_styles.clear();
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
    else if (callback) {
        callback();
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = (program.b - t);
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: t => `opacity: ${t * o}`
    };
}

var closeIcon = `
  <svg width="100%" height="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.6569 1.75736L7.41429 6L11.6569 10.2426L10.2427 11.6569L6.00008 7.41421L1.75744 11.6569L0.343227 10.2426L4.58587 6L0.343227 1.75736L1.75744 0.343146L6.00008 4.58579L10.2427 0.343146L11.6569 1.75736Z" fill="currentColor"/>
  </svg>
`;

/* src/elements/CloseButton.svelte generated by Svelte v3.50.1 */

function add_css$2(target) {
	append_styles(target, "svelte-h7wb50", ".close-button-container.svelte-h7wb50{cursor:pointer;display:flex;justify-content:center;align-items:center}.close-button.svelte-h7wb50{width:2rem;height:2rem;box-sizing:border-box;display:flex;justify-content:center;align-items:center;padding:0.4rem;border-radius:40px;color:var(--onboard-gray-400, var(--gray-400));background:var(--onboard-white, var(--white))}.close-icon.svelte-h7wb50{width:14px;display:flex;align-items:center}");
}

function create_fragment$2(ctx) {
	let div2;
	let div1;
	let div0;

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			attr(div0, "class", "close-icon svelte-h7wb50");
			attr(div1, "class", "close-button svelte-h7wb50");
			attr(div2, "class", "close-button-container svelte-h7wb50");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, div0);
			div0.innerHTML = closeIcon;
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div2);
		}
	};
}

class CloseButton extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$2, safe_not_equal, {}, add_css$2);
	}
}

/* src/elements/Spinner.svelte generated by Svelte v3.50.1 */

function add_css$1(target) {
	append_styles(target, "svelte-febrzt", ".loading-container.svelte-febrzt.svelte-febrzt{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit;font-size:inherit;color:inherit;margin:auto}span.svelte-febrzt.svelte-febrzt{font-family:inherit;font-size:0.889em;margin-top:1rem}.loading.svelte-febrzt.svelte-febrzt{display:inline-block;position:relative}.loading.svelte-febrzt div.svelte-febrzt{box-sizing:border-box;font-size:inherit;display:block;position:absolute;border:3px solid;border-radius:50%;animation:svelte-febrzt-bn-loading 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;border-color:currentColor transparent transparent transparent}.loading.svelte-febrzt .loading-first.svelte-febrzt{animation-delay:-0.45s}.loading.svelte-febrzt .loading-second.svelte-febrzt{animation-delay:-0.3s}.loading.svelte-febrzt .loading-third.svelte-febrzt{animation-delay:-0.15s}@keyframes svelte-febrzt-bn-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}");
}

// (68:2) {#if description}
function create_if_block$1(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*description*/ ctx[0]);
			attr(span, "class", "svelte-febrzt");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*description*/ 1) set_data(t, /*description*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function create_fragment$1(ctx) {
	let div4;
	let div3;
	let div0;
	let div0_style_value;
	let t0;
	let div1;
	let div1_style_value;
	let t1;
	let div2;
	let div2_style_value;
	let div3_style_value;
	let t2;
	let if_block = /*description*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			div4 = element("div");
			div3 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = space();
			div2 = element("div");
			t2 = space();
			if (if_block) if_block.c();
			attr(div0, "class", "loading-first svelte-febrzt");
			attr(div0, "style", div0_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div1, "class", "loading-second svelte-febrzt");
			attr(div1, "style", div1_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div2, "class", "loading-third svelte-febrzt");
			attr(div2, "style", div2_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div3, "class", "loading svelte-febrzt");
			attr(div3, "style", div3_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div4, "class", "loading-container svelte-febrzt");
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div3);
			append(div3, div0);
			append(div3, t0);
			append(div3, div1);
			append(div3, t1);
			append(div3, div2);
			append(div4, t2);
			if (if_block) if_block.m(div4, null);
		},
		p(ctx, [dirty]) {
			if (dirty & /*size*/ 2 && div0_style_value !== (div0_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`)) {
				attr(div0, "style", div0_style_value);
			}

			if (dirty & /*size*/ 2 && div1_style_value !== (div1_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`)) {
				attr(div1, "style", div1_style_value);
			}

			if (dirty & /*size*/ 2 && div2_style_value !== (div2_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`)) {
				attr(div2, "style", div2_style_value);
			}

			if (dirty & /*size*/ 2 && div3_style_value !== (div3_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`)) {
				attr(div3, "style", div3_style_value);
			}

			if (/*description*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(div4, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div4);
			if (if_block) if_block.d();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { description = '' } = $$props;
	let { size = '2rem' } = $$props;

	$$self.$$set = $$props => {
		if ('description' in $$props) $$invalidate(0, description = $$props.description);
		if ('size' in $$props) $$invalidate(1, size = $$props.size);
	};

	return [description, size];
}

class Spinner extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { description: 0, size: 1 }, add_css$1);
	}
}

/* src/view/LoginModal.svelte generated by Svelte v3.50.1 */

function add_css(target) {
	append_styles(target, "svelte-1y81jlz", "input[type='text'].svelte-1y81jlz{display:block;margin:0;-moz-appearance:none;-webkit-appearance:none;appearance:none;scrollbar-width:none;width:32rem;padding:0.5rem 2.6rem 0.5rem 1rem;border-radius:8px;font-size:var(\n      --login-modal-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --login-modal-font-line-height-1,\n      var(--font-line-height-1)\n    );color:var(\n      --login-modal-gray-500,\n      var(--onboard-gray-500, var(--gray-500))\n    );transition:all 200ms ease-in-out;border:2px solid\n      var(--login-modal-gray-200, var(--onboard-gray-200, var(--gray-200)));box-sizing:border-box;height:3rem;-ms-overflow-style:none}.close-action-container.svelte-1y81jlz{position:absolute;right:0;padding:0.5rem 0.75rem}button.svelte-1y81jlz{align-items:center;padding:0.75rem 1.5rem;color:var(--login-modal-white, var(--onboard-white, var(--white)));border-radius:1.5rem;font-family:var(\n      --login-modal-font-family-normal,\n      var(--font-family-normal)\n    );font-style:normal;font-weight:bold;font-size:var(\n      --login-modal-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --login-modal-font-line-height-1,\n      var(--onboard-line-height-1, var(--line-height-1))\n    );border:none}.login-btn.svelte-1y81jlz:disabled{background:var(\n      --login-modal-primary-300,\n      var(--onboard-primary-300, var(--primary-300))\n    );cursor:default}.login-btn.svelte-1y81jlz{background:var(\n      --login-modal-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );cursor:pointer;display:inline-flex;justify-content:space-around;width:6rem}.close.svelte-1y81jlz{cursor:pointer}.form-element.svelte-1y81jlz{margin:1rem 0}.container.svelte-1y81jlz{font-family:var(\n      --login-modal-font-family-normal,\n      var(--onboard-font-family-normal, var(--font-family-normal))\n    );color:var(--login-modal-black, var(--onboard-black, var(--black)));top:0;right:0;z-index:var(--onboard-login-modal-z-index, var(--login-modal-z-index));position:absolute;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;backdrop-filter:blur(4px);background:rgba(0, 0, 0, 0.2)}.onboard-magic-login-modal.svelte-1y81jlz{min-width:36rem;max-height:51.75rem;display:table;background:var(--login-modal-white, var(--onboard-white, var(--white)));box-shadow:var(\n      --login-modal-shadow-1,\n      var(--onboard-shadow-1, var(--shadow-1))\n    );border-radius:1.5rem;text-align:center;background:var(\n      --login-modal-white,\n      var(--onboard-white, var(--white))\n    );color:var(--login-modal-black, var(--onboard-black, var(--black)))}.login-modal-position.svelte-1y81jlz{position:absolute;top:var(--onboard-login-modal-top, var(--login-modal-top));bottom:var(--onboard-login-modal-bottom, var(--login-modal-bottom));left:var(--onboard-login-modal-left, var(--login-modal-left));right:var(--onboard-login-modal-right, var(--login-modal-right))}.modal-controls.svelte-1y81jlz{display:flex;justify-content:space-between;align-items:center;padding:1rem;padding-top:0;flex-direction:column}.branding.svelte-1y81jlz{margin:var(\n      --login-modal-margin-5,\n      var(--onboard-margin-5, var(--margin-5))\n    );display:flex;align-items:center;justify-content:center}.error-msg.svelte-1y81jlz{color:var(\n      --login-modal-danger-500,\n      var(--onboard-danger-500, var(--danger-500))\n    );font-family:var(\n      --login-modal-font-family-light,\n      var(--onboard-font-family-light, var(--font-family-light))\n    )}@media all and (max-width: 520px){.onboard-magic-login-modal.svelte-1y81jlz{min-width:22rem;width:98vw}input[type='text'].svelte-1y81jlz{width:21rem}}");
}

// (228:6) {#if errorInEmail}
function create_if_block_1(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = "Please enter a valid email address";
			attr(span, "class", "error-msg svelte-1y81jlz");
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (240:8) {:else}
function create_else_block(ctx) {
	let t;

	return {
		c() {
			t = text("Login");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (238:8) {#if loading}
function create_if_block(ctx) {
	let spinner;
	let current;
	spinner = new Spinner({ props: { size: "1.5rem" } });

	return {
		c() {
			create_component(spinner.$$.fragment);
		},
		m(target, anchor) {
			mount_component(spinner, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(spinner.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(spinner.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(spinner, detaching);
		}
	};
}

function create_fragment(ctx) {
	let div3;
	let div2;
	let div0;
	let closebutton;
	let t0;
	let h2;
	let t3;
	let section;
	let input;
	let t4;
	let t5;
	let button;
	let current_block_type_index;
	let if_block1;
	let button_disabled_value;
	let t6;
	let div1;
	let div2_transition;
	let current;
	let mounted;
	let dispose;
	closebutton = new CloseButton({});
	let if_block0 = /*errorInEmail*/ ctx[1] && create_if_block_1();
	const if_block_creators = [create_if_block, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*loading*/ ctx[2]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");
			create_component(closebutton.$$.fragment);
			t0 = space();
			h2 = element("h2");
			h2.textContent = `${/*walletName*/ ctx[3]} Login`;
			t3 = space();
			section = element("section");
			input = element("input");
			t4 = space();
			if (if_block0) if_block0.c();
			t5 = space();
			button = element("button");
			if_block1.c();
			t6 = space();
			div1 = element("div");
			attr(div0, "class", "close-action-container close svelte-1y81jlz");
			attr(input, "type", "text");
			attr(input, "class", "login-credentials form-element svelte-1y81jlz");
			attr(input, "placeholder", "Email address");
			attr(button, "class", "login-btn form-element svelte-1y81jlz");
			attr(button, "id", "connect-accounts");
			button.disabled = button_disabled_value = !/*credentials*/ ctx[0];
			attr(section, "class", "modal-controls svelte-1y81jlz");
			attr(div1, "class", "branding svelte-1y81jlz");
			attr(div2, "class", "onboard-magic-login-modal login-modal-position svelte-1y81jlz");
			attr(div3, "class", "container svelte-1y81jlz");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div2);
			append(div2, div0);
			mount_component(closebutton, div0, null);
			append(div2, t0);
			append(div2, h2);
			append(div2, t3);
			append(div2, section);
			append(section, input);
			set_input_value(input, /*credentials*/ ctx[0]);
			append(section, t4);
			if (if_block0) if_block0.m(section, null);
			append(section, t5);
			append(section, button);
			if_blocks[current_block_type_index].m(button, null);
			append(div2, t6);
			append(div2, div1);
			div1.innerHTML = /*brandingHTMLString*/ ctx[4];
			current = true;

			if (!mounted) {
				dispose = [
					listen(div0, "click", /*dismiss*/ ctx[7]),
					listen(input, "input", /*input_input_handler*/ ctx[11]),
					listen(input, "input", /*input_handler*/ ctx[12]),
					listen(input, "keydown", /*submitOnEnter*/ ctx[8]),
					listen(button, "click", /*click_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*credentials*/ 1 && input.value !== /*credentials*/ ctx[0]) {
				set_input_value(input, /*credentials*/ ctx[0]);
			}

			if (/*errorInEmail*/ ctx[1]) {
				if (if_block0) ; else {
					if_block0 = create_if_block_1();
					if_block0.c();
					if_block0.m(section, t5);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index !== previous_block_index) {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block1 = if_blocks[current_block_type_index];

				if (!if_block1) {
					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block1.c();
				}

				transition_in(if_block1, 1);
				if_block1.m(button, null);
			}

			if (!current || dirty & /*credentials*/ 1 && button_disabled_value !== (button_disabled_value = !/*credentials*/ ctx[0])) {
				button.disabled = button_disabled_value;
			}
		},
		i(local) {
			if (current) return;
			transition_in(closebutton.$$.fragment, local);
			transition_in(if_block1);

			add_render_callback(() => {
				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
				div2_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(closebutton.$$.fragment, local);
			transition_out(if_block1);
			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
			div2_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			destroy_component(closebutton);
			if (if_block0) if_block0.d();
			if_blocks[current_block_type_index].d();
			if (detaching && div2_transition) div2_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let credentials = '';
	let { loginOptions } = $$props;
	let { loggedIn$ } = $$props;
	const { walletName, brandingHTMLString, emailLoginFunction } = loginOptions;
	let errorInEmail = false;
	let loading = false;

	const setErrorInEmail = () => {
		if (!errorInEmail) return;
		$$invalidate(1, errorInEmail = false);
	};

	const validateEmail = value => {
		return validateUserEmail(value);
	};

	const login = async () => {
		$$invalidate(2, loading = true);

		if (validateEmail(credentials)) {
			$$invalidate(1, errorInEmail = true);
			$$invalidate(2, loading = false);
			return;
		}

		const loginResponse = await emailLoginFunction(credentials);
		$$invalidate(2, loading = false);
		loggedIn$.next(loginResponse);
	};

	const dismiss = () => {
		loggedIn$.next(false);
		$$invalidate(2, loading = false);
	};

	const submitOnEnter = e => {
		if (e.key === 'Enter') {
			login();
		}
	};

	function input_input_handler() {
		credentials = this.value;
		$$invalidate(0, credentials);
	}

	const input_handler = () => setErrorInEmail();
	const click_handler = () => login();

	$$self.$$set = $$props => {
		if ('loginOptions' in $$props) $$invalidate(9, loginOptions = $$props.loginOptions);
		if ('loggedIn$' in $$props) $$invalidate(10, loggedIn$ = $$props.loggedIn$);
	};

	return [
		credentials,
		errorInEmail,
		loading,
		walletName,
		brandingHTMLString,
		setErrorInEmail,
		login,
		dismiss,
		submitOnEnter,
		loginOptions,
		loggedIn$,
		input_input_handler,
		input_handler,
		click_handler
	];
}

class LoginModal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { loginOptions: 9, loggedIn$: 10 }, add_css);
	}
}

const loggedIn$ = new Subject();

// eslint-disable-next-line max-len
const loginModal = async (options) => {
    if (options) {
        const error = !options;
        if (error) {
            throw error;
        }
    }
    const app = mountLoginModal(options, loggedIn$);
    loggedIn$.pipe(take(1)).subscribe(() => {
        app.$destroy();
        const modalEl = document.body.querySelector('onboard-magic-login-modal');
        modalEl && document.body.removeChild(modalEl);
    });
    return firstValueFrom(loggedIn$);
};
// eslint-disable-next-line max-len
const mountLoginModal = (loginOptions, loggedIn$) => {
    class loginModalEl extends HTMLElement {
        constructor() {
            super();
        }
    }
    if (!customElements.get('onboard-magic-login-modal')) {
        customElements.define('onboard-magic-login-modal', loginModalEl);
    }
    // Add Fonts to main page
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
    ${SofiaProRegular}
    ${SofiaProLight}
  `;
    document.body.appendChild(styleEl);
    // add to DOM
    const loginModalDomElement = document.createElement('onboard-magic-login-modal');
    const target = loginModalDomElement.attachShadow({ mode: 'open' });
    loginModalDomElement.style.all = 'initial';
    target.innerHTML = `
    <style>
      :host {  
        /* COLORS */
        --white: white;
        --black: black;
        --primary-300: #b1b8f2;
        --primary-500: #6370e5;
        --gray-200: #c2c4c9;
        --gray-500: #33394b;
        --danger-500: #ff4f4f;

        /* FONTS */
        --font-family-normal: Sofia Pro;
        --font-family-light: Sofia Pro Light;
        --font-size-5: 1rem;
        --font-line-height-1: 24px;

        /* SPACING */
        --margin-4: 1rem;
        --margin-5: 0.5rem;

        /* MODAL POSITION */
        --login-modal-z-index: 25;
        --login-modal-top: unset;
        --login-modal-right: unset;
        --login-modal-bottom: unset;
        --login-modal-left: unset;
      }

    </style>
  `;
    document.body.appendChild(loginModalDomElement);
    const app = new LoginModal({
        target: target,
        props: {
            loginOptions,
            loggedIn$
        }
    });
    return app;
};

export { loginModal as default };
