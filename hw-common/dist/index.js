import { Subject, take, firstValueFrom } from 'rxjs';
import { weiToEth, chainValidation, validate, SofiaProRegular, SofiaProLight } from '@web3-onboard/common';
import Joi from 'joi';

function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
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
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
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
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
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
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1; // no option should be selected
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
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

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
            // if the component was destroyed immediately
            // it will update the `$$.on_destroy` reference to `null`.
            // the destructured on_destroy may still reference to the old array
            if (component.$$.on_destroy) {
                component.$$.on_destroy.push(...new_on_destroy);
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
        ctx: [],
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
        if (!is_function(callback)) {
            return noop;
        }
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

/* src/elements/CloseButton.svelte generated by Svelte v3.52.0 */

function add_css$6(target) {
	append_styles(target, "svelte-h7wb50", ".close-button-container.svelte-h7wb50{cursor:pointer;display:flex;justify-content:center;align-items:center}.close-button.svelte-h7wb50{width:2rem;height:2rem;box-sizing:border-box;display:flex;justify-content:center;align-items:center;padding:0.4rem;border-radius:40px;color:var(--onboard-gray-400, var(--gray-400));background:var(--onboard-white, var(--white))}.close-icon.svelte-h7wb50{width:14px;display:flex;align-items:center}");
}

function create_fragment$6(ctx) {
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
		init(this, options, null, create_fragment$6, safe_not_equal, {}, add_css$6);
	}
}

/* src/elements/AddressTable.svelte generated by Svelte v3.52.0 */

