;

export function walk(tree, pre, post) {
  tree = pre(tree);
  tree.children = tree.children.map(tree => walk(tree, pre, post));
  return post(tree);
}

export function  prewalk(tree, f) { return walk(tree, f, x => x); }
export function postwalk(tree, f) { return walk(tree, x => Object.assign({}, x), f); }
export function   prefor(tree, f) { return prewalk(tree, x => {f(x); return x}); }
