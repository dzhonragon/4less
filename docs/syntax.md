---
title: Syntax Reference
description: Complete reference for all 4less language constructs.
order: 2
---

## Elements

An element is a tag name, optionally followed by class shorthand, ID shorthand, text content, key-value attributes, and a `{ }` block for children:

```
tag.class#id "text content" key:"value" {
  child
}
```

All parts are optional. A bare `div` emits `<div></div>`.

## Classes and IDs

Use dot notation for classes and hash notation for IDs:

```
div.container         → <div class="container">
div.flex.items-center → <div class="flex items-center">
section#hero          → <section id="hero">
div.card#main         → <div class="card" id="main">
article.prose.dark    → <article class="prose dark">
```

Multiple dots chain classes. Order matches the source order.

## Text Content

Place a quoted string or `$variable` directly after the tag and shorthand modifiers:

```
h1 "Page title"
p "Welcome, " $name "!"
span $label
```

Text segments are concatenated in order. Mixing string literals and variables is supported.

## Attributes

Key-value pairs follow text content, separated by spaces:

```
a "Read docs" href:"/docs" target:"_blank"
input type:"email" placeholder:"you@example.com" required:"true"
img src:"/logo.png" alt:"Logo" width:"64" height:"64"
```

Attribute values must be quoted strings. Boolean attributes use the string `"true"`.

### Variable interpolation in attributes

Embed `$variable` references inside attribute value strings, or use a bare `$var` as the entire value:

```
a "Read post" href:"/posts/$slug"
img src:"/avatars/$userId.jpg" alt:$username
a $label href:"/$lang/docs/$page"
```

```ts
compile(src, { slug: 'hello-world', userId: '42', username: 'Alice', lang: 'en', label: 'Docs', page: 'intro' });
// → <a href="/posts/hello-world">Read post</a>
// → <img src="/avatars/42.jpg" alt="Alice"/>
// → <a href="/en/docs/intro">Docs</a>
```

Unresolved variables render as `{{varName}}` in HTML (same as text variables).

**Output per generator:**

| Source | HTML | React | Vue | Astro |
| --- | --- | --- | --- | --- |
| `href:"/p/$slug"` | `/p/value` | `` href: `/p/${slug}` `` | `:href="\`/p/${slug}\`"` | `href={\`/p/${slug}\`}` |
| `href:$url` | `value` | `` href: `${url}` `` | `:href="\`${url}\`"` | `href={\`${url}\`}` |
| `href:"/home"` | `/home` | `href: "/home"` | `href="/home"` | `href="/home"` |

Variables also work inside component props and loop bodies:

```
component NavLink {
  a $label href:"/$path"
}

NavLink label:"Home" path:"home"
NavLink label:"Docs" path:"docs"
```

```
ul {
  for post in posts: li {
    a $post href:"/posts/$post"
  }
}
```

## Children

Use `{ }` to nest child elements. Indentation is optional but recommended:

```
ul {
  li "First item"
  li "Second item"
  li "Third item"
}
```

Nesting is unlimited:

```
div.card {
  div.card__header {
    h2 "Title"
    span.badge "new"
  }
  div.card__body {
    p $description
  }
}
```

## Variables

Declare variables with `$name` in text positions or inside attribute strings. Pass values at compile time via the `vars` option:

```
div {
  h1 $title
  p $description
  a "Read more" href:"/posts/$slug"
}
```

```ts
compile(src, {
  title:       'Getting started',
  description: 'Write less HTML.',
  slug:        'getting-started',
});
```

Variable values can be strings, arrays (for loops), or booleans (for conditionals).

## Loops

Iterate over an array variable with `for item in collection: element`:

```
ul {
  for skill in skills: li $skill
}
```

```ts
compile(src, { skills: ['TypeScript', 'React', 'Tailwind'] });
// → <ul><li>TypeScript</li><li>React</li><li>Tailwind</li></ul>
```

The loop body is a single element. Wrap in a container element to emit multiple children per iteration:

```
for card in cards: div.card {
  h3 $title
  p $body
}
```

The item variable (`skill`, `card`) becomes the active `$variable` inside the loop body. Loop variables shadow outer variables of the same name.

## Conditionals

Render an element conditionally with `if condition: element`:

```
div {
  if isAdmin: p "Admin panel"
  p "Public content"
}
```

The condition is truthy when the variable is set and not falsy (empty string, `"false"`, `"0"`, boolean `false`, or absent).

### Negation

Prefix the condition with `!` to negate it:

```
if !isHidden: div.banner {
  p "This is visible when isHidden is falsy"
}
```

### Else

Optionally add `else:` immediately after the if-body:

```
if isLoggedIn: p "Welcome back!"
else: p "Please log in."
```

### Else-if

Chain conditions with `else-if condition:`:

```
if isPremium: span.badge "Premium"
else-if isTrial: span.badge "Trial"
else: span.badge "Free"
```

Conditionals can wrap any element, including containers:

```
if showBanner: div.banner {
  p $bannerText
  a "Dismiss" href:"#"
}
else: div.placeholder {
  p "No banner today."
}
```

## Components

Define reusable components with `component Name { body }`. Names must start with an uppercase letter:

```
component Badge {
  span.badge $label
}

Badge label:"stable"
Badge label:"v2.0"
```

Props are passed as key-value attributes and become `$variables` inside the component body:

```
component Card {
  div.card {
    h3 $title
    p $body
    a "Read more" href:"/posts/$slug"
  }
}

Card title:"Getting started" body:"Install in seconds." slug:"getting-started"
Card title:"Zero deps"      body:"No runtime bloat."  slug:"api-reference"
```

Components can be nested — a component may call another component:

```
component Avatar {
  img.avatar src:$src alt:$name
}

component UserRow {
  div.user-row {
    Avatar src:$photo name:$name
    span $name
  }
}

UserRow name:"Alice" photo:"/alice.jpg"
```

Component definitions are hoisted. You can call a component before it is defined in the source. Recursive calls are not supported.

## Void Elements

Standard HTML void elements are self-closed automatically. No special syntax needed:

```
input type:"text" placeholder:"Search"
→ <input type="text" placeholder="Search"/>

img src:"/logo.png" alt:"Logo"
→ <img src="/logo.png" alt="Logo"/>

hr
→ <hr/>

br
→ <br/>
```

Void elements: `area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`, `param`, `source`, `track`, `wbr`.