function add_css$5(target) {
	append_styles(target, "svelte-plecs0", "table.svelte-plecs0.svelte-plecs0{border-spacing:0px}table.svelte-plecs0 thead.svelte-plecs0{position:sticky;inset-block-start:0;box-shadow:0px 1px 0px rgba(0, 0, 0, 0.1);background:var(--account-select-white, var(--onboard-white, var(--white)))}th.svelte-plecs0.svelte-plecs0,td.svelte-plecs0.svelte-plecs0{text-align:left;padding:0.5rem 0.5rem}td.svelte-plecs0.svelte-plecs0{font-family:var(\n      --account-select-font-family-normal,\n      var(--font-family-normal)\n    );font-style:normal;font-weight:normal;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-font-line-height-1, var(--font-line-height-1))\n    )}tbody.svelte-plecs0 tr.svelte-plecs0{box-shadow:0px 1px 0px rgba(0, 0, 0, 0.1)}tbody.svelte-plecs0 tr.svelte-plecs0:hover{background:var(\n      --account-select-primary-100,\n      var(--onboard-primary-100, var(--primary-100))\n    );color:var(--account-select-black, var(--onboard-black, var(--black)))}.address-table.svelte-plecs0.svelte-plecs0{min-height:4.5rem;max-height:27rem;overflow:auto}.selected-row.svelte-plecs0.svelte-plecs0,.selected-row.svelte-plecs0.svelte-plecs0:hover{background:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );color:var(\n      --account-select-primary-100,\n      var(--onboard-primary-100, var(--primary-100))\n    )}.asset-td.svelte-plecs0.svelte-plecs0{font-weight:bold}.w-100.svelte-plecs0.svelte-plecs0{width:100%}.pointer.svelte-plecs0.svelte-plecs0{cursor:pointer}");
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (105:6) {#if accounts && accounts.length}
function create_if_block$4(ctx) {
	let each_1_anchor;
	let each_value = /*accounts*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*accountSelected, accounts, handleSelectedRow, weiToEth*/ 7) {
				each_value = /*accounts*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (106:8) {#each accounts as account}
function create_each_block$1(ctx) {
	let tr;
	let td0;
	let t0_value = /*account*/ ctx[6].address + "";
	let t0;
	let t1;
	let td1;
	let t2_value = /*account*/ ctx[6].derivationPath + "";
	let t2;
	let t3;
	let td2;
	let t4_value = weiToEth(/*account*/ ctx[6].balance.value.toString()) + "";
	let t4;
	let t5;
	let t6_value = /*account*/ ctx[6].balance.asset + "";
	let t6;
	let t7;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[5](/*account*/ ctx[6]);
	}

	return {
		c() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			t4 = text(t4_value);
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			set_style(td0, "font-family", "'Courier New', Courier, monospace");
			attr(td0, "class", "svelte-plecs0");
			attr(td1, "class", "svelte-plecs0");
			attr(td2, "class", "asset-td svelte-plecs0");
			attr(tr, "class", "pointer svelte-plecs0");
			toggle_class(tr, "selected-row", /*accountSelected*/ ctx[0] && /*accountSelected*/ ctx[0].address === /*account*/ ctx[6].address);
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(tr, t3);
			append(tr, td2);
			append(td2, t4);
			append(td2, t5);
			append(td2, t6);
			append(tr, t7);

			if (!mounted) {
				dispose = listen(tr, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*accounts*/ 2 && t0_value !== (t0_value = /*account*/ ctx[6].address + "")) set_data(t0, t0_value);
			if (dirty & /*accounts*/ 2 && t2_value !== (t2_value = /*account*/ ctx[6].derivationPath + "")) set_data(t2, t2_value);
			if (dirty & /*accounts*/ 2 && t4_value !== (t4_value = weiToEth(/*account*/ ctx[6].balance.value.toString()) + "")) set_data(t4, t4_value);
			if (dirty & /*accounts*/ 2 && t6_value !== (t6_value = /*account*/ ctx[6].balance.asset + "")) set_data(t6, t6_value);

			if (dirty & /*accountSelected, accounts*/ 3) {
				toggle_class(tr, "selected-row", /*accountSelected*/ ctx[0] && /*accountSelected*/ ctx[0].address === /*account*/ ctx[6].address);
			}
		},
		d(detaching) {
			if (detaching) detach(tr);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$5(ctx) {
	let div;
	let table;
	let colgroup;
	let t2;
	let thead;
	let t8;
	let tbody;
	let if_block = /*accounts*/ ctx[1] && /*accounts*/ ctx[1].length && create_if_block$4(ctx);

	return {
		c() {
			div = element("div");
			table = element("table");
			colgroup = element("colgroup");

			colgroup.innerHTML = `<col style="width: 50%;"/> 
      <col style="width: 28%;"/> 
      <col style="width: 22%;"/>`;

			t2 = space();
			thead = element("thead");

			thead.innerHTML = `<tr><th class="svelte-plecs0">Address</th> 
        <th class="svelte-plecs0">DPATH</th> 
        <th class="svelte-plecs0">Asset</th></tr>`;

			t8 = space();
			tbody = element("tbody");
			if (if_block) if_block.c();
			attr(thead, "class", " svelte-plecs0");
			attr(tbody, "class", "svelte-plecs0");
			attr(table, "class", "w-100 svelte-plecs0");
			attr(div, "class", "address-table svelte-plecs0");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, table);
			append(table, colgroup);
			append(table, t2);
			append(table, thead);
			append(table, t8);
			append(table, tbody);
			if (if_block) if_block.m(tbody, null);
		},
		p(ctx, [dirty]) {
			if (/*accounts*/ ctx[1] && /*accounts*/ ctx[1].length) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(tbody, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let accounts;
	let { accountsListObject } = $$props;
	let { accountSelected = undefined } = $$props;
	let { showEmptyAddresses } = $$props;

	const handleSelectedRow = accountClicked => {
		$$invalidate(0, accountSelected = accountClicked);
	};

	const click_handler = account => handleSelectedRow(account);

	$$self.$$set = $$props => {
		if ('accountsListObject' in $$props) $$invalidate(3, accountsListObject = $$props.accountsListObject);
		if ('accountSelected' in $$props) $$invalidate(0, accountSelected = $$props.accountSelected);
		if ('showEmptyAddresses' in $$props) $$invalidate(4, showEmptyAddresses = $$props.showEmptyAddresses);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*showEmptyAddresses, accountsListObject*/ 24) {
			$$invalidate(1, accounts = showEmptyAddresses
			? accountsListObject && accountsListObject.all
			: accountsListObject && accountsListObject.filtered);
		}
	};

	return [
		accountSelected,
		accounts,
		handleSelectedRow,
		accountsListObject,
		showEmptyAddresses,
		click_handler
	];
}

class AddressTable extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$5,
			create_fragment$5,
			safe_not_equal,
			{
				accountsListObject: 3,
				accountSelected: 0,
				showEmptyAddresses: 4
			},
			add_css$5
		);
	}
}

/* src/elements/Spinner.svelte generated by Svelte v3.52.0 */

function add_css$4(target) {
	append_styles(target, "svelte-14p0oc3", ".loading-container.svelte-14p0oc3.svelte-14p0oc3{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit;font-size:inherit;color:inherit;margin-left:auto}span.svelte-14p0oc3.svelte-14p0oc3{font-family:inherit;font-size:0.889em;margin-top:1rem}.loading.svelte-14p0oc3.svelte-14p0oc3{display:inline-block;position:relative}.loading.svelte-14p0oc3 div.svelte-14p0oc3{box-sizing:border-box;font-size:inherit;display:block;position:absolute;border:3px solid;border-radius:50%;animation:svelte-14p0oc3-bn-loading 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;border-color:currentColor transparent transparent transparent}.loading.svelte-14p0oc3 .loading-first.svelte-14p0oc3{animation-delay:-0.45s}.loading.svelte-14p0oc3 .loading-second.svelte-14p0oc3{animation-delay:-0.3s}.loading.svelte-14p0oc3 .loading-third.svelte-14p0oc3{animation-delay:-0.15s}@keyframes svelte-14p0oc3-bn-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}");
}

// (68:2) {#if description}
function create_if_block$3(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*description*/ ctx[0]);
			attr(span, "class", "svelte-14p0oc3");
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

function create_fragment$4(ctx) {
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
	let if_block = /*description*/ ctx[0] && create_if_block$3(ctx);

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
			attr(div0, "class", "loading-first svelte-14p0oc3");
			attr(div0, "style", div0_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div1, "class", "loading-second svelte-14p0oc3");
			attr(div1, "style", div1_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div2, "class", "loading-third svelte-14p0oc3");
			attr(div2, "style", div2_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div3, "class", "loading svelte-14p0oc3");
			attr(div3, "style", div3_style_value = `height: ${/*size*/ ctx[1]}; width: ${/*size*/ ctx[1]};`);
			attr(div4, "class", "loading-container svelte-14p0oc3");
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
					if_block = create_if_block$3(ctx);
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

function instance$4($$self, $$props, $$invalidate) {
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
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { description: 0, size: 1 }, add_css$4);
	}
}

/* src/elements/TableHeader.svelte generated by Svelte v3.52.0 */

function add_css$3(target) {
	append_styles(target, "svelte-136hz7m", "button.svelte-136hz7m{align-items:center;padding:0.75rem 1.5rem;color:var(--account-select-white, var(--onboard-white, var(--white)));border-radius:1.5rem;font-family:var(\n      --account-select-font-family-normal,\n      var(--font-family-normal, var(--font-family-normal))\n    );font-style:normal;font-weight:bold;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-line-height-1, var(--line-height-1))\n    );border:none}.scan-accounts-btn.svelte-136hz7m{line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-line-height-1, var(--line-height-1))\n    );background:var(\n      --account-select-gray-500,\n      var(--onboard-gray-500, var(--gray-500))\n    );color:var(\n      --account-select-primary-100,\n      var(--onboard-primary-100, var(--primary-100))\n    );display:flex;justify-content:center;align-items:center;cursor:pointer}input.svelte-136hz7m:hover{border-color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-300, var(--primary-300))\n    )}input.svelte-136hz7m:focus{border-color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );box-shadow:0 0 1px 1px\n      var(\n        --account-select-primary-500,\n        var(--onboard-primary-500, var(--primary-500))\n      );box-shadow:0 0 0 1px -moz-mac-focusring;outline:none}input.svelte-136hz7m:disabled{background:var(\n      --account-select-gray-100,\n      var(--onboard-gray-100, var(--gray-100))\n    )}input[type='checkbox'].svelte-136hz7m{-webkit-appearance:none;width:auto;background:var(--account-select-white, var(--onboard-white, var(--white)));border:1px solid\n      var(--account-select-gray-300, var(--onboard-gray-300, var(--gray-300)));padding:0.5em;border-radius:3px;display:flex;justify-content:center;align-items:center;position:relative;cursor:pointer;height:1.5rem;width:1.5rem}input[type='checkbox'].svelte-136hz7m:hover{border-color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    )}input[type='checkbox'].svelte-136hz7m:checked{background:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );border-color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );color:var(--account-select-white, var(--onboard-white, var(--white)))}input[type='checkbox'].svelte-136hz7m:checked:after{content:url(\"data:image/svg+xml,%3Csvg width='0.885em' height='0.6em' viewBox='0 0 14 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 6L5 11L14 2L12.59 0.58L5 8.17L1.41 4.59L0 6Z' fill='white'/%3E%3C/svg%3E\");font-size:var(\n      --account-select-font-size-7,\n      var(--onboard-font-size-7, var(--font-size-7))\n    );position:absolute;color:var(--account-select-white, var(--onboard-white, var(--white)))}.checkbox-container.svelte-136hz7m{display:flex;align-items:center}.checkbox-input.svelte-136hz7m{margin-right:0.75rem}.error-msg.svelte-136hz7m{color:var(\n      --account-select-danger-500,\n      var(--onboard-danger-500, var(--danger-500))\n    );font-family:var(\n      --account-select-font-family-light,\n      var(--font-family-light)\n    );font-size:var(--account-select-font-size-7, var(--font-size-7));max-width:15rem;line-height:1}.table-controls.svelte-136hz7m{height:3.5rem;display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding:0.5rem;border-radius:0.4rem 0.4rem 0 0;background:var(\n      --account-select-gray-100,\n      var(--onboard-gray-100, var(--gray-100))\n    );border-bottom:1px solid\n      var(--account-select-gray-200, var(--onboard-gray-200, var(--gray-200)))}.cursor-pointer.svelte-136hz7m{cursor:pointer}");
}

// (180:2) {#if errorFromScan}
function create_if_block_2$1(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*errorFromScan*/ ctx[3]);
			attr(span, "class", "error-msg svelte-136hz7m");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*errorFromScan*/ 8) set_data(t, /*errorFromScan*/ ctx[3]);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (188:4) {#if loadingAccounts}
function create_if_block_1$1(ctx) {
	let t;
	let spinner;
	let current;
	spinner = new Spinner({ props: { size: "1.5rem" } });

	return {
		c() {
			t = text("Scanning...\n      ");
			create_component(spinner.$$.fragment);
		},
		m(target, anchor) {
			insert(target, t, anchor);
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
			if (detaching) detach(t);
			destroy_component(spinner, detaching);
		}
	};
}

// (192:4) {#if !loadingAccounts}
function create_if_block$2(ctx) {
	let t;

	return {
		c() {
			t = text("Scan Accounts");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$3(ctx) {
	let div1;
	let div0;
	let input;
	let t0;
	let label;
	let t2;
	let t3;
	let button;
	let t4;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*errorFromScan*/ ctx[3] && create_if_block_2$1(ctx);
	let if_block1 = /*loadingAccounts*/ ctx[2] && create_if_block_1$1();
	let if_block2 = !/*loadingAccounts*/ ctx[2] && create_if_block$2();

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			input = element("input");
			t0 = space();
			label = element("label");
			label.textContent = "Show Empty Addresses";
			t2 = space();
			if (if_block0) if_block0.c();
			t3 = space();
			button = element("button");
			if (if_block1) if_block1.c();
			t4 = space();
			if (if_block2) if_block2.c();
			attr(input, "id", "show-empty-addresses");
			attr(input, "type", "checkbox");
			attr(input, "class", "checkbox-input svelte-136hz7m");
			attr(label, "for", "show-empty-addresses");
			attr(label, "class", "ml2 cursor-pointer font-5 svelte-136hz7m");
			attr(div0, "class", "checkbox-container svelte-136hz7m");
			attr(button, "class", "scan-accounts-btn svelte-136hz7m");
			attr(button, "id", "scan-accounts");
			attr(div1, "class", "table-controls svelte-136hz7m");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div0, input);
			input.checked = /*showEmptyAddresses*/ ctx[0];
			append(div0, t0);
			append(div0, label);
			append(div1, t2);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t3);
			append(div1, button);
			if (if_block1) if_block1.m(button, null);
			append(button, t4);
			if (if_block2) if_block2.m(button, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[4]),
					listen(button, "click", /*click_handler*/ ctx[5])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*showEmptyAddresses*/ 1) {
				input.checked = /*showEmptyAddresses*/ ctx[0];
			}

			if (/*errorFromScan*/ ctx[3]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					if_block0.m(div1, t3);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*loadingAccounts*/ ctx[2]) {
				if (if_block1) {
					if (dirty & /*loadingAccounts*/ 4) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1$1();
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(button, t4);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (!/*loadingAccounts*/ ctx[2]) {
				if (if_block2) ; else {
					if_block2 = create_if_block$2();
					if_block2.c();
					if_block2.m(button, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { scanAccounts } = $$props;
	let { loadingAccounts } = $$props;
	let { showEmptyAddresses } = $$props;
	let { errorFromScan } = $$props;

	function input_change_handler() {
		showEmptyAddresses = this.checked;
		$$invalidate(0, showEmptyAddresses);
	}

	const click_handler = async () => await scanAccounts();

	$$self.$$set = $$props => {
		if ('scanAccounts' in $$props) $$invalidate(1, scanAccounts = $$props.scanAccounts);
		if ('loadingAccounts' in $$props) $$invalidate(2, loadingAccounts = $$props.loadingAccounts);
		if ('showEmptyAddresses' in $$props) $$invalidate(0, showEmptyAddresses = $$props.showEmptyAddresses);
		if ('errorFromScan' in $$props) $$invalidate(3, errorFromScan = $$props.errorFromScan);
	};

	return [
		showEmptyAddresses,
		scanAccounts,
		loadingAccounts,
		errorFromScan,
		input_change_handler,
		click_handler
	];
}

class TableHeader extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			safe_not_equal,
			{
				scanAccounts: 1,
				loadingAccounts: 2,
				showEmptyAddresses: 0,
				errorFromScan: 3
			},
			add_css$3
		);
	}
}

/* src/views/AccountSelect.svelte generated by Svelte v3.52.0 */

function add_css$2(target) {
	append_styles(target, "svelte-95jz81", "select.svelte-95jz81{display:block;margin:0;-moz-appearance:none;-webkit-appearance:none;appearance:none;font-family:inherit;background-image:url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23242835%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'),\n      linear-gradient(to bottom, transparent 0%, transparent 100%);background-repeat:no-repeat, repeat;background-position:right 1rem top 1rem, 0 0;background-size:0.65em auto, 100%;scrollbar-width:none;width:100%;padding:0.5rem 1.8rem 0.5rem 1rem;border-radius:8px;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-font-line-height-1, var(--font-line-height-1))\n    );color:var(\n      --account-select-gray-600,\n      var(--onboard-gray-600, var(--gray-600))\n    );transition:all 200ms ease-in-out;border:2px solid\n      var(--account-select-gray-200, var(--onboard-gray-200, var(--gray-200)));box-sizing:border-box;height:3rem;-ms-overflow-style:none}select.svelte-95jz81::-webkit-scrollbar,input.svelte-95jz81::-webkit-scrollbar{display:none}select.svelte-95jz81::-ms-expand,input.svelte-95jz81::-ms-expand{display:none}input[type='text'].svelte-95jz81{display:block;margin:0;-moz-appearance:none;-webkit-appearance:none;appearance:none;scrollbar-width:none;width:100%;padding:0.5rem 2.6rem 0.5rem 1rem;border-radius:8px;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-font-line-height-1, var(--font-line-height-1))\n    );color:var(\n      --account-select-gray-600,\n      var(--onboard-gray-600, var(--gray-600))\n    );transition:all 200ms ease-in-out;border:2px solid\n      var(--account-select-gray-200, var(--onboard-gray-200, var(--gray-200)));box-sizing:border-box;height:3rem;-ms-overflow-style:none}button.svelte-95jz81{align-items:center;padding:0.75rem 1.5rem;color:var(--account-select-white, var(--onboard-white, var(--white)));border-radius:1.5rem;font-family:var(\n      --account-select-font-family-normal,\n      var(--onboard-font-family-normal, var(--font-family-normal))\n    );font-style:normal;font-weight:bold;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-line-height-1, var(--line-height-1))\n    );border:none}.connect-btn.svelte-95jz81:disabled{background:var(\n      --account-select-primary-300,\n      var(--onboard-primary-300, var(--primary-300))\n    );cursor:default}.connect-btn.svelte-95jz81{background:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );cursor:pointer}.dismiss-action.svelte-95jz81{color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );cursor:pointer;margin-left:var(\n      --account-select-margin-4,\n      var(--onboard-margin-4, var(--margin-4))\n    )}select.svelte-95jz81:hover,input.svelte-95jz81:hover{border-color:var(\n      --account-select-primary-300,\n      var(--onboard-primary-300, var(--primary-300))\n    )}select.svelte-95jz81:focus,input.svelte-95jz81:focus{border-color:var(\n      --account-select-primary-500,\n      var(--onboard-primary-500, var(--primary-500))\n    );box-shadow:0 0 1px 1px\n      var(\n        --account-select-primary-500,\n        var(--onboard-primary-500, var(--primary-500))\n      );box-shadow:0 0 0 1px -moz-mac-focusring;outline:none}select.svelte-95jz81:disabled{background:var(\n      --account-select-gray-100,\n      var(--onboard-gray-100, var(--gray-100))\n    )}option.svelte-95jz81{font-weight:300}.close.svelte-95jz81{cursor:pointer;padding:0.5rem}.container.svelte-95jz81{font-family:var(\n      --account-select-font-family-normal,\n      var(--onboard-font-family-normal, var(--font-family-normal))\n    );color:var(--account-select-black, var(--onboard-black, var(--black)));position:fixed;top:0;right:0;z-index:var(\n      --onboard-account-select-modal-z-index,\n      var(--account-select-modal-z-index)\n    );display:flex;width:100vw;height:100vh;align-items:center;justify-content:center;backdrop-filter:blur(4px);background-color:rgba(0, 0, 0, 0.2)}.hardware-connect-modal.svelte-95jz81{width:50rem;max-height:51.75rem;display:table;background:var(--account-select-white, var(--onboard-white, var(--white)));box-shadow:var(\n      --account-select-shadow-1,\n      var(--onboard-shadow-1, var(--shadow-1))\n    );border-radius:1.5rem}.account-select-modal-position.svelte-95jz81{position:absolute;top:var(\n      --onboard-account-select-modal-top,\n      var(--account-select-modal-top)\n    );bottom:var(\n      --onboard-account-select-modal-bottom,\n      var(--account-select-modal-bottom)\n    );left:var(\n      --onboard-account-select-modal-left,\n      var(--account-select-modal-left)\n    );right:var(\n      --onboard-account-select-modal-right,\n      var(--account-select-modal-right)\n    )}.connect-wallet-header.svelte-95jz81{position:relative;background:var(\n      --account-select-gray-100,\n      var(--onboard-gray-100, var(--gray-100))\n    );border-radius:1.5rem 1.5rem 0 0;display:flex;justify-content:space-between;align-items:center;width:100%}.modal-controls.svelte-95jz81{display:flex;justify-content:space-between;align-items:center;padding:1rem;padding-top:0}.control-label.svelte-95jz81{font-family:var(\n      --account-select-font-family-normal,\n      var(--onboard-font-family-normal, var(--font-family-normal))\n    );font-style:normal;font-weight:bold;font-size:var(\n      --account-select-font-size-5,\n      var(--onboard-font-size-5, var(--font-size-5))\n    );line-height:var(\n      --account-select-font-line-height-1,\n      var(--onboard-font-line-height-1, var(--font-line-height-1))\n    );margin-top:var(\n      --account-select-margin-5,\n      var(--onboard-margin-5, var(--margin-5))\n    );margin-bottom:var(\n      --account-select-margin-5,\n      var(--onboard-margin-5, var(--margin-5))\n    );color:var(\n      --account-select-gray-700,\n      var(--onboard-gray-700, var(--gray-700))\n    )}.base-path-select.svelte-95jz81{min-width:20rem}.asset-select.svelte-95jz81{width:6rem}.network-select.svelte-95jz81{min-width:12rem}.w-100.svelte-95jz81{width:100%}.base-path-container.svelte-95jz81{position:relative;margin-right:var(\n      --account-select-margin-5,\n      var(--onboard-margin-5, var(--margin-5))\n    )}.input-select.svelte-95jz81{background-image:url(data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23242835%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E),\n      linear-gradient(to bottom, transparent 0%, transparent 100%);background-repeat:no-repeat, repeat;background-position:center;background-size:0.65em auto, 100%;position:absolute;top:2.7rem;right:0.2rem;width:2.5rem;height:2.5rem;background:var(--account-select-white, var(--onboard-white, var(--white)));border-radius:1rem}.asset-container.svelte-95jz81{margin-right:var(\n      --account-select-margin-5,\n      var(--onboard-margin-5, var(--margin-5))\n    )}.table-section.svelte-95jz81{max-height:31.8rem;padding:1rem}.table-container.svelte-95jz81{background:var(--account-select-white, var(--onboard-white, var(--white)));border:2px solid\n      var(--account-select-gray-200, var(--onboard-gray-200, var(--gray-200)));box-sizing:border-box;border-radius:0.5rem}.address-found-count.svelte-95jz81{padding:1rem;color:var(\n      --account-select-gray-500,\n      var(--onboard-gray-500, var(--gray-500))\n    )}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[25] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[28] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	return child_ctx;
}

// (442:40) 
function create_if_block_3(ctx) {
	let select;
	let each_1_anchor;
	let mounted;
	let dispose;
	let each_value_2 = /*basePaths*/ ctx[7];
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let if_block = /*supportsCustomPath*/ ctx[10] && create_if_block_4();

	return {
		c() {
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
			if (if_block) if_block.c();
			attr(select, "class", "base-path-select svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, select, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			append(select, each_1_anchor);
			if (if_block) if_block.m(select, null);

			if (!mounted) {
				dispose = listen(select, "change", /*handleDerivationPathSelect*/ ctx[11]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*basePaths*/ 128) {
				each_value_2 = /*basePaths*/ ctx[7];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}
		},
		d(detaching) {
			if (detaching) detach(select);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (431:8) {#if customDerivationPath}
function create_if_block_2(ctx) {
	let input;
	let t;
	let span;
	let mounted;
	let dispose;

	return {
		c() {
			input = element("input");
			t = space();
			span = element("span");
			attr(input, "type", "text");
			attr(input, "class", "base-path-select svelte-95jz81");
			attr(input, "placeholder", "type/your/custom/path...");
			attr(span, "class", "input-select svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, input, anchor);
			insert(target, t, anchor);
			insert(target, span, anchor);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*handleCustomPath*/ ctx[13]),
					listen(span, "click", /*toggleDerivationPathToDropdown*/ ctx[12])
				];

				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(input);
			if (detaching) detach(t);
			if (detaching) detach(span);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (447:12) {#each basePaths as path}
function create_each_block_2(ctx) {
	let option;
	let t0_value = /*path*/ ctx[31].label + "";
	let t0;
	let t1;
	let t2_value = /*path*/ ctx[31].value + "";
	let t2;
	let t3;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = text(" - ");
			t2 = text(t2_value);
			t3 = space();
			option.__value = /*path*/ ctx[31].value;
			option.value = option.__value;
			attr(option, "class", "svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
			append(option, t2);
			append(option, t3);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (452:12) {#if supportsCustomPath}
function create_if_block_4(ctx) {
	let option;

	return {
		c() {
			option = element("option");
			option.textContent = "Custom Derivation Path";
			option.__value = "customPath";
			option.value = option.__value;
			attr(option, "class", "svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, option, anchor);
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (462:10) {#each assets as asset}
function create_each_block_1(ctx) {
	let option;
	let t0_value = /*asset*/ ctx[28].label + "";
	let t0;
	let t1;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = space();
			option.__value = /*asset*/ ctx[28];
			option.value = option.__value;
			attr(option, "class", "svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (476:10) {#each chains as chain}
function create_each_block(ctx) {
	let option;
	let t0_value = /*chain*/ ctx[25].label + "";
	let t0;
	let t1;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = space();
			option.__value = /*chain*/ ctx[25].id;
			option.value = option.__value;
			attr(option, "class", "svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (502:8) {#if showEmptyAddresses}
function create_if_block_1(ctx) {
	let t0_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].all.length || 0) + "";
	let t0;
	let t1;

	let t2_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].all.length !== 1
	? 'es'
	: '') + "";

	let t2;
	let t3;

	return {
		c() {
			t0 = text(t0_value);
			t1 = text(" total address");
			t2 = text(t2_value);
			t3 = text(" found");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
			insert(target, t2, anchor);
			insert(target, t3, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*accountsListObject*/ 1 && t0_value !== (t0_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].all.length || 0) + "")) set_data(t0, t0_value);

			if (dirty[0] & /*accountsListObject*/ 1 && t2_value !== (t2_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].all.length !== 1
			? 'es'
			: '') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
			if (detaching) detach(t2);
			if (detaching) detach(t3);
		}
	};
}

// (508:8) {#if !showEmptyAddresses}
function create_if_block$1(ctx) {
	let t0_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].filtered.length || 0) + "";
	let t0;
	let t1;

	let t2_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].filtered.length !== 1
	? 'es'
	: '') + "";

	let t2;
	let t3;

	return {
		c() {
			t0 = text(t0_value);
			t1 = text(" total\n          address");
			t2 = text(t2_value);
			t3 = text(" found");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
			insert(target, t2, anchor);
			insert(target, t3, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*accountsListObject*/ 1 && t0_value !== (t0_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].filtered.length || 0) + "")) set_data(t0, t0_value);

			if (dirty[0] & /*accountsListObject*/ 1 && t2_value !== (t2_value = (/*accountsListObject*/ ctx[0] && /*accountsListObject*/ ctx[0].filtered.length !== 1
			? 'es'
			: '') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
			if (detaching) detach(t2);
			if (detaching) detach(t3);
		}
	};
}

function create_fragment$2(ctx) {
	let div10;
	let div9;
	let header;
	let div0;
	let t0;
	let div1;
	let closebutton;
	let t1;
	let section0;
	let div2;
	let h40;
	let t3;
	let t4;
	let div3;
	let h41;
	let t6;
	let select0;
	let t7;
	let div4;
	let h42;
	let t9;
	let select1;
	let t10;
	let section1;
	let div5;
	let tableheader;
	let updating_showEmptyAddresses;
	let t11;
	let addresstable;
	let updating_accountSelected;
	let t12;
	let section2;
	let div6;
	let t13;
	let t14;
	let div8;
	let div7;
	let t16;
	let button;
	let t17;
	let button_disabled_value;
	let div9_transition;
	let current;
	let mounted;
	let dispose;
	closebutton = new CloseButton({});

	function select_block_type(ctx, dirty) {
		if (/*customDerivationPath*/ ctx[2]) return create_if_block_2;
		if (!/*customDerivationPath*/ ctx[2]) return create_if_block_3;
	}

	let current_block_type = select_block_type(ctx);
	let if_block0 = current_block_type && current_block_type(ctx);
	let each_value_1 = /*assets*/ ctx[8];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	let each_value = /*chains*/ ctx[9];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	function tableheader_showEmptyAddresses_binding(value) {
		/*tableheader_showEmptyAddresses_binding*/ ctx[21](value);
	}

	let tableheader_props = {
		scanAccounts: /*scanAccountsWrap*/ ctx[14],
		loadingAccounts: /*loadingAccounts*/ ctx[4],
		errorFromScan: /*errorFromScan*/ ctx[5]
	};

	if (/*showEmptyAddresses*/ ctx[3] !== void 0) {
		tableheader_props.showEmptyAddresses = /*showEmptyAddresses*/ ctx[3];
	}

	tableheader = new TableHeader({ props: tableheader_props });
	binding_callbacks.push(() => bind(tableheader, 'showEmptyAddresses', tableheader_showEmptyAddresses_binding));

	function addresstable_accountSelected_binding(value) {
		/*addresstable_accountSelected_binding*/ ctx[22](value);
	}

	let addresstable_props = {
		accountsListObject: /*accountsListObject*/ ctx[0],
		showEmptyAddresses: /*showEmptyAddresses*/ ctx[3]
	};

	if (/*accountSelected*/ ctx[1] !== void 0) {
		addresstable_props.accountSelected = /*accountSelected*/ ctx[1];
	}

	addresstable = new AddressTable({ props: addresstable_props });
	binding_callbacks.push(() => bind(addresstable, 'accountSelected', addresstable_accountSelected_binding));
	let if_block1 = /*showEmptyAddresses*/ ctx[3] && create_if_block_1(ctx);
	let if_block2 = !/*showEmptyAddresses*/ ctx[3] && create_if_block$1(ctx);

	return {
		c() {
			div10 = element("div");
			div9 = element("div");
			header = element("header");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			create_component(closebutton.$$.fragment);
			t1 = space();
			section0 = element("section");
			div2 = element("div");
			h40 = element("h4");
			h40.textContent = "Select Base Path";
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			div3 = element("div");
			h41 = element("h4");
			h41.textContent = "Asset";
			t6 = space();
			select0 = element("select");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t7 = space();
			div4 = element("div");
			h42 = element("h4");
			h42.textContent = "Network";
			t9 = space();
			select1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t10 = space();
			section1 = element("section");
			div5 = element("div");
			create_component(tableheader.$$.fragment);
			t11 = space();
			create_component(addresstable.$$.fragment);
			t12 = space();
			section2 = element("section");
			div6 = element("div");
			if (if_block1) if_block1.c();
			t13 = space();
			if (if_block2) if_block2.c();
			t14 = space();
			div8 = element("div");
			div7 = element("div");
			div7.textContent = "Dismiss";
			t16 = space();
			button = element("button");
			t17 = text("Connect");
			attr(div1, "class", "close svelte-95jz81");
			attr(header, "class", "connect-wallet-header svelte-95jz81");
			attr(h40, "class", "control-label svelte-95jz81");
			attr(div2, "class", "w-100 base-path-container svelte-95jz81");
			attr(h41, "class", "control-label svelte-95jz81");
			attr(select0, "class", "asset-select svelte-95jz81");
			if (/*scanAccountOptions*/ ctx[6]['asset'] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[19].call(select0));
			attr(div3, "class", "asset-container svelte-95jz81");
			attr(h42, "class", "control-label svelte-95jz81");
			attr(select1, "class", "network-select svelte-95jz81");
			if (/*scanAccountOptions*/ ctx[6]['chainId'] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[20].call(select1));
			attr(div4, "class", "network-container");
			attr(section0, "class", "modal-controls svelte-95jz81");
			attr(div5, "class", "w-100 table-container svelte-95jz81");
			attr(section1, "class", "table-section svelte-95jz81");
			attr(div6, "class", "address-found-count svelte-95jz81");
			attr(div7, "class", "dismiss-action svelte-95jz81");
			attr(div7, "id", "dismiss-account-select");
			attr(button, "class", "connect-btn svelte-95jz81");
			attr(button, "id", "connect-accounts");
			button.disabled = button_disabled_value = !/*accountSelected*/ ctx[1];
			attr(div8, "class", "modal-controls svelte-95jz81");
			attr(div9, "class", "hardware-connect-modal account-select-modal-position svelte-95jz81");
			attr(div10, "class", "container svelte-95jz81");
		},
		m(target, anchor) {
			insert(target, div10, anchor);
			append(div10, div9);
			append(div9, header);
			append(header, div0);
			append(header, t0);
			append(header, div1);
			mount_component(closebutton, div1, null);
			append(div9, t1);
			append(div9, section0);
			append(section0, div2);
			append(div2, h40);
			append(div2, t3);
			if (if_block0) if_block0.m(div2, null);
			append(section0, t4);
			append(section0, div3);
			append(div3, h41);
			append(div3, t6);
			append(div3, select0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(select0, null);
			}

			select_option(select0, /*scanAccountOptions*/ ctx[6]['asset']);
			append(section0, t7);
			append(section0, div4);
			append(div4, h42);
			append(div4, t9);
			append(div4, select1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select1, null);
			}

			select_option(select1, /*scanAccountOptions*/ ctx[6]['chainId']);
			append(div9, t10);
			append(div9, section1);
			append(section1, div5);
			mount_component(tableheader, div5, null);
			append(div5, t11);
			mount_component(addresstable, div5, null);
			append(div9, t12);
			append(div9, section2);
			append(section2, div6);
			if (if_block1) if_block1.m(div6, null);
			append(div6, t13);
			if (if_block2) if_block2.m(div6, null);
			append(section2, t14);
			append(section2, div8);
			append(div8, div7);
			append(div8, t16);
			append(div8, button);
			append(button, t17);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div1, "click", /*dismiss*/ ctx[16]),
					listen(select0, "change", /*select0_change_handler*/ ctx[19]),
					listen(select1, "change", /*select1_change_handler*/ ctx[20]),
					listen(div7, "click", /*dismiss*/ ctx[16]),
					listen(button, "click", /*connectAccounts*/ ctx[15])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if (if_block0) if_block0.d(1);
				if_block0 = current_block_type && current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div2, null);
				}
			}

			if (dirty[0] & /*assets*/ 256) {
				each_value_1 = /*assets*/ ctx[8];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty[0] & /*scanAccountOptions, assets*/ 320) {
				select_option(select0, /*scanAccountOptions*/ ctx[6]['asset']);
			}

			if (dirty[0] & /*chains*/ 512) {
				each_value = /*chains*/ ctx[9];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*scanAccountOptions, assets*/ 320) {
				select_option(select1, /*scanAccountOptions*/ ctx[6]['chainId']);
			}

			const tableheader_changes = {};
			if (dirty[0] & /*loadingAccounts*/ 16) tableheader_changes.loadingAccounts = /*loadingAccounts*/ ctx[4];
			if (dirty[0] & /*errorFromScan*/ 32) tableheader_changes.errorFromScan = /*errorFromScan*/ ctx[5];

			if (!updating_showEmptyAddresses && dirty[0] & /*showEmptyAddresses*/ 8) {
				updating_showEmptyAddresses = true;
				tableheader_changes.showEmptyAddresses = /*showEmptyAddresses*/ ctx[3];
				add_flush_callback(() => updating_showEmptyAddresses = false);
			}

			tableheader.$set(tableheader_changes);
			const addresstable_changes = {};
			if (dirty[0] & /*accountsListObject*/ 1) addresstable_changes.accountsListObject = /*accountsListObject*/ ctx[0];
			if (dirty[0] & /*showEmptyAddresses*/ 8) addresstable_changes.showEmptyAddresses = /*showEmptyAddresses*/ ctx[3];

			if (!updating_accountSelected && dirty[0] & /*accountSelected*/ 2) {
				updating_accountSelected = true;
				addresstable_changes.accountSelected = /*accountSelected*/ ctx[1];
				add_flush_callback(() => updating_accountSelected = false);
			}

			addresstable.$set(addresstable_changes);

			if (/*showEmptyAddresses*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(div6, t13);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!/*showEmptyAddresses*/ ctx[3]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block$1(ctx);
					if_block2.c();
					if_block2.m(div6, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (!current || dirty[0] & /*accountSelected*/ 2 && button_disabled_value !== (button_disabled_value = !/*accountSelected*/ ctx[1])) {
				button.disabled = button_disabled_value;
			}
		},
		i(local) {
			if (current) return;
			transition_in(closebutton.$$.fragment, local);
			transition_in(tableheader.$$.fragment, local);
			transition_in(addresstable.$$.fragment, local);

			add_render_callback(() => {
				if (!div9_transition) div9_transition = create_bidirectional_transition(div9, fade, {}, true);
				div9_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(closebutton.$$.fragment, local);
			transition_out(tableheader.$$.fragment, local);
			transition_out(addresstable.$$.fragment, local);
			if (!div9_transition) div9_transition = create_bidirectional_transition(div9, fade, {}, false);
			div9_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div10);
			destroy_component(closebutton);

			if (if_block0) {
				if_block0.d();
			}

			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			destroy_component(tableheader);
			destroy_component(addresstable);
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (detaching && div9_transition) div9_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { selectAccountOptions } = $$props;
	let { accounts$ } = $$props;
	const { basePaths, assets, chains, scanAccounts, supportsCustomPath = true } = selectAccountOptions;
	let accountsListObject;
	let accountSelected;
	let customDerivationPath = false;
	let showEmptyAddresses = true;
	let loadingAccounts = false;
	let errorFromScan = '';

	let scanAccountOptions = {
		derivationPath: basePaths[0] && basePaths[0].value || '',
		chainId: chains[0].id || '',
		asset: assets[0] || null
	};

	const handleDerivationPathSelect = e => {
		let selectVal = e.target.value;
		if (selectVal === 'customPath') return $$invalidate(2, customDerivationPath = true);
		$$invalidate(6, scanAccountOptions.derivationPath = selectVal, scanAccountOptions);
	};

	const toggleDerivationPathToDropdown = () => {
		$$invalidate(2, customDerivationPath = false);
		$$invalidate(6, scanAccountOptions.derivationPath = basePaths[0].value, scanAccountOptions);
	};

	const handleCustomPath = e => {
		let inputVal = e.target.value;
		$$invalidate(6, scanAccountOptions.derivationPath = inputVal, scanAccountOptions);
	};

	const scanAccountsWrap = async () => {
		try {
			$$invalidate(5, errorFromScan = '');
			$$invalidate(4, loadingAccounts = true);
			const allAccounts = await scanAccounts(scanAccountOptions);

			$$invalidate(0, accountsListObject = {
				all: allAccounts,
				filtered: allAccounts.filter(account => {
					return parseFloat(weiToEth(account.balance.value.toString())) > 0;
				})
			});

			$$invalidate(4, loadingAccounts = false);
		} catch(err) {
			const { message } = err;

			if (typeof message === 'string' && message.includes('could not detect network')) {
				$$invalidate(5, errorFromScan = 'There was an error detecting connected network from RPC endpoint');
			} else {
				$$invalidate(5, errorFromScan = message || 'There was an error scanning for accounts');
			}

			$$invalidate(4, loadingAccounts = false);
		}
	};

	const connectAccounts = () => {
		if (!accountSelected) return;
		accounts$.next([accountSelected]);
		resetModal();
	};

	const dismiss = () => {
		accounts$.next([]);
		resetModal();
	};

	const resetModal = () => {
		$$invalidate(1, accountSelected = undefined);
		$$invalidate(0, accountsListObject = undefined);
		$$invalidate(3, showEmptyAddresses = true);
		$$invalidate(6, scanAccountOptions.derivationPath = basePaths[0] && basePaths[0].value || '', scanAccountOptions);
	};

	function select0_change_handler() {
		scanAccountOptions['asset'] = select_value(this);
		$$invalidate(6, scanAccountOptions);
		$$invalidate(8, assets);
	}

	function select1_change_handler() {
		scanAccountOptions['chainId'] = select_value(this);
		$$invalidate(6, scanAccountOptions);
		$$invalidate(8, assets);
	}

	function tableheader_showEmptyAddresses_binding(value) {
		showEmptyAddresses = value;
		$$invalidate(3, showEmptyAddresses);
	}

	function addresstable_accountSelected_binding(value) {
		accountSelected = value;
		$$invalidate(1, accountSelected);
	}

	$$self.$$set = $$props => {
		if ('selectAccountOptions' in $$props) $$invalidate(17, selectAccountOptions = $$props.selectAccountOptions);
		if ('accounts$' in $$props) $$invalidate(18, accounts$ = $$props.accounts$);
	};

	return [
		accountsListObject,
		accountSelected,
		customDerivationPath,
		showEmptyAddresses,
		loadingAccounts,
		errorFromScan,
		scanAccountOptions,
		basePaths,
		assets,
		chains,
		supportsCustomPath,
		handleDerivationPathSelect,
		toggleDerivationPathToDropdown,
		handleCustomPath,
		scanAccountsWrap,
		connectAccounts,
		dismiss,
		selectAccountOptions,
		accounts$,
		select0_change_handler,
		select1_change_handler,
		tableheader_showEmptyAddresses_binding,
		addresstable_accountSelected_binding
	];
}

class AccountSelect extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { selectAccountOptions: 17, accounts$: 18 }, add_css$2, [-1, -1]);
	}
}

const accounts$ = new Subject();

const basePath = Joi.object({
    label: Joi.string().required(),
    value: Joi.string().required()
});
const basePaths = Joi.array().items(basePath);
const chains = Joi.array().items(chainValidation);
const asset = Joi.object({
    label: Joi.string().required(),
    address: Joi.string()
});
const assets = Joi.array().items(asset);
const selectAccountOptions = Joi.object({
    basePaths: basePaths,
    assets: assets,
    chains: chains,
    scanAccounts: Joi.function().arity(1).required(),
    supportsCustomPath: Joi.bool()
});
const validateSelectAccountOptions = (data) => {
    return validate(selectAccountOptions, data);
};

// eslint-disable-next-line max-len
const accountSelect = async (options) => {
    if (options) {
        const error = validateSelectAccountOptions(options);
        if (error) {
            throw error;
        }
    }
    const app = mountAccountSelect(options, accounts$);
    accounts$.pipe(take(1)).subscribe(() => {
        app.$destroy();
    });
    return firstValueFrom(accounts$);
};
// eslint-disable-next-line max-len
const mountAccountSelect = (selectAccountOptions, accounts$) => {
    class AccountSelectEl extends HTMLElement {
        constructor() {
            super();
        }
    }
    if (!customElements.get('account-select')) {
        customElements.define('account-select', AccountSelectEl);
    }
    // Add Fonts to main page
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
    ${SofiaProRegular}
    ${SofiaProLight}
  `;
    document.body.appendChild(styleEl);
    // add to DOM
    const accountSelectDomElement = document.createElement('account-select');
    const target = accountSelectDomElement.attachShadow({ mode: 'open' });
    accountSelectDomElement.style.all = 'initial';
    target.innerHTML = `
    <style>
      :host {  
        /* COLORS */
        --white: white;
        --black: black;
        --primary-100: #eff1fc;
        --primary-200: #d0d4f7;
        --primary-300: #b1b8f2;
        --primary-500: #6370e5;
        --primary-600: #454ea0;
        --gray-100: #ebebed;
        --gray-200: #c2c4c9;
        --gray-300: #999ca5;
        --gray-500: #33394b;
        --gray-700: #1a1d26;
        --danger-500: #ff4f4f;

        /* FONTS */
        --font-family-normal: Sofia Pro;
        --font-family-light: Sofia Pro Light;
        --font-size-5: 1rem;
        --font-size-7: .75rem;
        --font-line-height-1: 24px;

        /* SPACING */
        --margin-4: 1rem;
        --margin-5: 0.5rem;

        /* MODAL POSITION */
        --account-select-modal-z-index: 20;
        --account-select-modal-top: unset;
        --account-select-modal-right: unset;
        --account-select-modal-bottom: unset;
        --account-select-modal-left: unset;

        /* SHADOWS */
        --shadow-1: 0px 4px 12px rgba(0, 0, 0, 0.1);
      }

    </style>
  `;
    document.body.appendChild(accountSelectDomElement);
    const app = new AccountSelect({
        target: target,
        props: {
            selectAccountOptions,
            accounts$
        }
    });
    return app;
};

/* src/elements/Modal.svelte generated by Svelte v3.52.0 */

function add_css$1(target) {
	append_styles(target, "svelte-xcex94", "aside.svelte-xcex94{display:flex;font-family:'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;justify-content:center;align-items:center;position:fixed;font-size:16px;top:0;left:0;width:100vw;height:100vh;background:rgba(0, 0, 0, 0.3);z-index:var(--onboard-common-modal-index, 20)}@media screen and (max-width: 420px){aside.svelte-xcex94{font-size:14px}}section.svelte-xcex94{display:block;box-sizing:content-box;background:#ffffff;border-radius:10px;box-shadow:0 1px 5px 0 rgba(0, 0, 0, 0.1);font-family:inherit;font-size:inherit;padding:1.33em;position:relative;overflow:hidden;max-width:37em;color:#4a4a4a}div.svelte-xcex94{height:0.66em;position:absolute;padding:0.25em;top:1.33em;right:1.33em;font-size:inherit;font-family:inherit;border-radius:5px;transition:background 200ms ease-in-out;display:flex;justify-content:center;align-items:center}div.svelte-xcex94:hover{cursor:pointer;background:#eeeeee}svg.svelte-xcex94{width:10px;height:10px}");
}

// (83:4) {#if closeable}
function create_if_block(ctx) {
	let div;
	let svg;
	let g0;
	let path;
	let g1;
	let g2;
	let g3;
	let g4;
	let g5;
	let g6;
	let g7;
	let g8;
	let g9;
	let g10;
	let g11;
	let g12;
	let g13;
	let g14;
	let g15;
	let svg_fill_value;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			svg = svg_element("svg");
			g0 = svg_element("g");
			path = svg_element("path");
			g1 = svg_element("g");
			g2 = svg_element("g");
			g3 = svg_element("g");
			g4 = svg_element("g");
			g5 = svg_element("g");
			g6 = svg_element("g");
			g7 = svg_element("g");
			g8 = svg_element("g");
			g9 = svg_element("g");
			g10 = svg_element("g");
			g11 = svg_element("g");
			g12 = svg_element("g");
			g13 = svg_element("g");
			g14 = svg_element("g");
			g15 = svg_element("g");
			attr(path, "d", "M28.228,23.986L47.092,5.122c1.172-1.171,1.172-3.071,0-4.242c-1.172-1.172-3.07-1.172-4.242,0L23.986,19.744L5.121,0.88\n              c-1.172-1.172-3.07-1.172-4.242,0c-1.172,1.171-1.172,3.071,0,4.242l18.865,18.864L0.879,42.85c-1.172,1.171-1.172,3.071,0,4.242\n              C1.465,47.677,2.233,47.97,3,47.97s1.535-0.293,2.121-0.879l18.865-18.864L42.85,47.091c0.586,0.586,1.354,0.879,2.121,0.879\n              s1.535-0.293,2.121-0.879c1.172-1.171,1.172-3.071,0-4.242L28.228,23.986z");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			attr(svg, "x", "0px");
			attr(svg, "y", "0px");
			attr(svg, "viewBox", "0 0 47.971 47.971");
			set_style(svg, "enable-background", "new 0 0 47.971 47.971");
			set_style(svg, "transition", "fill 150ms ease-in-out");
			attr(svg, "fill", svg_fill_value = /*closeHovered*/ ctx[2] ? '#4a4a4a' : '#9B9B9B');
			attr(svg, "xml:space", "preserve");
			attr(svg, "class", "svelte-xcex94");
			attr(div, "class", "bn-onboard-custom bn-onboard-modal-content-close svelte-xcex94");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, svg);
			append(svg, g0);
			append(g0, path);
			append(svg, g1);
			append(svg, g2);
			append(svg, g3);
			append(svg, g4);
			append(svg, g5);
			append(svg, g6);
			append(svg, g7);
			append(svg, g8);
			append(svg, g9);
			append(svg, g10);
			append(svg, g11);
			append(svg, g12);
			append(svg, g13);
			append(svg, g14);
			append(svg, g15);

			if (!mounted) {
				dispose = [
					listen(div, "click", function () {
						if (is_function(/*closeModal*/ ctx[0])) /*closeModal*/ ctx[0].apply(this, arguments);
					}),
					listen(div, "mouseenter", /*mouseenter_handler*/ ctx[5]),
					listen(div, "mouseleave", /*mouseleave_handler*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*closeHovered*/ 4 && svg_fill_value !== (svg_fill_value = /*closeHovered*/ ctx[2] ? '#4a4a4a' : '#9B9B9B')) {
				attr(svg, "fill", svg_fill_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$1(ctx) {
	let aside;
	let section;
	let t;
	let aside_transition;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
	let if_block = /*closeable*/ ctx[1] && create_if_block(ctx);

	return {
		c() {
			aside = element("aside");
			section = element("section");
			if (default_slot) default_slot.c();
			t = space();
			if (if_block) if_block.c();
			attr(section, "class", "bn-onboard-custom bn-onboard-modal-content svelte-xcex94");
			attr(aside, "class", "bn-onboard-custom bn-onboard-modal svelte-xcex94");
		},
		m(target, anchor) {
			insert(target, aside, anchor);
			append(aside, section);

			if (default_slot) {
				default_slot.m(section, null);
			}

			append(section, t);
			if (if_block) if_block.m(section, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(section, "click", click_handler),
					listen(aside, "click", function () {
						if (is_function(/*closeModal*/ ctx[0])) /*closeModal*/ ctx[0].apply(this, arguments);
					})
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (/*closeable*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(section, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);

			add_render_callback(() => {
				if (!aside_transition) aside_transition = create_bidirectional_transition(aside, fade, {}, true);
				aside_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			if (!aside_transition) aside_transition = create_bidirectional_transition(aside, fade, {}, false);
			aside_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(aside);
			if (default_slot) default_slot.d(detaching);
			if (if_block) if_block.d();
			if (detaching && aside_transition) aside_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

const click_handler = e => e.stopPropagation();

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	let { closeModal = () => {
		
	} } = $$props;

	let { closeable = true } = $$props;
	let closeHovered;
	const mouseenter_handler = () => $$invalidate(2, closeHovered = true);
	const mouseleave_handler = () => $$invalidate(2, closeHovered = false);

	$$self.$$set = $$props => {
		if ('closeModal' in $$props) $$invalidate(0, closeModal = $$props.closeModal);
		if ('closeable' in $$props) $$invalidate(1, closeable = $$props.closeable);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [
		closeModal,
		closeable,
		closeHovered,
		$$scope,
		slots,
		mouseenter_handler,
		mouseleave_handler
	];
}

class Modal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { closeModal: 0, closeable: 1 }, add_css$1);
	}
}

/* src/elements/Button.svelte generated by Svelte v3.52.0 */

function add_css(target) {
	append_styles(target, "svelte-3sw9wd", "button.svelte-3sw9wd{outline:none;background:inherit;font-size:0.889em;font-family:inherit;padding:0.55em 1.4em;cursor:pointer;color:#4a90e2;font-family:inherit;transition:background 150ms ease-in-out;line-height:1.15;opacity:1;transition:opacity 200ms}button.svelte-3sw9wd:focus{outline:none}.bn-onboard-prepare-button-right.svelte-3sw9wd{position:absolute;right:0}.bn-onboard-prepare-button-left.svelte-3sw9wd{position:absolute;left:0}.disabled.svelte-3sw9wd{cursor:inherit;pointer-events:none;opacity:0.4}.cta.svelte-3sw9wd{outline:1px solid #4a90e2;border-radius:40px}.cta.svelte-3sw9wd:hover{background:#ecf3fc}");
}

function create_fragment(ctx) {
	let button;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			button = element("button");
			if (default_slot) default_slot.c();
			button.disabled = /*disabled*/ ctx[2];
			attr(button, "class", "bn-onboard-custom bn-onboard-prepare-button svelte-3sw9wd");
			toggle_class(button, "disabled", /*disabled*/ ctx[2]);
			toggle_class(button, "cta", /*cta*/ ctx[3]);
			toggle_class(button, "bn-onboard-prepare-button-right", /*position*/ ctx[1] === 'right');
			toggle_class(button, "bn-onboard-prepare-button-left", /*position*/ ctx[1] === 'left');
			toggle_class(button, "bn-onboard-prepare-button-center", /*position*/ ctx[1] !== 'left' && /*position*/ ctx[1] !== 'right');
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(button, "click", function () {
					if (is_function(/*onclick*/ ctx[0])) /*onclick*/ ctx[0].apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*disabled*/ 4) {
				button.disabled = /*disabled*/ ctx[2];
			}

			if (!current || dirty & /*disabled*/ 4) {
				toggle_class(button, "disabled", /*disabled*/ ctx[2]);
			}

			if (!current || dirty & /*cta*/ 8) {
				toggle_class(button, "cta", /*cta*/ ctx[3]);
			}

			if (!current || dirty & /*position*/ 2) {
				toggle_class(button, "bn-onboard-prepare-button-right", /*position*/ ctx[1] === 'right');
			}

			if (!current || dirty & /*position*/ 2) {
				toggle_class(button, "bn-onboard-prepare-button-left", /*position*/ ctx[1] === 'left');
			}

			if (!current || dirty & /*position*/ 2) {
				toggle_class(button, "bn-onboard-prepare-button-center", /*position*/ ctx[1] !== 'left' && /*position*/ ctx[1] !== 'right');
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	let { onclick = () => {
		
	} } = $$props;

	let { position = '' } = $$props;
	let { disabled = false } = $$props;
	let { cta = true } = $$props;

	$$self.$$set = $$props => {
		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
		if ('position' in $$props) $$invalidate(1, position = $$props.position);
		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
		if ('cta' in $$props) $$invalidate(3, cta = $$props.cta);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [onclick, position, disabled, cta, $$scope, slots];
}

class Button extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				onclick: 0,
				position: 1,
				disabled: 2,
				cta: 3
			},
			add_css
		);
	}
}

const HANDLE_PIN_PRESS = 'handlePinPress';
const BUTTON_COLOR = `#EBEBED`;
const BUTTON_DOT_COLOR = `#33394B`;
const pinButton = (value, slot, width = '64px', height = '64px') => `
  <button
    class="pin-button"
    style="width: ${width}; height: ${height};"
    type="button"
    onclick="window.${HANDLE_PIN_PRESS}(${value})">
      ${slot ||
    `<svg class="pin-button-dot" viewBox="0 0 18 18" width="18" height="18">
          <circle cx="9" cy="9" r="9" ></circle>
        </svg>`}
      <div class="pin-button-bg">
  </button>
`;
const pinButtons = `
  <div class="pin-pad-buttons">
    ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(val => pinButton(val)).join('')}
  </div>
`;
const delButtonIcon = `<svg class="del-button-icon" viewBox="0 0 24 24" focusable="false" class="chakra-icon css-onkibi" aria-hidden="true"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`;
const pinPhraseInput = (modalType) => `
<form id="pin-phrase-form" class="pin-phrase-input-container">
  <input
    id="pin-phrase-input"
    placeholder="${modalType === 'pin' ? 'PIN' : ''}"
    type="password"
    autocomplete="current-password"
  />
  ${modalType === 'pin'
    ? ` <div class="del-button-wrapper">
            ${pinButton(-1, delButtonIcon, '38px', '38px')}
          </div>`
    : ''}
</form>
`;
// Contains styles used by both the pin
// entry modal and the passphrase entry modal
const baseStyles = `
  .keepkey-modal {
    max-width: 22rem;
    padding: 20px 10px;
  }
  .pin-phrase-input-container {
    display: flex;
    position: relative;
    align-items: center;
    margin: 20px 0;
    width: 100%;
  }
  #pin-phrase-input {
    background: inherit;
    font-size: 0.889em;
    font-family: inherit;
    border-width: 1px;
    border-style: solid;
    border-color: #242835;
    border-radius: 4px;
    padding-left: 0.5rem;
    padding-right: 4.1rem;
    transition: opacity 150ms ease-in-out;
    height: 42px;
    width: 100%;
    opacity: 0.6;
    outline: none;
  }
  #pin-phrase-input:hover, #pin-phrase-input:focus {
    opacity: 1;
  }
  .unlock-button {
    height: 26px;
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;
  }
  
  /* Overrides the branding on the modal*/
  .keepkey-modal + .bn-branding { visibility: hidden !important; }
  .keepkey-modal .bn-onboard-prepare-button {
    width: 100%;
  }
`;
const pinModalStyles = `
  #entry {
    align-items: center;
    display: flex;
    flex-flow: column;
    padding: 20px;
  }
  .pin-pad-buttons {
    display: grid;
    grid-template-columns: repeat(3, 75px);
    grid-template-rows: repeat(3, 75px);
    align-items: center;
    justify-items: center;
    margin-bottom: 15px;
  }
  .pin-button {
    align-items: center;
    border-radius: 6px;
    border: 1px solid ${BUTTON_COLOR};
    cursor: pointer;
    display: flex;
    justify-content: center;
    font-size: 18px;
    overflow: hidden;
    padding: 0;
    background-color: unset;
    overflow: hidden;
  }
  .pin-button-bg {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    background-color: ${BUTTON_COLOR};
    transition: opacity 100ms ease-in;
  }
  .pin-button-bg:hover {
    opacity: .2;
  }
  .pin-button-dot {
    fill: ${BUTTON_DOT_COLOR};
    position: absolute;
    pointer-events: none;
    z-index: 2;
  }
  .del-button-wrapper {
    position: absolute;
    height: 42px;
    width: 42px;
    right: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .del-button-wrapper > .pin-button {
    border: none;
  }
  .del-button-icon {
    position: absolute;
    width: 20px;
    z-index: 2;
    pointer-events: none;
  }
  .del-button-icon + div {
    opacity: .5;
  }
  .del-button-icon + div:hover {
    opacity: 1;
  }
`;
const passphraseModalStyles = `
  .keepkey-modal {
    padding: 40px 30px;
  }
`;
const pinHTML = `
    <style>${baseStyles}${pinModalStyles}</style>
    <h2>Enter Your Pin</h2>
    <p>
      Use PIN layout shown on your device to find the location to press on this pin pad.
    </p>
    <div id="entry" class="bn-onboard-custom">
      ${pinButtons}
      ${pinPhraseInput('pin')}
    </div>
  `;
const passphraseHTML = `
  <style>${baseStyles}${passphraseModalStyles}</style>
  <h2 style="margin-bottom: 35px">Enter Your Passphrase</h2>
  <div id="entry" class="bn-onboard-custom">
    ${pinPhraseInput('passphrase')}
  </div>
`;
const entryModal = (modalType, submit, cancel) => {
    const modalHtml = modalType === 'pin' ? pinHTML : passphraseHTML;
    const getInput = () => document.getElementById('pin-phrase-input');
    const deleteWindowProperties = () => {
        delete window[HANDLE_PIN_PRESS];
    };
    if (modalType === 'pin') {
        window[HANDLE_PIN_PRESS] = (value) => {
            const input = getInput();
            // A value of -1 signals a backspace
            // e.g. we delete the last char from the input
            input.value =
                value === -1 ? input.value.slice(0, -1) : input.value + value;
        };
    }
    // Creates a modal component which gets
    // mounted to the body and is passed the pin html into it's slot
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    div.className = 'keepkey-modal';
    const pinModal = new Modal({
        target: document.body,
        props: {
            closeModal: () => {
                // Cancels any action that the keepkey wallet may be doing
                cancel();
                deleteWindowProperties();
                pinModal.$destroy();
            },
            $$slots: createSlot(div),
            $$scope: {}
        }
    });
    // Submits the pin or passphrase to the Keepkey device
    const submitValue = async () => {
        const value = getInput().value;
        submit(value);
        pinModal.$destroy();
    };
    const pinPhraseForm = document.getElementById('pin-phrase-form');
    pinPhraseForm &&
        pinPhraseForm.addEventListener('submit', e => {
            e.preventDefault();
            submitValue();
        });
    // Creates a new Button component used to trigger sending the pin to Keepkey
    const entryEl = document.getElementById('entry');
    if (entryEl) {
        const span = document.createElement('span');
        span.innerHTML = `Unlock`;
        span.className = `unlock-button`;
        new Button({
            target: entryEl,
            props: {
                onclick: async () => {
                    submitValue();
                    deleteWindowProperties();
                },
                $$slots: createSlot(span),
                $$scope: {}
            }
        });
    }
};
/**
 * createSlot - creates the necessary object needed to pass
 * arbitrary html into a component's default slot
 * @param element The html element which is inserted into the components slot
 */
function createSlot(element) {
    return {
        default: [
            function () {
                return {
                    c: noop,
                    m: function mount(target, anchor) {
                        insert(target, element, anchor);
                    },
                    d: function destroy(detaching) {
                        if (detaching) {
                            detach(element);
                        }
                    },
                    l: noop
                };
            }
        ]
    };
}

/**
 * Creates the common instance used for signing
 * transactions with hardware wallets
 * @returns the initialized common instance
 */
const getCommon = async ({ customNetwork, chainId }) => {
    const { default: Common, Hardfork } = await import('@ethereumjs/common');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const CommonConstructor = Common.default || Common;
    const commonOptions = {
        // Berlin is the minimum hardfork that will allow for EIP1559
        hardfork: Hardfork.Berlin,
        // List of supported EIPS
        eips: [1559]
    };
    let common;
    try {
        common = new CommonConstructor({
            chain: customNetwork || chainId,
            ...commonOptions
        });
    }
    catch (e) {
        if (e.message && /Chain.*not supported/.test(e.message)) {
            common = CommonConstructor.custom({ chainId }, commonOptions);
        }
        else {
            throw e;
        }
    }
    return common;
};
/**
 * Takes in TransactionRequest and converts all BigNumber values to strings
 * @param transaction
 * @returns a transaction where all BigNumber properties are now strings
 */
const bigNumberFieldsToStrings = (transaction) => Object.keys(transaction).reduce((transaction, txnProperty) => ({
    ...transaction,
    ...(transaction[txnProperty].toHexString
        ? {
            [txnProperty]: transaction[txnProperty].toHexString()
        }
        : {})
}), transaction);
/**
 * Helper method for hardware wallets to build an object
 * with a request method used for making rpc requests.
 * @param getRpcUrl - callback used to get the current chain's rpc url
 * @returns An object with a request method
 * to be called when making rpc requests
 */
const getHardwareWalletProvider = (getRpcUrl) => ({
    request: ({ method, params }) => fetch(getRpcUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '42',
            method,
            params
        })
    }).then(async (res) => {
        const response = (await res.json());
        if ('error' in response) {
            throw response.error;
        }
        return response.result;
    })
});

export { accountSelect, bigNumberFieldsToStrings, entryModal, getCommon, getHardwareWalletProvider };
